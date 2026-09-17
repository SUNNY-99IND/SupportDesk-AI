import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, LogIn, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Banner */}
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/25">
            <Bot className="size-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome to SupportDesk AI
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in to manage tickets and access the AI Copilot
          </p>
        </div>

        {/* Demo Credentials Helper Box - Fills form inputs only, does NOT auto-login */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Demo Test Accounts (Password: Password123!)
          </p>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleFillCredentials('customer@supportdesk.ai')}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-medium text-slate-700 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Fill Customer
            </button>
            <button
              type="button"
              onClick={() => handleFillCredentials('agent@supportdesk.ai')}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-medium text-slate-700 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Fill Agent
            </button>
            <button
              type="button"
              onClick={() => handleFillCredentials('admin@supportdesk.ai')}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-medium text-slate-700 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Fill Admin
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Clicking fills email/password. You must click &quot;Sign In&quot; to verify credentials with backend.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
              <LogIn className="size-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
