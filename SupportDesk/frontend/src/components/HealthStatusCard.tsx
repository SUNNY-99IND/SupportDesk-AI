/**
 * Health status card — the one piece of UI that proves Phase 1 works.
 *
 * It demonstrates the data-fetching pattern every later page will reuse:
 *   useState   -> hold status, message, and timestamp
 *   useEffect  -> run the request as a side effect, and clean up after itself
 *   async/await -> read the response without promise chains
 *
 * All four UI states are handled explicitly: loading, success, error, and the
 * re-check in progress. An AbortController cancels the request if the component
 * unmounts first, which also stops React's development double-render from
 * firing two live requests.
 */
import { useEffect, useState } from 'react';
import { fetchHealth } from '../services/health.service';

type Status = 'loading' | 'online' | 'offline';

export function HealthStatusCard() {
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  // Incrementing this re-runs the effect — a simple, dependency-free way to
  // trigger a manual refetch.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    setStatus('loading');

    async function check() {
      try {
        const text = await fetchHealth(controller.signal);
        if (ignore) return;
        setMessage(text);
        setStatus('online');
      } catch (error) {
        if (ignore) return;
        setMessage(error instanceof Error ? error.message : 'Unexpected error');
        setStatus('offline');
      } finally {
        if (!ignore) setCheckedAt(new Date());
      }
    }

    void check();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [attempt]);

  const isLoading = status === 'loading';

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Backend connection
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
              GET /api/health
            </code>
          </p>
        </div>

        {isLoading ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Checking…</span>
        ) : status === 'online' ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">Online</span>
        ) : (
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">Unreachable</span>
        )}
      </div>

      {/* aria-live announces the result to screen readers when it changes. */}
      <p
        aria-live="polite"
        className={`mt-4 text-sm ${
          status === 'offline'
            ? 'text-rose-700 dark:text-rose-300'
            : 'text-slate-700 dark:text-slate-300'
        }`}
      >
        {isLoading ? 'Contacting the API…' : message}
      </p>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          disabled={isLoading}
          className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Checking…' : 'Check again'}
        </button>

        {checkedAt && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Last checked {checkedAt.toLocaleTimeString()}
          </span>
        )}
      </div>
    </section>
  );
}
