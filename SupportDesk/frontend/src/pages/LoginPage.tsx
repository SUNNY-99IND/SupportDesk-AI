import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, LogIn, AlertCircle, Shield, Headphones, User } from 'lucide-react';
import type { Role } from '../types/auth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, switchDemoUser } = useAuth();
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
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = async (role: Role) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await switchDemoUser(role);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
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

        {/* Demo Fast Login Box */}
        <div className="rounded-2xl border border-brand-200/80 bg-brand-50/60 p-4 dark:border-brand-900/50 dark:bg-brand-950/30">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            ⚡ 1-Click Demo Personas
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoClick('CUSTOMER')}
              className="flex flex-col items-center gap-1 rounded-xl border border-brand-200 bg-white p-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <User className="size-4 text-brand-600" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('AGENT')}
              className="flex flex-col items-center gap-1 rounded-xl border border-brand-200 bg-white p-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <Headphones className="size-4 text-indigo-600" />
              <span>Agent</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('ADMIN')}
              className="flex flex-col items-center gap-1 rounded-xl border border-brand-200 bg-white p-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <Shield className="size-4 text-purple-600" />
              <span>Admin</span>
            </button>
          </div>
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
