/**
 * Central error handler — the last middleware registered in app.ts.
 *
 * Express recognises a middleware as an error handler purely by its arity:
 * it must declare exactly four parameters (err, req, res, next), which is why
 * `_next` is present but unused.
 *
 * Rules applied here:
 *   - Known AppError  -> report its message and status code to the client.
 *   - Zod validation  -> 400 plus the field-level issues.
 *   - Anything else   -> log the real error, return a generic 500. We never
 *     leak stack traces or internal messages to the client in production.
 */
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { sendFailure } from '../utils/apiResponse';
import { isProduction } from '../config/env';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendFailure(res, err.message, err.statusCode, err.details);
    return;
  }

  const errorStatus = (err as any)?.statusCode || (err as any)?.status;
  if (typeof errorStatus === 'number' && errorStatus >= 400 && errorStatus < 500) {
    sendFailure(res, (err as any).message || 'Request failed', errorStatus, (err as any).details);
    return;
  }

  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    sendFailure(res, 'Validation failed', 400, issues);
    return;
  }

  // Unexpected: this is a bug, not a client mistake. Log it for us.
  console.error('[unhandled error]', err);

  const message = isProduction
    ? 'Something went wrong. Please try again later.'
    : err instanceof Error
      ? err.message
      : 'Unknown error';

  sendFailure(res, message, 500);
}
