/**
 * Consistent JSON response envelope.
 *
 * Every endpoint in this API answers with one of exactly two shapes:
 *
 *   success:  { "success": true,  "data": { ... } }
 *             { "success": true,  "message": "..." }
 *   failure:  { "success": false, "message": "..." }
 *
 * Centralising this means the frontend can write one response parser instead
 * of guessing the shape per endpoint.
 */
import type { Response } from 'express';

export interface SuccessBody<T> {
  success: true;
  data?: T;
  message?: string;
}

export interface FailureBody {
  success: false;
  message: string;
  errors?: unknown;
}

interface SuccessOptions<T> {
  data?: T;
  message?: string;
  status?: number;
}

/** Send a 2xx response. Keys that were not supplied are omitted entirely. */
export function sendSuccess<T>(res: Response, options: SuccessOptions<T> = {}): Response {
  const { data, message, status = 200 } = options;

  const body: SuccessBody<T> = { success: true };
  if (message !== undefined) body.message = message;
  if (data !== undefined) body.data = data;

  return res.status(status).json(body);
}

/** Send a 4xx/5xx response. */
export function sendFailure(
  res: Response,
  message: string,
  status = 500,
  errors?: unknown
): Response {
  const body: FailureBody = { success: false, message };
  if (errors !== undefined) body.errors = errors;

  return res.status(status).json(body);
}
