/**
 * Health service — one function per API resource.
 *
 * Keeping this separate from api.ts means components import a meaningful verb
 * (`fetchHealth`) rather than knowing URLs and response shapes.
 */
import { apiRequest } from './api';

/**
 * Calls GET /api/health.
 * Returns the human-readable status message from the server.
 */
export async function fetchHealth(signal?: AbortSignal): Promise<string> {
  const body = await apiRequest<never>('/api/health', signal ? { signal } : {});
  return body.message ?? 'API responded, but sent no message.';
}
