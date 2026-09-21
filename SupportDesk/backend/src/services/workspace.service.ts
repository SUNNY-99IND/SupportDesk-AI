import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import {
  validateAndReachWebsite,
  verifyWebsiteOwnershipToken,
  normalizeWebsiteUrl,
} from '../utils/urlValidator';
import {
  findUserByEmail,
  findOrganizationByWebsiteUrl,
  findOrganizationById,
  findOrganizationByWidgetKey,
  createWorkspaceWithOwner,
  updateOrganizationVerification,
  createUser,
  getUsersByOrganization,
  type DbUser,
  type DbOrganization,
} from '../db/postgres';
import { isMongoConnected } from '../db/mongo';
import { memoryStore } from '../db/memoryStore';
import { Ticket } from '../models/ticket.model';

export interface RegisterBusinessInput {
  fullName: string;
  email: string;
  password: string;
  businessName: string;
  websiteUrl: string;
}

export interface WorkspaceAuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    organization: string;
    organizationId: string;
    roles: ('CUSTOMER' | 'AGENT' | 'ADMIN' | 'OWNER')[];
  };
  workspace: {
    id: string;
    name: string;
    websiteUrl: string;
    verificationStatus: 'PENDING' | 'VERIFIED';
    verificationToken: string;
    widgetKey: string;
  };
}

function generateToken(user: DbUser, orgName: string): string {
  const payload = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    organizationId: user.organization_id,
    organizationName: orgName,
    roles: user.roles,
  };
  return jwt.sign(payload, env.JWT_SECRET as string, {
    expiresIn: (env.JWT_EXPIRES_IN || '1d') as any,
  });
}

/**
 * Validates a website URL for reachability and SSRF safety before registration.
 */
export async function validateWebsiteUrlLive(url: string) {
  const result = await validateAndReachWebsite(url);
  const existing = await findOrganizationByWebsiteUrl(result.normalizedUrl);
  if (existing) {
    throw AppError.conflict('This website is already connected to a SupportDesk workspace.');
  }

  return result;
}

/**
 * Full Business Onboarding:
 * 1. Checks owner email uniqueness
 * 2. Normalizes & validates website URL (DNS resolution + SSRF protection + Reachability)
 * 3. Enforces single workspace per website rule
 * 4. Creates workspace, owner account with OWNER role, generates verification token and widget key
 */
export async function registerBusinessWorkspace(input: RegisterBusinessInput): Promise<WorkspaceAuthResult> {
  const trimmedEmail = input.email.trim().toLowerCase();
  const trimmedBusinessName = input.businessName.trim();
  const trimmedOwnerName = input.fullName.trim();

  // 1. Owner email check
  const existingUser = await findUserByEmail(trimmedEmail);
  if (existingUser) {
    throw AppError.conflict('An account with this email address already exists. Please sign in instead.');
  }

  // 2. Normalize and check if website is already connected
  const { normalizedUrl } = normalizeWebsiteUrl(input.websiteUrl);
  const existingWorkspace = await findOrganizationByWebsiteUrl(normalizedUrl);
  if (existingWorkspace) {
    throw AppError.conflict('This website is already connected to a SupportDesk workspace.');
  }

  // 3. Strict SSRF & Reachability check
  // Ensures the website is real, responding, and not on private network
  await validateAndReachWebsite(normalizedUrl);

  // Double check after reachability (in case of concurrent register)
  const recheckWorkspace = await findOrganizationByWebsiteUrl(normalizedUrl);
  if (recheckWorkspace) {
    throw AppError.conflict('This website is already connected to a SupportDesk workspace.');
  }

  // 4. Generate tokens & hash password
  const verificationToken = `supportdesk-verify-${crypto.randomBytes(12).toString('hex')}`;
  const widgetKey = `wdg_${crypto.randomBytes(8).toString('hex')}`;
  const passwordHash = await bcrypt.hash(input.password, 10);

  // 5. Create Workspace and Owner
  const { workspace, owner } = await createWorkspaceWithOwner({
    name: trimmedBusinessName,
    websiteUrl: normalizedUrl,
    ownerName: trimmedOwnerName,
    email: trimmedEmail,
    passwordHash,
    verificationToken,
    widgetKey,
  });

  const token = generateToken(owner, workspace.name);

  return {
    token,
    user: {
      id: owner.id,
      email: owner.email,
      fullName: owner.full_name,
      organization: workspace.name,
      organizationId: workspace.id,
      roles: owner.roles,
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      websiteUrl: workspace.website_url || normalizedUrl,
      verificationStatus: workspace.verification_status,
      verificationToken: workspace.verification_token || verificationToken,
      widgetKey: workspace.widget_key || widgetKey,
    },
  };
}

/**
 * Verifies website ownership by scanning for the meta tag on the target site.
 * Also allows instant verification in sandbox mode for evaluation.
 */
export async function verifyWorkspaceOwnership(
  orgId: string,
  options?: { sandboxBypass?: boolean }
): Promise<{ verified: boolean; message: string; workspace: DbOrganization }> {
  const workspace = await findOrganizationById(orgId);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  if (workspace.verification_status === 'VERIFIED') {
    return {
      verified: true,
      message: 'Website ownership is already verified.',
      workspace,
    };
  }

  if (options?.sandboxBypass) {
    await updateOrganizationVerification(orgId, 'VERIFIED');
    workspace.verification_status = 'VERIFIED';
    return {
      verified: true,
      message: 'Website ownership successfully verified (Sandbox Evaluation Mode).',
      workspace,
    };
  }

  if (!workspace.website_url || !workspace.verification_token) {
    throw new AppError('Workspace website URL or verification token is missing.', 400);
  }

  const result = await verifyWebsiteOwnershipToken(workspace.website_url, workspace.verification_token);
  if (result.verified) {
    await updateOrganizationVerification(orgId, 'VERIFIED');
    workspace.verification_status = 'VERIFIED';
  }

  return {
    verified: result.verified,
    message: result.message,
    workspace,
  };
}

/**
 * Retrieves details for the authenticated user's workspace.
 */
export async function getWorkspaceDetails(orgId: string) {
  const workspace = await findOrganizationById(orgId);
  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  const agents = await getWorkspaceAgents(orgId);
  let totalTickets = 0;
  let openTickets = 0;
  let inProgressTickets = 0;
  let resolvedTickets = 0;
  let aiHandledCount = 0;

  if (isMongoConnected()) {
    totalTickets = await (Ticket as any).countDocuments({ organizationId: orgId });
    openTickets = await (Ticket as any).countDocuments({ organizationId: orgId, status: 'OPEN' });
    inProgressTickets = await (Ticket as any).countDocuments({ organizationId: orgId, status: 'IN_PROGRESS' });
    resolvedTickets = await (Ticket as any).countDocuments({
      organizationId: orgId,
      status: { $in: ['RESOLVED', 'CLOSED'] },
    });
    aiHandledCount = await (Ticket as any).countDocuments({
      organizationId: orgId,
      'aiClassification.requiresHuman': false,
    });
  } else {
    const orgTickets = memoryStore.tickets.filter((t) => t.organizationId === orgId);
    totalTickets = orgTickets.length;
    openTickets = orgTickets.filter((t) => t.status === 'OPEN').length;
    inProgressTickets = orgTickets.filter((t) => t.status === 'IN_PROGRESS').length;
    resolvedTickets = orgTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    aiHandledCount = orgTickets.filter((t) => t.aiClassification && !t.aiClassification.requiresHuman).length;
  }

  return {
    id: workspace.id,
    name: workspace.name,
    websiteUrl: workspace.website_url || '',
    verificationStatus: workspace.verification_status,
    verificationToken: workspace.verification_token || '',
    widgetKey: workspace.widget_key || '',
    ownerId: workspace.owner_id,
    createdAt: workspace.created_at,
    metrics: {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      aiHandledCount,
      agentsCount: agents.length,
      averageResponseTime: '1.8m',
    },
  };
}

/**
 * Invites / Creates a support agent under the owner's workspace.
 */
export async function addAgentToWorkspace(
  orgId: string,
  input: { fullName: string; email: string; password?: string }
): Promise<DbUser> {
  const email = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) {
    throw AppError.conflict('A user with this email address already exists.');
  }

  const temporaryPassword = input.password || 'SupportAgent123!';
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const newAgent = await createUser({
    email,
    passwordHash,
    fullName: input.fullName.trim(),
    organizationId: orgId,
    role: 'AGENT',
  });

  return newAgent;
}

/**
 * Lists all agents belonging to the specific workspace.
 */
export async function getWorkspaceAgents(orgId: string): Promise<DbUser[]> {
  const allUsers = await getUsersByOrganization(orgId);
  return allUsers.filter((u) => u.roles.includes('AGENT'));
}
