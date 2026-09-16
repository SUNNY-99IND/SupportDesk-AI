/**
 * System status page — the Phase 1 landing route.
 *
 * Its only job is to prove the stack is wired end to end: React renders,
 * Tailwind styles, and the browser can reach the Express API. Phase 5 replaces
 * this route with the real landing page and dashboards.
 */
import { HealthStatusCard } from '../components/HealthStatusCard';

export function SystemStatusPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Setup check
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          If the card below reports <strong>Online</strong>, the React app, the Vite dev proxy, and
          the Express API are all working together correctly.
        </p>
      </div>

      <HealthStatusCard />

      <section className="rounded-xl border border-dashed border-slate-300 p-6 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">What is next</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Phase 2 connects PostgreSQL for users, organizations, and roles, and MongoDB for tickets,
          messages, and knowledge-base documents.
        </p>
      </section>
    </div>
  );
}
