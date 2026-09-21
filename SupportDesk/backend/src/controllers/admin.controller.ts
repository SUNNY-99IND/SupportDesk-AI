import type { Request, Response, NextFunction } from 'express';
import { getUsersByOrganization, updateUserRole, findUserById } from '../db/postgres';
import { memoryStore } from '../db/memoryStore';
import { Ticket } from '../models/ticket.model';
import { isMongoConnected } from '../db/mongo';

export async function listAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const users = await getUsersByOrganization(orgId);
    // Strip sensitive password_hash
    const safeUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      organization: u.organization || 'SupportDesk Workspace',
      roles: u.roles,
      isActive: u.is_active,
      createdAt: u.created_at,
    }));

    res.status(200).json({
      success: true,
      data: safeUsers,
    });
  } catch (error) {
    next(error);
  }
}

export async function changeUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role } = req.body;
    if (!['CUSTOMER', 'AGENT', 'ADMIN', 'OWNER'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role provided' });
      return;
    }

    const targetUser = await findUserById(req.params.id as string);
    if (!targetUser || targetUser.organization_id !== req.user?.organizationId) {
      res.status(404).json({ success: false, message: 'User not found in this workspace' });
      return;
    }

    const success = await updateUserRole(req.params.id as string, role as any);
    if (!success) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSystemStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    let totalTickets = 0;
    let openTickets = 0;
    let inProgressTickets = 0;
    let resolvedTickets = 0;
    let aiHandledTickets = 0;

    if (isMongoConnected()) {
      totalTickets = await Ticket.countDocuments({ organizationId: orgId });
      openTickets = await Ticket.countDocuments({ organizationId: orgId, status: 'OPEN' });
      inProgressTickets = await Ticket.countDocuments({ organizationId: orgId, status: 'IN_PROGRESS' });
      resolvedTickets = await Ticket.countDocuments({ organizationId: orgId, status: { $in: ['RESOLVED', 'CLOSED'] } });
      aiHandledTickets = await Ticket.countDocuments({
        organizationId: orgId,
        'aiClassification.requiresHuman': false,
      });
    } else {
      const orgTickets = memoryStore.tickets.filter((t) => t.organizationId === orgId);
      totalTickets = orgTickets.length;
      openTickets = orgTickets.filter((t) => t.status === 'OPEN').length;
      inProgressTickets = orgTickets.filter((t) => t.status === 'IN_PROGRESS').length;
      resolvedTickets = orgTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
      aiHandledTickets = orgTickets.filter((t) => t.aiClassification && !t.aiClassification.requiresHuman).length;
    }

    const workspaceUsers = await getUsersByOrganization(orgId);
    const agentsCount = workspaceUsers.filter((u) => u.roles.includes('AGENT') || u.roles.includes('OWNER') || u.roles.includes('ADMIN')).length;
    const customersCount = workspaceUsers.filter((u) => u.roles.includes('CUSTOMER')).length;

    res.status(200).json({
      success: true,
      data: {
        tickets: {
          total: totalTickets,
          open: openTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets,
          aiHandled: aiHandledTickets,
          avgResponseTime: '1.8m',
        },
        users: {
          total: workspaceUsers.length,
          customers: customersCount,
          agents: agentsCount,
        },
        system: {
          status: 'HEALTHY',
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
