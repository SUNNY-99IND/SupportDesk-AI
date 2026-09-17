import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bot,
  UserPlus,
  AlertCircle,
  ArrowLeft,
  LogOut,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Mail,
  Lock,
  User,
  Building2,
} from 'lucide-react';

/**
 * Validates that an email address follows standard RFC syntax with a proper domain and TLD.
 */
function validateEmail(val: string): { isValid: boolean; message?: string } {
  const trimmed = val.trim().toLowerCase();
  if (!trimmed) return { isValid: false, message: 'Email address is required' };
  if (trimmed.includes(' ')) return { isValid: false, message: 'Email cannot contain spaces' };
  if (trimmed.includes('..')) return { isValid: false, message: 'Email cannot contain consecutive dots' };

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Please enter a valid email format (e.g. name@gmail.com)' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2 || !parts[1]) {
    return { isValid: false, message: 'Email must contain a valid domain' };
  }

  const domain = parts[1];
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return { isValid: false, message: 'Email domain must have a valid extension (.com, .org, etc.)' };
  }

  return { isValid: true };
}

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const emailValidation = validateEmail(email);
  const isEmailValid = email.length > 0 && emailValidation.isValid;
  const showEmailError = emailTouched && email.length > 0 && !emailValidation.isValid;

  // If already authenticated, show session info and explicit options instead of silent redirect
  if (isAuthenticated && user) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 antialiased dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <UserCheck className="size-6" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">You Are Already Signed In</h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Active session as <strong className="text-slate-700 dark:text-slate-200">{user.fullName || user.email}</strong> ({user.roles?.join(', ')})
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                to="/dashboard"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="size-4" />
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <LogOut className="size-4" />
                <span>Sign Out to Register a New Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle direct registration
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateEmail(email);
    if (!validation.isValid) {
      setError(validation.message || 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        organizationName: organizationName.trim() || 'Default Workspace',
        role: 'CUSTOMER',
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 antialiased dark:bg-slate-950 sm:px-6 lg:px-8">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/5" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* Back to Home Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Brand Banner */}
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/25">
            <Bot className="size-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create SupportDesk Account
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Join your organization workspace with secure role-based access
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="size-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Email Address with Live Verification */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email address
                </label>
                {isEmailValid && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    <span>Valid email format</span>
                  </span>
                )}
              </div>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="size-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="e.g. name@gmail.com"
                  className={`w-full rounded-xl border pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-slate-800 dark:text-white ${
                    showEmailError
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-rose-700'
                      : isEmailValid
                      ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-700'
                      : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700'
                  }`}
                />
                {isEmailValid && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-emerald-500">
                    <CheckCircle2 className="size-4" />
                  </div>
                )}
              </div>
              {showEmailError && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                  {emailValidation.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="size-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Organization Workspace */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Organization Workspace (Optional)
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Building2 className="size-4" />
                </div>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Acme Corp (or leave blank)"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
            >
              <UserPlus className="size-4" />
              <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
