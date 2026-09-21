import { isMongoConnected } from '../db/mongo';
import { memoryStore, type DbKnowledgeDoc } from '../db/memoryStore';
import { KnowledgeDoc } from '../models/knowledge.model';
import { AppError } from '../utils/AppError';

export interface CreateKnowledgeInput {
  title: string;
  category: string;
  content: string;
  tags?: string[];
}

export interface UpdateKnowledgeInput {
  title?: string;
  category?: string;
  content?: string;
  tags?: string[];
}

export async function listKnowledgeDocs(organizationId: string): Promise<DbKnowledgeDoc[]> {
  if (isMongoConnected()) {
    const docs = await (KnowledgeDoc as any).find({ organizationId }).sort({ createdAt: -1 }).lean();
    return docs.map((d: any) => ({
      _id: d._id.toString(),
      organizationId: d.organizationId,
      title: d.title,
      category: d.category,
      content: d.content,
      tags: d.tags || [],
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  }

  return memoryStore.knowledgeDocs
    .filter((k) => k.organizationId === organizationId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getKnowledgeDocById(id: string, organizationId: string): Promise<DbKnowledgeDoc> {
  if (isMongoConnected()) {
    const doc: any = await (KnowledgeDoc as any).findOne({ _id: id, organizationId }).lean();
    if (!doc) {
      throw new AppError('Knowledge document not found', 404);
    }
    return {
      _id: doc._id.toString(),
      organizationId: doc.organizationId,
      title: doc.title,
      category: doc.category,
      content: doc.content,
      tags: doc.tags || [],
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  const found = memoryStore.knowledgeDocs.find((k) => k._id === id && k.organizationId === organizationId);
  if (!found) {
    throw new AppError('Knowledge document not found', 404);
  }
  return found;
}

export async function createKnowledgeDoc(
  input: CreateKnowledgeInput,
  organizationId: string
): Promise<DbKnowledgeDoc> {
  if (isMongoConnected()) {
    const doc = await (KnowledgeDoc as any).create({
      organizationId,
      title: input.title.trim(),
      category: input.category || 'FAQ',
      content: input.content.trim(),
      tags: input.tags || [],
    });

    return {
      _id: doc._id.toString(),
      organizationId: doc.organizationId,
      title: doc.title,
      category: doc.category,
      content: doc.content,
      tags: doc.tags,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  const newDoc: DbKnowledgeDoc = {
    _id: `kb-${Date.now()}`,
    organizationId,
    title: input.title.trim(),
    category: input.category || 'FAQ',
    content: input.content.trim(),
    tags: input.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.knowledgeDocs.unshift(newDoc);
  return newDoc;
}

export async function updateKnowledgeDoc(
  id: string,
  input: UpdateKnowledgeInput,
  organizationId: string
): Promise<DbKnowledgeDoc> {
  await getKnowledgeDocById(id, organizationId);

  if (isMongoConnected()) {
    const updated: any = await (KnowledgeDoc as any).findOneAndUpdate(
      { _id: id, organizationId },
      {
        ...(input.title ? { title: input.title.trim() } : {}),
        ...(input.category ? { category: input.category } : {}),
        ...(input.content ? { content: input.content.trim() } : {}),
        ...(input.tags ? { tags: input.tags } : {}),
      },
      { new: true }
    ).lean();

    return {
      _id: updated._id.toString(),
      organizationId: updated.organizationId,
      title: updated.title,
      category: updated.category,
      content: updated.content,
      tags: updated.tags,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  const idx = memoryStore.knowledgeDocs.findIndex((k) => k._id === id && k.organizationId === organizationId);
  if (idx === -1) throw new AppError('Knowledge document not found', 404);

  const current = memoryStore.knowledgeDocs[idx]!;
  const updatedDoc: DbKnowledgeDoc = {
    ...current,
    title: input.title !== undefined ? input.title.trim() : current.title,
    category: input.category !== undefined ? input.category : current.category,
    content: input.content !== undefined ? input.content.trim() : current.content,
    tags: input.tags !== undefined ? input.tags : current.tags,
    updatedAt: new Date().toISOString(),
  };

  memoryStore.knowledgeDocs[idx] = updatedDoc;
  return updatedDoc;
}

export async function deleteKnowledgeDoc(id: string, organizationId: string): Promise<void> {
  await getKnowledgeDocById(id, organizationId);

  if (isMongoConnected()) {
    await (KnowledgeDoc as any).deleteOne({ _id: id, organizationId });
    return;
  }

  memoryStore.knowledgeDocs = memoryStore.knowledgeDocs.filter(
    (k) => !(k._id === id && k.organizationId === organizationId)
  );
}

/**
 * Workspace-scoped RAG Retrieval:
 * Finds the top relevant knowledge documents for a customer query within a specific workspace.
 * Strict multi-tenant: NEVER searches across other workspaces.
 */
export async function findRelevantArticles(organizationId: string, query: string): Promise<DbKnowledgeDoc[]> {
  const allDocs = await listKnowledgeDocs(organizationId);
  if (allDocs.length === 0) return [];

  const lowerQuery = query.toLowerCase();
  const tokens = lowerQuery.split(/\W+/).filter((t) => t.length > 2);

  const scored = allDocs.map((doc) => {
    let score = 0;
    const lowerTitle = doc.title.toLowerCase();
    const lowerContent = doc.content.toLowerCase();
    const lowerCategory = doc.category.toLowerCase();
    const tags = doc.tags.map((t) => t.toLowerCase());

    for (const token of tokens) {
      if (lowerTitle.includes(token)) score += 5;
      if (tags.includes(token)) score += 4;
      if (lowerCategory.includes(token)) score += 3;
      if (lowerContent.includes(token)) score += 1;
    }

    return { doc, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.doc);
}
