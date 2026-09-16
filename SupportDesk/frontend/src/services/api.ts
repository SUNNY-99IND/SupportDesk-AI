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
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const DEFAULT_TIMEOUT_MS = 8000;

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
 * Resolves with the envelope on success, throws ApiError otherwise. Callers
 * therefore only need try/catch, not two layers of checking.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<ApiSuccess<T>> {
  let response: Response;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string>),
  };

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      // Aborts a request that hangs, so the UI never spins forever. If the
      // caller passed its own signal (component unmounted, user cancelled),
      // both are honoured — whichever fires first wins.
      signal: init.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(DEFAULT_TIMEOUT_MS)])
        : AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    // fetch() only rejects for network-level failures: server down, DNS,
    // offline, or our own abort.
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('The server took too long to respond.');
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request cancelled.');
    }
    throw new ApiError('Cannot reach the API. Is the backend running on port 5001?');
  }

  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(`Server returned a non-JSON response (HTTP ${response.status}).`, response.status);
  }

  // Two separate checks, not one combined condition. TypeScript can only
  // narrow `body` to the success shape if the failure case is tested on its
  // own — `if (!response.ok || body.success === false)` would compile the
  // check but leave `body` typed as the full union below.
  if (body.success === false) {
    throw new ApiError(body.message, response.status);
  }

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }

  return body;
}
