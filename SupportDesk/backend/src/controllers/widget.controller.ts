import type { Request, Response, NextFunction } from 'express';
import { findOrganizationByWidgetKey } from '../db/postgres';
import { generateChatResponse } from '../services/ai.service';
import { createTicketFromWidget } from '../services/ticket.service';
import { AppError } from '../utils/AppError';

export async function getWidgetConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const widgetKey = (req.query.key as string || req.params.widgetKey || '').trim();
    if (!widgetKey) {
      res.status(400).json({ success: false, message: 'Widget key is required.' });
      return;
    }

    const org = await findOrganizationByWidgetKey(widgetKey);
    if (!org) {
      res.status(404).json({
        success: false,
        message: 'Invalid or inactive widget key. Please verify your workspace settings.',
      });
      return;
    }

    // Public workspace configuration — strictly avoids exposing private secrets
    res.status(200).json({
      success: true,
      data: {
        workspaceId: org.id,
        businessName: org.name,
        websiteUrl: org.website_url,
        verificationStatus: org.verification_status,
        widgetKey: org.widget_key,
        greeting: `Hi! How can we help you today with ${org.name}?`,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function chatWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { widgetKey, message, history } = req.body;
    if (!widgetKey || !message) {
      res.status(400).json({ success: false, message: 'Widget key and message are required.' });
      return;
    }

    const org = await findOrganizationByWidgetKey(widgetKey);
    if (!org) {
      res.status(404).json({ success: false, message: 'Workspace not found for provided widget key.' });
      return;
    }

    const aiResult = await generateChatResponse(
      { message, history: history || [] },
      {
        organizationId: org.id,
        businessName: org.name,
        websiteUrl: org.website_url,
      }
    );

    res.status(200).json({
      success: true,
      data: aiResult,
    });
  } catch (error) {
    next(error);
  }
}

export async function createWidgetTicketEndpoint(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { widgetKey, customerName, customerEmail, title, message, category } = req.body;

    if (!widgetKey || !customerEmail || !message) {
      res.status(400).json({
        success: false,
        message: 'Widget key, customer email, and inquiry message are required.',
      });
      return;
    }

    const org = await findOrganizationByWidgetKey(widgetKey);
    if (!org) {
      res.status(404).json({ success: false, message: 'Workspace not found for provided widget key.' });
      return;
    }

    const ticket = await createTicketFromWidget({
      organizationId: org.id,
      customerName: customerName || 'Website Visitor',
      customerEmail: customerEmail.trim().toLowerCase(),
      title: title || `Inquiry from ${customerName || customerEmail}`,
      description: message.trim(),
      category: category || 'General',
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully. Our team will follow up via email.',
      data: {
        ticketId: ticket._id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}
