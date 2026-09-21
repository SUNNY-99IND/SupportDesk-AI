import { apiRequest } from './api';

export interface KnowledgeDocument {
  _id: string;
  organizationId: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchKnowledgeDocs(): Promise<KnowledgeDocument[]> {
  const res = await apiRequest<KnowledgeDocument[]>('/api/knowledge', {
    method: 'GET',
  });
  return res.data!;
}

export async function searchKnowledgeDocs(query: string): Promise<KnowledgeDocument[]> {
  const res = await apiRequest<KnowledgeDocument[]>(`/api/knowledge/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
  });
  return res.data!;
}

export async function fetchKnowledgeDocById(id: string): Promise<KnowledgeDocument> {
  const res = await apiRequest<KnowledgeDocument>(`/api/knowledge/${id}`, {
    method: 'GET',
  });
  return res.data!;
}

export async function createKnowledgeDoc(payload: {
  title: string;
  category: string;
  content: string;
  tags?: string[];
}): Promise<KnowledgeDocument> {
  const res = await apiRequest<KnowledgeDocument>('/api/knowledge', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data!;
}

export async function updateKnowledgeDoc(
  id: string,
  payload: {
    title?: string;
    category?: string;
    content?: string;
    tags?: string[];
  }
): Promise<KnowledgeDocument> {
  const res = await apiRequest<KnowledgeDocument>(`/api/knowledge/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data!;
}

export async function deleteKnowledgeDoc(id: string): Promise<void> {
  await apiRequest<void>(`/api/knowledge/${id}`, {
    method: 'DELETE',
  });
}
