import { apiRequest } from './api';
import type { AIChatResponse } from '../types/ai';
import type { AIClassification } from '../types/ticket';

export async function askAI(
  message: string,
  history?: { role: 'user' | 'assistant' | 'system'; content: string }[],
  ticketId?: string
): Promise<AIChatResponse> {
  const res = await apiRequest<AIChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history, ticketId }),
  });
  return res.data!;
}

export async function classifyText(title: string, description: string): Promise<AIClassification> {
  const res = await apiRequest<AIClassification>('/api/ai/classify', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  });
  return res.data!;
}

export async function getSuggestedReply(ticketId: string): Promise<string> {
  const res = await apiRequest<{ suggestion: string }>('/api/ai/suggest-reply', {
    method: 'POST',
    body: JSON.stringify({ ticketId }),
  });
  return res.data!.suggestion;
}
