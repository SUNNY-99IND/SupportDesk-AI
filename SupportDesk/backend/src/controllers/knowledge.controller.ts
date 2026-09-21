import type { Request, Response, NextFunction } from 'express';
import {
  listKnowledgeDocs,
  getKnowledgeDocById,
  createKnowledgeDoc,
  updateKnowledgeDoc,
  deleteKnowledgeDoc,
  findRelevantArticles,
} from '../services/knowledge.service';

export async function getKnowledgeList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const docs = await listKnowledgeDocs(req.user.organizationId);
    res.status(200).json({
      success: true,
      data: docs,
    });
  } catch (error) {
    next(error);
  }
}

export async function getKnowledgeDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const doc = await getKnowledgeDocById(req.params.id as string, req.user.organizationId);
    res.status(200).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    next(error);
  }
}

export async function createKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const newDoc = await createKnowledgeDoc(req.body, req.user.organizationId);
    res.status(201).json({
      success: true,
      message: 'Knowledge article created successfully',
      data: newDoc,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const updated = await updateKnowledgeDoc(req.params.id as string, req.body, req.user.organizationId);
    res.status(200).json({
      success: true,
      message: 'Knowledge article updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    await deleteKnowledgeDoc(req.params.id as string, req.user.organizationId);
    res.status(200).json({
      success: true,
      message: 'Knowledge article deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function searchKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const q = (req.query.q as string) || '';
    const results = await findRelevantArticles(req.user.organizationId, q);
    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}
