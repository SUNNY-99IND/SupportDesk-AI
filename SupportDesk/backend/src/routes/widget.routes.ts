import { Router } from 'express';
import {
  getWidgetConfig,
  chatWidget,
  createWidgetTicketEndpoint,
} from '../controllers/widget.controller';
import { aiRateLimiter, authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// GET /api/widget/config?key=wdg_xxx - Fetch public workspace configuration
router.get('/config', getWidgetConfig);

// POST /api/widget/chat - Public conversational AI grounded in workspace knowledge
router.post('/chat', aiRateLimiter, chatWidget);

// POST /api/widget/tickets - Create customer ticket directly from embedded widget
router.post('/tickets', authRateLimiter, createWidgetTicketEndpoint);

export default router;
