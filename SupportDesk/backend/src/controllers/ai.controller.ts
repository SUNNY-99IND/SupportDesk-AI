import type { Request, Response, NextFunction } from 'express';
import {
  generateChatResponse,
  classifyTicketContent,
  generateAgentSuggestedReply,
} from '../services/ai.service';
import { getTicketById } from '../services/ticket.service';

export async function chatWithAI(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await generateChatResponse(req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function classifyTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, description } = req.body;
    const classification = await classifyTicketContent(title, description);
    res.status(200).json({
      success: true,
      data: classification,
    });
  } catch (error) {
    next(error);
  }
}

export async function suggestReply(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = await getTicketById(req.body.ticketId, req.user!);
    const suggestion = await generateAgentSuggestedReply({
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      customerName: ticket.customerName,
    });
    res.status(200).json({
      success: true,
      data: { suggestion },
    });
  } catch (error) {
    next(error);
  }
}
