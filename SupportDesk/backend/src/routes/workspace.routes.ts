import { Router } from 'express';
import {
  validateUrl,
  registerWorkspace,
  getMyWorkspace,
  verifyOwnership,
  inviteAgent,
  listAgents,
} from '../controllers/workspace.controller';
import { validateBody } from '../middleware/validate';
import {
  validateUrlSchema,
  businessRegisterSchema,
  verifyOwnershipSchema,
  inviteAgentSchema,
} from '../validators/workspace.validator';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public website URL validation check (useful for real-time form feedback)
router.post('/validate-url', authRateLimiter, validateBody(validateUrlSchema), validateUrl);

// Public Business Registration: Creates Workspace + Owner
router.post('/register', authRateLimiter, validateBody(businessRegisterSchema), registerWorkspace);

// Authenticated Workspace Details
router.get('/me', authenticate, getMyWorkspace);

// Authenticated Website Ownership Verification
router.post('/verify-ownership', authenticate, validateBody(verifyOwnershipSchema), verifyOwnership);

// Authenticated Agent Management (Owner / Admin)
router.get('/agents', authenticate, listAgents);
router.post('/agents', authenticate, validateBody(inviteAgentSchema), inviteAgent);

export default router;
