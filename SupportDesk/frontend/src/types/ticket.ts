export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';

export interface AIClassification {
  intent: string;
  priority: string;
  sentiment: string;
  response?: string;
  requiresHuman: boolean;
  suggestedAction?: string;
}

export interface Ticket {
  _id: string;
  organizationId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  aiClassification?: AIClassification;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  _id: string;
  ticketId: string;
  senderId?: string | null;
  senderName: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'AI';
  body: string;
  createdAt: string;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  category?: string;
  priority?: TicketPriority;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  category?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedAgentId?: string | null;
}
