import type { Request, Response, NextFunction } from 'express';
import {
  validateWebsiteUrlLive,
  registerBusinessWorkspace,
  verifyWorkspaceOwnership,
  getWorkspaceDetails,
  addAgentToWorkspace,
  getWorkspaceAgents,
} from '../services/workspace.service';

export async function validateUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await validateWebsiteUrlLive(req.body.url);
    res.status(200).json({
      success: true,
      message: 'Website URL is valid, publicly accessible, and verified safe.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function registerWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await registerBusinessWorkspace(req.body);
    res.status(201).json({
      success: true,
      message: 'Business workspace created successfully. Welcome to SupportDesk AI!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const details = await getWorkspaceDetails(req.user.organizationId);
    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const result = await verifyWorkspaceOwnership(req.user.organizationId, {
      sandboxBypass: req.body.sandboxBypass === true,
    });

    res.status(result.verified ? 200 : 400).json({
      success: result.verified,
      message: result.message,
      data: {
        verified: result.verified,
        verificationStatus: result.workspace.verification_status,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function inviteAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const isOwnerOrAdmin = req.user.roles.includes('OWNER') || req.user.roles.includes('ADMIN');
    if (!isOwnerOrAdmin) {
      res.status(403).json({ success: false, message: 'Only workspace owners can add agents.' });
      return;
    }

    const newAgent = await addAgentToWorkspace(req.user.organizationId, req.body);
    res.status(201).json({
      success: true,
      message: 'Support agent added to workspace successfully.',
      data: {
        id: newAgent.id,
        email: newAgent.email,
        fullName: newAgent.full_name,
        roles: newAgent.roles,
        organizationId: newAgent.organization_id,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listAgents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const agents = await getWorkspaceAgents(req.user.organizationId);
    const safeAgents = agents.map((a) => ({
      id: a.id,
      email: a.email,
      fullName: a.full_name,
      roles: a.roles,
      isActive: a.is_active,
      createdAt: a.created_at,
    }));

    res.status(200).json({
      success: true,
      data: safeAgents,
    });
  } catch (error) {
    next(error);
  }
}
