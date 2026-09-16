import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName?: string;
  roles: ('CUSTOMER' | 'AGENT' | 'ADMIN')[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required: missing or malformed token',
    });
    return;
  }

  const parts = authHeader.split(' ');
  const token = parts[1];
  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required: missing token',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as unknown as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed: invalid or expired token',
    });
  }
}
