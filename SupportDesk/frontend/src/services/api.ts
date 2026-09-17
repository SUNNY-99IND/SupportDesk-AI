/**
 * The single place this app talks to the network.
 *
 * Every component calls through here instead of using fetch() directly. That
 * gives us one spot to add the Authorization header in Phase 3, one spot to
 * shape errors, and one spot to enforce timeouts.
 */
import type { ApiResponse, ApiSuccess } from '../types/api';

// Empty in development: '/api/health' then hits the Vite dev server, which
// proxies to Express. In production this is the deployed API origin.
// Normalize BASE_URL so trailing slashes never produce invalid double-slash paths.
// In development, empty string uses Vite's local dev proxy (/api -> :5001).
// In production, this resolves to the deployed backend origin.
const rawBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
const BASE_URL = rawBase.replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 45000;

/** An error we can show to the user, carrying the HTTP status when we have one. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Perform a request and unwrap the `{ success, ... }` envelope.
 *
 * Resolves with the envelope on success, throws ApiError otherwise.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<ApiSuccess<T>> {
  let response: Response;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string>),
  };

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const requestUrl = BASE_URL ? `${BASE_URL}${normalizedPath}` : normalizedPath;

  try {
    response = await fetch(requestUrl, {
      ...init,
      headers,
      // Aborts a request that hangs, so the UI never spins forever.
      signal: init.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(DEFAULT_TIMEOUT_MS)])
        : AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('The server took too long to respond. Please check your connection.');
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request cancelled.');
    }
    throw new ApiError('Unable to connect to the SupportDesk API. Please try again shortly.');
  }

  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      response.status === 404
        ? 'Requested service was not found.'
        : `Server communication failed (HTTP ${response.status}).`,
      response.status
    );
  }

  if (body.success === false) {
    let message = body.message;
    if (response.status === 404 && message.toLowerCase().includes('route')) {
      message = 'The requested endpoint is temporarily unavailable. Please try again.';
    }
    throw new ApiError(message, response.status);
  }

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }

  return body;
}
