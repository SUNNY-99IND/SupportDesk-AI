import { apiRequest } from './api';
import type {
  Ticket,
  TicketMessage,
  CreateTicketPayload,
  UpdateTicketPayload,
} from '../types/ticket';

export async function fetchTickets(params?: {
  status?: string;
  priority?: string;
  search?: string;
}): Promise<Ticket[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.search) query.set('search', params.search);

  const qs = query.toString();
  const res = await apiRequest<Ticket[]>(`/api/tickets${qs ? `?${qs}` : ''}`);
  return res.data || [];
}

export async function fetchTicketById(id: string): Promise<Ticket> {
  const res = await apiRequest<Ticket>(`/api/tickets/${id}`);
  return res.data!;
}

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const res = await apiRequest<Ticket>('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data!;
}

export async function updateTicket(id: string, payload: UpdateTicketPayload): Promise<Ticket> {
  const res = await apiRequest<Ticket>(`/api/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data!;
}

export async function deleteTicket(id: string): Promise<void> {
  await apiRequest<void>(`/api/tickets/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const res = await apiRequest<TicketMessage[]>(`/api/tickets/${ticketId}/messages`);
  return res.data || [];
}

export async function sendTicketMessage(ticketId: string, body: string): Promise<TicketMessage> {
  const res = await apiRequest<TicketMessage>(`/api/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
  return res.data!;
}
