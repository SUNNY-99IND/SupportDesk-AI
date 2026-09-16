/**
 * 404 handler.
 *
 * Express tries each middleware in order; if no route matched by the time the
 * request reaches here, the path does not exist. Registered AFTER all routes
 * and BEFORE the error handler in app.ts.
 */
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}
