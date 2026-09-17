import { useState, useRef, useEffect, type FormEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authService from '../services/auth.service';
import {
  Bot,
  UserPlus,
  AlertCircle,
  ArrowLeft,
  LogOut,
  ArrowRight,
  UserCheck,
  Mail,
  RefreshCw,
  Edit2,
  CheckCircle2,
} from 'lucide-react';

export function RegisterPage() {
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  // 6-digit OTP fields
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // State
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { register, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Handle Resend Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  // Step 1: Send OTP
  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.sendRegistrationOtp(trimmedEmail);
      if (result.data?.devOtp) {
        setDevOtp(result.data.devOtp);
      } else {
        setDevOtp(null);
      }
      setStep('OTP');
      setResendCooldown(60);
      setSuccessMessage(result.message || `Verification code sent to ${trimmedEmail}`);
      // Focus the first OTP input after switching views
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const result = await authService.sendRegistrationOtp(email.trim().toLowerCase());
      if (result.data?.devOtp) {
        setDevOtp(result.data.devOtp);
      } else {
        setDevOtp(null);
      }
      setResendCooldown(60);
      setSuccessMessage(result.message || 'A new verification code has been sent.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP digit changes
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric characters
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    if (char && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pastedData.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
  };

  // Step 2 Submit: Verify OTP & Complete Registration
  const handleVerifyAndRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
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
        otp: fullOtp,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
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
            {step === 'FORM' ? 'Create SupportDesk Account' : 'Verify Your Email'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {step === 'FORM'
              ? 'Join your organization workspace with secure role-based access'
              : 'Enter the 6-digit code sent to your email to complete registration'}
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

          {successMessage && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {step === 'FORM' ? (
            /* STEP 1: ACCOUNT DETAILS */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Organization Workspace (Optional)
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Acme Corp (or leave blank)"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Sending verification code...' : 'Continue & Verify Email'}</span>
                <Mail className="size-4" />
              </button>
            </form>
          ) : (
            /* STEP 2: ENTER OTP */
            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Verifying address:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('FORM');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
                  >
                    <Edit2 className="size-3" />
                    <span>Change</span>
                  </button>
                </div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white truncate">
                  {email}
                </div>
              </div>

              {/* Evaluation Code Notice (if SMTP is not yet configured on server) */}
              {devOtp && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-amber-900 dark:text-amber-300">
                      Evaluation Code (SMTP not configured on server):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = devOtp.split('').slice(0, 6);
                        setOtpDigits(digits);
                        setError(null);
                      }}
                      className="shrink-0 rounded-lg bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-900 transition hover:bg-amber-300 dark:bg-amber-900/80 dark:text-amber-100"
                    >
                      Fill Code
                    </button>
                  </div>
                  <div className="mt-1.5 font-mono text-base font-extrabold tracking-widest text-amber-950 dark:text-white">
                    {devOtp}
                  </div>
                  <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
                    To deliver real emails to your Gmail inbox, set <code>SMTP_USER</code> and <code>SMTP_PASS</code> in your Render environment variables.
                  </p>
                </div>
              )}

              {/* 6-Digit Boxes */}
              <div>
                <label className="block text-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Enter 6-Digit OTP Code
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      className="size-11 sm:size-12 rounded-xl border border-slate-200 text-center font-mono text-xl font-bold text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  ))}
                </div>
              </div>

              {/* Resend Cooldown */}
              <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                {resendCooldown > 0 ? (
                  <span>Resend code in <strong className="text-slate-700 dark:text-slate-300">{resendCooldown}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
                  >
                    <RefreshCw className="size-3" />
                    <span>Didn&apos;t receive a code? Resend Code</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpDigits.join('').length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Verifying & Creating Account...' : 'Verify & Create Account'}</span>
                <UserPlus className="size-4" />
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
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
