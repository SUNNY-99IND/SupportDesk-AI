import { Ticket } from '../models/ticket.model';
import { Message } from '../models/message.model';
import { isMongoConnected } from '../db/mongo';
import { memoryStore, type DbTicket, type DbMessage } from '../db/memoryStore';
import type { AuthenticatedUser } from '../middleware/auth';
import type { CreateTicketInput, UpdateTicketInput } from '../validators/ticket.validator';
import { classifyTicketContent } from './ai.service';

export async function listTickets(
  user: AuthenticatedUser,
  filters: { status?: string; priority?: string; search?: string }
): Promise<DbTicket[]> {
  const isCustomer = user.roles.includes('CUSTOMER') && !user.roles.includes('AGENT') && !user.roles.includes('ADMIN');

  if (isMongoConnected()) {
    const query: any = { organizationId: user.organizationId };
    if (isCustomer) {
      query.customerId = user.id;
    }
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const docs = await (Ticket as any).find(query).sort({ createdAt: -1 }).lean();
    return docs.map((d: any) => ({
      _id: d._id.toString(),
      organizationId: d.organizationId,
      customerId: d.customerId,
      customerName: d.customerName,
      customerEmail: d.customerEmail,
      assignedAgentId: d.assignedAgentId,
      assignedAgentName: d.assignedAgentName,
      title: d.title,
      description: d.description,
      category: d.category,
      priority: d.priority,
      status: d.status,
      aiClassification: d.aiClassification,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  }

  // Memory fallback
  let tickets = memoryStore.tickets.slice();
  if (isCustomer) {
    tickets = tickets.filter((t) => t.customerId === user.id);
  }

  if (filters.status) {
    tickets = tickets.filter((t) => t.status.toLowerCase() === filters.status!.toLowerCase());
  }
  if (filters.priority) {
    tickets = tickets.filter((t) => t.priority.toLowerCase() === filters.priority!.toLowerCase());
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    tickets = tickets.filter((t) => t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s));
  }

  return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getTicketById(id: string, user: AuthenticatedUser): Promise<DbTicket> {
  let ticket: DbTicket | null = null;

  if (isMongoConnected()) {
    const doc: any = await (Ticket as any).findById(id).lean();
    if (doc) {
      ticket = {
        _id: doc._id.toString(),
        organizationId: doc.organizationId,
        customerId: doc.customerId,
        customerName: doc.customerName,
        customerEmail: doc.customerEmail,
        assignedAgentId: doc.assignedAgentId,
        assignedAgentName: doc.assignedAgentName,
        title: doc.title,
        description: doc.description,
        category: doc.category,
        priority: doc.priority,
        status: doc.status,
        aiClassification: doc.aiClassification,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    }
  } else {
    ticket = memoryStore.tickets.find((t) => t._id === id) || null;
  }

  if (!ticket) {
    const error = new Error('Ticket not found');
    (error as any).status = 404;
    throw error;
  }

  // Customer authorization check
  const isCustomerOnly = user.roles.includes('CUSTOMER') && !user.roles.includes('AGENT') && !user.roles.includes('ADMIN');
  if (isCustomerOnly && ticket.customerId !== user.id) {
    const error = new Error('Access denied to this ticket');
    (error as any).status = 403;
    throw error;
  }

  return ticket;
}

export async function createTicket(input: CreateTicketInput, user: AuthenticatedUser): Promise<DbTicket> {
  const classification = await classifyTicketContent(input.title, input.description);
  const initialPriority = input.priority || (classification.priority.toUpperCase() as any) || 'MEDIUM';

  if (isMongoConnected()) {
    const ticketDoc = await (Ticket as any).create({
      organizationId: user.organizationId,
      customerId: user.id,
      customerName: user.fullName,
      customerEmail: user.email,
      title: input.title,
      description: input.description,
      category: input.category || 'General',
      priority: initialPriority,
      status: 'OPEN',
      aiClassification: classification,
    });

    await (Message as any).create({
      ticketId: ticketDoc._id.toString(),
      senderId: user.id,
      senderName: user.fullName,
      senderType: 'CUSTOMER',
      body: input.description,
    });

    return {
      _id: ticketDoc._id.toString(),
      organizationId: ticketDoc.organizationId,
      customerId: ticketDoc.customerId,
      customerName: ticketDoc.customerName,
      customerEmail: ticketDoc.customerEmail,
      assignedAgentId: ticketDoc.assignedAgentId,
      assignedAgentName: ticketDoc.assignedAgentName,
      title: ticketDoc.title,
      description: ticketDoc.description,
      category: ticketDoc.category,
      priority: ticketDoc.priority,
      status: ticketDoc.status,
      aiClassification: ticketDoc.aiClassification,
      createdAt: ticketDoc.createdAt.toISOString(),
      updatedAt: ticketDoc.updatedAt.toISOString(),
    };
  }

  const newTicketId = `tkt-${Date.now()}`;
  const newTicket: DbTicket = {
    _id: newTicketId,
    organizationId: user.organizationId,
    customerId: user.id,
    customerName: user.fullName,
    customerEmail: user.email,
    assignedAgentId: null,
    assignedAgentName: null,
    title: input.title,
    description: input.description,
    category: input.category || 'General',
    priority: initialPriority,
    status: 'OPEN',
    aiClassification: classification,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.tickets.unshift(newTicket);

  memoryStore.messages.push({
    _id: `msg-${Date.now()}`,
    ticketId: newTicketId,
    senderId: user.id,
    senderName: user.fullName,
    senderType: 'CUSTOMER',
    body: input.description,
    createdAt: new Date().toISOString(),
  });

  return newTicket;
}

export async function updateTicket(
  id: string,
  input: UpdateTicketInput,
  user: AuthenticatedUser
): Promise<DbTicket> {
  const existing = await getTicketById(id, user);

  let agentName = existing.assignedAgentName;
  if (input.assignedAgentId !== undefined) {
    if (input.assignedAgentId) {
      const agentUser = memoryStore.users.find((u) => u.id === input.assignedAgentId);
      agentName = agentUser ? agentUser.full_name : 'Support Agent';
    } else {
      agentName = null;
    }
  }

  if (isMongoConnected()) {
    const updated: any = await (Ticket as any).findByIdAndUpdate(
      id,
      {
        ...input,
        ...(input.assignedAgentId !== undefined ? { assignedAgentName: agentName } : {}),
      },
      { new: true }
    ).lean();

    return {
      _id: updated._id.toString(),
      organizationId: updated.organizationId,
      customerId: updated.customerId,
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      assignedAgentId: updated.assignedAgentId,
      assignedAgentName: updated.assignedAgentName,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      priority: updated.priority,
      status: updated.status,
      aiClassification: updated.aiClassification,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  const idx = memoryStore.tickets.findIndex((t) => t._id === id);
  if (idx !== -1 && memoryStore.tickets[idx]) {
    const current = memoryStore.tickets[idx]!;
    const updatedTicket: DbTicket = {
      _id: current._id,
      organizationId: current.organizationId,
      customerId: current.customerId,
      customerName: current.customerName,
      customerEmail: current.customerEmail,
      title: input.title !== undefined ? input.title : current.title,
      description: input.description !== undefined ? input.description : current.description,
      category: input.category !== undefined ? input.category : current.category,
      priority: input.priority !== undefined ? input.priority : current.priority,
      status: input.status !== undefined ? input.status : current.status,
      assignedAgentId: input.assignedAgentId !== undefined ? input.assignedAgentId : current.assignedAgentId,
      assignedAgentName: input.assignedAgentId !== undefined ? agentName : current.assignedAgentName,
      aiClassification: current.aiClassification,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.tickets[idx] = updatedTicket;
    return updatedTicket;
  }

  throw new Error('Ticket not found');
}

export async function deleteTicket(id: string, user: AuthenticatedUser): Promise<void> {
  const existing = await getTicketById(id, user);
  const isAdmin = user.roles.includes('ADMIN');
  if (!isAdmin && existing.customerId !== user.id) {
    const error = new Error('Permission denied: only admins or the ticket owner can delete this ticket');
    (error as any).status = 403;
    throw error;
  }

  if (isMongoConnected()) {
    await (Ticket as any).findByIdAndDelete(id);
    await (Message as any).deleteMany({ ticketId: id });
    return;
  }

  memoryStore.tickets = memoryStore.tickets.filter((t) => t._id !== id);
  memoryStore.messages = memoryStore.messages.filter((m) => m.ticketId !== id);
}

export async function listMessages(ticketId: string, user: AuthenticatedUser): Promise<DbMessage[]> {
  await getTicketById(ticketId, user);

  if (isMongoConnected()) {
    const docs = await (Message as any).find({ ticketId }).sort({ createdAt: 1 }).lean();
    return docs.map((d: any) => ({
      _id: d._id.toString(),
      ticketId: d.ticketId,
      senderId: d.senderId,
      senderName: d.senderName,
      senderType: d.senderType,
      body: d.body,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  return memoryStore.messages
    .filter((m) => m.ticketId === ticketId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function addMessage(
  ticketId: string,
  body: string,
  user: AuthenticatedUser
): Promise<DbMessage> {
  await getTicketById(ticketId, user);

  const senderType = user.roles.includes('AGENT') || user.roles.includes('ADMIN') ? 'AGENT' : 'CUSTOMER';

  if (isMongoConnected()) {
    const doc = await (Message as any).create({
      ticketId,
      senderId: user.id,
      senderName: user.fullName,
      senderType,
      body,
    });

    await (Ticket as any).findByIdAndUpdate(ticketId, { updatedAt: new Date() });

    return {
      _id: doc._id.toString(),
      ticketId: doc.ticketId,
      senderId: doc.senderId,
      senderName: doc.senderName,
      senderType: doc.senderType,
      body: doc.body,
      createdAt: doc.createdAt.toISOString(),
    };
  }

  const newMsg: DbMessage = {
    _id: `msg-${Date.now()}`,
    ticketId,
    senderId: user.id,
    senderName: user.fullName,
    senderType,
    body,
    createdAt: new Date().toISOString(),
  };

  memoryStore.messages.push(newMsg);

  const tIndex = memoryStore.tickets.findIndex((t) => t._id === ticketId);
  if (tIndex !== -1 && memoryStore.tickets[tIndex]) {
    memoryStore.tickets[tIndex]!.updatedAt = new Date().toISOString();
  }

  return newMsg;
}
