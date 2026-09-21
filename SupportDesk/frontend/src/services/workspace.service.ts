import { apiRequest } from './api';
import type {
  WorkspaceDetails,
  WorkspaceAgent,
  UrlValidationResult,
  OwnershipVerificationResult,
  WidgetPublicConfig,
} from '../types/workspace';
import type { AuthResponse } from '../types/auth';

/**
 * Live URL validation: checks format, SSRF safety, DNS, and HTTP reachability.
 */
export async function validateWebsiteUrlLive(url: string): Promise<UrlValidationResult> {
  const res = await apiRequest<UrlValidationResult>('/api/workspaces/validate-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return res.data!;
}

/**
 * Registers a new business workspace and creates the workspace owner account.
 */
export async function registerBusinessWorkspace(payload: {
  fullName: string;
  email: string;
  password: string;
  businessName: string;
  websiteUrl: string;
}): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/api/workspaces/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data!;
}

/**
 * Fetches the authenticated user's workspace details, including verification status and metrics.
 */
export async function fetchMyWorkspace(): Promise<WorkspaceDetails> {
  const res = await apiRequest<WorkspaceDetails>('/api/workspaces/me', {
    method: 'GET',
  });
  return res.data!;
}

/**
 * Checks website ownership by scanning for the meta tag or via sandbox bypass.
 */
export async function verifyWorkspaceOwnership(options?: {
  sandboxBypass?: boolean;
}): Promise<OwnershipVerificationResult> {
  const res = await apiRequest<OwnershipVerificationResult>('/api/workspaces/verify-ownership', {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
  return {
    ...res.data!,
    message: res.message,
  };
}

/**
 * Lists all support agents belonging to the workspace.
 */
export async function fetchWorkspaceAgents(): Promise<WorkspaceAgent[]> {
  const res = await apiRequest<WorkspaceAgent[]>('/api/workspaces/agents', {
    method: 'GET',
  });
  return res.data!;
}

/**
 * Invites a new support agent to the workspace.
 */
export async function inviteWorkspaceAgent(payload: {
  fullName: string;
  email: string;
  password?: string;
}): Promise<WorkspaceAgent> {
  const res = await apiRequest<WorkspaceAgent>('/api/workspaces/agents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data!;
}

/**
 * Fetches public configuration for a website widget by widgetKey.
 */
export async function fetchWidgetPublicConfig(widgetKey: string): Promise<WidgetPublicConfig> {
  const res = await apiRequest<WidgetPublicConfig>(`/api/widget/config?key=${encodeURIComponent(widgetKey)}`, {
    method: 'GET',
  });
  return res.data!;
}

/**
 * Sends a chat inquiry from the embedded widget.
 */
export async function sendWidgetChatMessage(payload: {
  widgetKey: string;
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}) {
  const res = await apiRequest<any>('/api/widget/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data!;
}

/**
 * Creates a customer support ticket directly from the embedded widget.
 */
export async function submitWidgetTicket(payload: {
  widgetKey: string;
  customerName: string;
  customerEmail: string;
  title?: string;
  message: string;
  category?: string;
}) {
  const res = await apiRequest<any>('/api/widget/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data!;
}
