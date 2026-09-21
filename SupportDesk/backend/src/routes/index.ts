/**
 * API router — the single place where every resource gets mounted under /api.
 *
 * Later phases add lines here, e.g.
 *   router.use('/auth', authRoutes);      // Phase 3
 *   router.use('/tickets', ticketRoutes); // Phase 4
 */
import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import ticketRoutes from './ticket.routes';
import aiRoutes from './ai.routes';
import adminRoutes from './admin.routes';
import workspaceRoutes from './workspace.routes';
import knowledgeRoutes from './knowledge.routes';
import widgetRoutes from './widget.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);
router.use('/ai', aiRoutes);
router.use('/admin', adminRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/widget', widgetRoutes);

export default router;

