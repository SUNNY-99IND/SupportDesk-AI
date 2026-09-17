import { Router } from 'express';
import { register, login, getMe, sendOtp } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema, sendOtpSchema } from '../validators/auth.validator';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// POST /api/auth/send-otp
router.post('/send-otp', authRateLimiter, validateBody(sendOtpSchema), sendOtp);

// POST /api/auth/register
router.post('/register', authRateLimiter, validateBody(registerSchema), register);

// POST /api/auth/login
router.post('/login', authRateLimiter, validateBody(loginSchema), login);

// GET /api/auth/me
router.get('/me', authenticate, getMe);

export default router;
