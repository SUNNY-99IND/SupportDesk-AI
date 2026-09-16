import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().default('General'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export const updateTicketSchema = z.object({
  title: z.string().min(5).max(150).optional(),
  description: z.string().min(10).optional(),
  category: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED']).optional(),
  assignedAgentId: z.string().nullable().optional(),
});

export const createMessageSchema = z.object({
  body: z.string().min(1, 'Message body cannot be empty'),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
