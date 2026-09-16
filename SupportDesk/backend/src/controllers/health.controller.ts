/**
 * Health controller.
 *
 * A controller's only job is HTTP: read the request, call a service, shape the
 * response. There is no service layer here yet because there is nothing to
 * ask — this endpoint proves the process is up and accepting requests.
 *
 * Response contract (fixed by the PRD, do not change casually):
 *   { "success": true, "message": "SupportDesk AI API is running" }
 */
import type { Request, Response } from 'express';
import { sendSuccess } from '../utils/apiResponse';

export function getHealth(_req: Request, res: Response): void {
  sendSuccess(res, { message: 'SupportDesk AI API is running' });
}
