import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateWebsiteUrlLive } from '../services/workspace.service';
import {
  Bot,
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
  Globe,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

/**
 * Validates that an email address follows standard RFC syntax with a proper domain and TLD.
 */
function validateEmail(val: string): { isValid: boolean; message?: string } {
  const trimmed = val.trim().toLowerCase();
  if (!trimmed) return { isValid: false, message: 'Owner email address is required' };
  if (trimmed.includes(' ')) return { isValid: false, message: 'Email cannot contain spaces' };
  if (trimmed.includes('..')) return { isValid: false, message: 'Email cannot contain consecutive dots' };

  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Please enter a valid email format (e.g. owner@example.com)' };
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
  // Form fields
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Validation & UI states
  const [emailTouched, setEmailTouched] = useState(false);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlValidated, setUrlValidated] = useState(false);
  const [validatedHost, setValidatedHost] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registerBusiness, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const emailValidation = validateEmail(ownerEmail);
  const isEmailValid = ownerEmail.length > 0 && emailValidation.isValid;
  const showEmailError = emailTouched && ownerEmail.length > 0 && !emailValidation.isValid;

  // Auto-validate URL when typing pauses
  useEffect(() => {
    const trimmed = websiteUrl.trim();
    if (!trimmed) {
      setUrlValidated(false);
      setUrlError(null);
      setValidatedHost(null);
      return;
    }

    const timer = setTimeout(async () => {
      // Basic check before making network call
      if (trimmed.length < 4) return;
      setIsValidatingUrl(true);
      setUrlError(null);

      try {
        const result = await validateWebsiteUrlLive(trimmed);
        if (result.isReachable) {
          setUrlValidated(true);
          setValidatedHost(result.hostname);
          setUrlError(null);
        } else {
          setUrlValidated(false);
          setUrlError(result.error || "Website could not be reached. Please check the URL and try again.");
        }
      } catch (err: any) {
        setUrlValidated(false);
        setValidatedHost(null);
        setUrlError(err.message || "We couldn't reach this website. Please check the URL and try again.");
      } finally {
        setIsValidatingUrl(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [websiteUrl]);

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
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <UserCheck className="size-6" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Active Session Detected</h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Signed in as <strong className="text-slate-700 dark:text-slate-200">{user.fullName || user.email}</strong>
              {user.organization ? ` (${user.organization})` : ''}
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                to="/dashboard"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              >
                <span>Go to Workspace Dashboard</span>
                <ArrowRight className="size-4" />
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <LogOut className="size-4" />
                <span>Sign Out to Connect Another Business</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle business signup submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const emailCheck = validateEmail(ownerEmail);
    if (!emailCheck.isValid) {
      setGeneralError(emailCheck.message || 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setGeneralError('Password must be at least 6 characters.');
      return;
    }

    if (!businessName.trim()) {
      setGeneralError('Please enter your business or store name.');
      return;
    }

    if (!websiteUrl.trim()) {
      setGeneralError('Please enter your business website URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerBusiness({
        fullName: ownerName.trim(),
        email: ownerEmail.trim().toLowerCase(),
        password,
        businessName: businessName.trim(),
        websiteUrl: websiteUrl.trim(),
      });
      navigate('/dashboard');
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to create workspace. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 antialiased dark:bg-slate-950 sm:px-6 lg:px-8">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[650px] rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/5" />
      </div>

      <div className="relative w-full max-w-xl space-y-6">
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
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Connect Your Website to SupportDesk
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Receive a dedicated customer support workspace with AI co-pilot, tickets, and embedded chat for your store.
          </p>
        </div>

        {/* Workflow steps hint */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200/60 bg-white/60 p-3 text-center text-xs dark:border-slate-800 dark:bg-slate-900/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-1 text-brand-600 dark:text-brand-400">
            <span className="flex size-5 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950 font-bold text-[10px]">
              1
            </span>
            <span className="font-semibold">Owner Profile</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-brand-600 dark:text-brand-400">
            <span className="flex size-5 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950 font-bold text-[10px]">
              2
            </span>
            <span className="font-semibold">Connect Website</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-slate-400">
            <span className="flex size-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[10px]">
              3
            </span>
            <span className="font-medium">AI Workspace</span>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {generalError && (
            <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Registration Issue</p>
                <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-400">{generalError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section 1: Owner Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                <ShieldCheck className="size-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Workspace Owner Information
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Owner Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Owner Full Name
                  </label>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <User className="size-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Owner Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Owner Email (Primary Account)
                  </label>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Mail className="size-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={ownerEmail}
                      onChange={(e) => {
                        setOwnerEmail(e.target.value);
                        if (generalError) setGeneralError(null);
                      }}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="owner@abcshoes.com"
                      className={`w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-slate-800 dark:text-white ${
                        showEmailError
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-rose-700'
                          : isEmailValid
                          ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-700'
                          : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  {showEmailError && (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{emailValidation.message}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Account Password
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
                    placeholder="Create a strong password (minimum 6 characters)"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Business Information */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                <Building2 className="size-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Business & Website Details
                </h3>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Company / Business Name
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Building2 className="size-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. ABC Shoes or Acme Technologies"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Website URL (CRITICAL LIVE VALIDATION) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Business Website URL
                  </label>
                  {isValidatingUrl ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-600 dark:text-brand-400">
                      <Loader2 className="size-3 animate-spin" />
                      <span>Validating reachability & DNS...</span>
                    </span>
                  ) : urlValidated ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" />
                      <span>Reachable & safe: {validatedHost}</span>
                    </span>
                  ) : null}
                </div>

                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Globe className="size-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={websiteUrl}
                    onChange={(e) => {
                      setWebsiteUrl(e.target.value);
                      setUrlValidated(false);
                      if (urlError) setUrlError(null);
                    }}
                    placeholder="https://abcshoes.com"
                    className={`w-full rounded-xl border pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-slate-800 dark:text-white ${
                      urlError
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-rose-700'
                        : urlValidated
                        ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-700'
                        : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {isValidatingUrl ? (
                      <Loader2 className="size-4 text-brand-500 animate-spin" />
                    ) : urlValidated ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : null}
                  </div>
                </div>

                {urlError ? (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{urlError}</span>
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Enter your live store/company URL (e.g. <code>https://example.com</code>). We probe DNS resolution and reachability before provisioning your workspace.
                  </p>
                )}
              </div>
            </div>

            {/* Note on Workspace Owner Role */}
            <div className="rounded-2xl bg-brand-50/70 p-3.5 text-xs text-brand-900 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-100 dark:border-brand-900/50 flex items-start gap-2.5">
              <Sparkles className="size-4 shrink-0 text-brand-600 dark:text-brand-400 mt-0.5" />
              <div>
                <p className="font-semibold">Workspace Ownership Provisioning</p>
                <p className="mt-0.5 text-[11px] text-brand-700 dark:text-brand-300/80">
                  You will become the <strong>Workspace Owner</strong> for this business website. You will be able to invite support agents, manage knowledge base articles, and configure your live support widget from your dashboard.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isValidatingUrl}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 hover:shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Validating website & provisioning workspace...</span>
                </>
              ) : (
                <>
                  <span>Create Workspace & Continue</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Already have a connected workspace?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400">
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
