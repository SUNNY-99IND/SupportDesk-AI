/**
 * Client-side 404. Rendered by the catch-all route in App.tsx.
 */
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="py-12 text-center">
      <p className="text-sm font-medium text-brand-600 dark:text-brand-400">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        That route does not exist yet.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        Back to setup check
      </Link>
    </div>
  );
}
