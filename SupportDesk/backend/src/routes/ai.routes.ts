import { Router } from 'express';
import { chatWithAI, classifyTicket, suggestReply } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { aiRateLimiter } from '../middleware/rateLimiter';
import {
  aiChatSchema,
  aiClassifySchema,
  aiSuggestReplySchema,
} from '../validators/ai.validator';

const router = Router();

// Protect all AI routes with authentication and rate limiting
router.use(authenticate, aiRateLimiter);

// POST /api/ai/chat
router.post('/chat', validateBody(aiChatSchema), chatWithAI);

// POST /api/ai/classify
router.post('/classify', validateBody(aiClassifySchema), classifyTicket);

// POST /api/ai/suggest-reply (restricted to Support Agents and Admins)
router.post(
  '/suggest-reply',
  requireRole('AGENT', 'ADMIN'),
  validateBody(aiSuggestReplySchema),
  suggestReply
);

export default router;
