import type { Request, Response, NextFunction } from 'express';
import {
  listTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  listMessages,
  addMessage,
} from '../services/ticket.service';

export async function getAllTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      priority: req.query.priority as string | undefined,
      search: req.query.search as string | undefined,
    };
    const tickets = await listTickets(req.user!, filters);
    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSingleTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = await getTicketById(req.params.id as string, req.user!);
    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

export async function createNewTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = await createTicket(req.body, req.user!);
    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

export async function patchTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = await updateTicket(req.params.id as string, req.body, req.user!);
    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSingleTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteTicket(req.params.id as string, req.user!);
    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getTicketMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const messages = await listMessages(req.params.id as string, req.user!);
    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
}

export async function postTicketMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const message = await addMessage(req.params.id as string, req.body.body, req.user!);
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    next(error);
  }
}
