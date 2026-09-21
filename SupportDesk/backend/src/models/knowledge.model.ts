import mongoose, { Schema, type Document } from 'mongoose';

export interface IKnowledgeDoc extends Document {
  organizationId: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeDocSchema = new Schema<IKnowledgeDoc>(
  {
    organizationId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, default: 'FAQ' },
    content: { type: String, required: true },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const KnowledgeDoc =
  mongoose.models.KnowledgeDoc || mongoose.model<IKnowledgeDoc>('KnowledgeDoc', KnowledgeDocSchema);
