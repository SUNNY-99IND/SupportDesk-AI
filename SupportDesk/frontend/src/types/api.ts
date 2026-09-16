/**
 * Shared API types.
 *
 * These mirror backend/src/utils/apiResponse.ts exactly. Because the envelope
 * is a discriminated union on `success`, TypeScript forces us to check that
 * field before touching `data` — the compiler makes error handling mandatory
 * rather than optional.
 */

export interface ApiSuccess<T> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
