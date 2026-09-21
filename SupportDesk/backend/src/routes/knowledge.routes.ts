import { Router } from 'express';
import {
  getKnowledgeList,
  getKnowledgeDetail,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  searchKnowledge,
} from '../controllers/knowledge.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// All knowledge routes require authentication and belong to caller's workspace
router.use(authenticate);

// View and search knowledge (accessible to Owner, Admin, Agent)
router.get('/', getKnowledgeList);
router.get('/search', searchKnowledge);
router.get('/:id', getKnowledgeDetail);

// Modify knowledge (Owner and Admin only)
router.post('/', requireRole('OWNER', 'ADMIN'), createKnowledge);
router.put('/:id', requireRole('OWNER', 'ADMIN'), updateKnowledge);
router.delete('/:id', requireRole('OWNER', 'ADMIN'), deleteKnowledge);

export default router;
