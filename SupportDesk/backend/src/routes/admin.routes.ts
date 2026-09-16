import { Router } from 'express';
import { listAllUsers, changeUserRole, getSystemStats } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Restrict entire admin router to ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// GET /api/admin/users
router.get('/users', listAllUsers);

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', changeUserRole);

// GET /api/admin/stats
router.get('/stats', getSystemStats);

export default router;
