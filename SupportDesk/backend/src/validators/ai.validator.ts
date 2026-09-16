import { z } from 'zod';

export const aiChatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  ticketId: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .optional(),
});

export const aiClassifySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
});

export const aiSuggestReplySchema = z.object({
  ticketId: z.string().min(1, 'ticketId is required'),
});

export const structuredClassificationSchema = z.object({
  intent: z.enum(['refund', 'technical_issue', 'billing', 'account', 'general_inquiry']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  sentiment: z.enum(['positive', 'neutral', 'frustrated', 'negative']),
  response: z.string(),
  requiresHuman: z.boolean(),
  suggestedAction: z.string().optional(),
});

export type AIChatInput = z.infer<typeof aiChatSchema>;
export type AIClassifyInput = z.infer<typeof aiClassifySchema>;
export type StructuredClassification = z.infer<typeof structuredClassificationSchema>;
