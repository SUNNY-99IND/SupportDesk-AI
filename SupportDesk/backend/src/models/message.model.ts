import mongoose, { Schema, type Document } from 'mongoose';

export interface IMessage extends Document {
  ticketId: string;
  senderId?: string | null;
  senderName: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'AI';
  body: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    ticketId: { type: String, required: true, index: true },
    senderId: { type: String, default: null },
    senderName: { type: String, required: true },
    senderType: {
      type: String,
      enum: ['CUSTOMER', 'AGENT', 'AI'],
      required: true,
    },
    body: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
