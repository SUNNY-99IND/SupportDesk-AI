import type { Request, Response, NextFunction } from 'express';
import { getAllUsers, updateUserRole } from '../db/postgres';
import { memoryStore } from '../db/memoryStore';
import { Ticket } from '../models/ticket.model';
import { isMongoConnected } from '../db/mongo';

export async function listAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await getAllUsers();
    // Strip sensitive password_hash
    const safeUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      organization: u.organization || 'Acme Technologies Inc.',
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
    if (!['CUSTOMER', 'AGENT', 'ADMIN'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role provided' });
      return;
    }

    const success = await updateUserRole(req.params.id as string, role);
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
    let totalTickets = 0;
    let openTickets = 0;
    let inProgressTickets = 0;
    let resolvedTickets = 0;

    if (isMongoConnected()) {
      totalTickets = await Ticket.countDocuments();
      openTickets = await Ticket.countDocuments({ status: 'OPEN' });
      inProgressTickets = await Ticket.countDocuments({ status: 'IN_PROGRESS' });
      resolvedTickets = await Ticket.countDocuments({ status: 'RESOLVED' });
    } else {
      totalTickets = memoryStore.tickets.length;
      openTickets = memoryStore.tickets.filter((t) => t.status === 'OPEN').length;
      inProgressTickets = memoryStore.tickets.filter((t) => t.status === 'IN_PROGRESS').length;
      resolvedTickets = memoryStore.tickets.filter((t) => t.status === 'RESOLVED').length;
    }

    const allUsers = await getAllUsers();
    const agentsCount = allUsers.filter((u) => u.roles.includes('AGENT')).length;
    const customersCount = allUsers.filter((u) => u.roles.includes('CUSTOMER')).length;

    res.status(200).json({
      success: true,
      data: {
        tickets: {
          total: totalTickets,
          open: openTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets,
        },
        users: {
          total: allUsers.length,
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
