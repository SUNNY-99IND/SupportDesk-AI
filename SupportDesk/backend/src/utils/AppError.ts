/**
 * Operational error type.
 *
 * "Operational" means an error we anticipated and can describe to the client
 * (ticket not found, bad input, not authorised). Anything that is NOT an
 * AppError is treated as an unexpected bug by the error handler, which then
 * hides the details from the client and logs them for us instead.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational = true;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;

    // Keeps the stack trace pointing at the real throw site.
    Error.captureStackTrace?.(this, AppError);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, 404);
  }

  static badRequest(message = 'Invalid request', details?: unknown): AppError {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = 'You do not have permission to do that'): AppError {
    return new AppError(message, 403);
  }

  static conflict(message = 'Resource already exists'): AppError {
    return new AppError(message, 409);
  }
}
