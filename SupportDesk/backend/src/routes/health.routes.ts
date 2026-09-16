/**
 * Health routes.
 *
 * One file per resource keeps routing readable as the API grows.
 */
import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';

const router = Router();

// GET /api/health — public on purpose. It exposes no data beyond "I am up",
// which is what load balancers and uptime checks need.
router.get('/', getHealth);

export default router;
