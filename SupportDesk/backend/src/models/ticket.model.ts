import mongoose, { Schema, type Document } from 'mongoose';

export interface ITicket extends Document {
  organizationId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
  aiClassification?: {
    intent: string;
    priority: string;
    sentiment: string;
    requiresHuman: boolean;
    suggestedAction?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    organizationId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String },
    customerEmail: { type: String },
    assignedAgentId: { type: String, default: null, index: true },
    assignedAgentName: { type: String, default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, default: 'General' },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    aiClassification: {
      intent: { type: String },
      priority: { type: String },
      sentiment: { type: String },
      requiresHuman: { type: Boolean },
      suggestedAction: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
