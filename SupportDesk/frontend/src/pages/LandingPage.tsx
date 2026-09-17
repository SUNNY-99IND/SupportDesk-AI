import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bot,
  Ticket,
  MessageSquare,
  BookOpen,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  LogOut,
  LayoutDashboard,
  User,
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 antialiased dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 0. STICKY TOP NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900 dark:text-white">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-sm shadow-brand-500/20">
              <Bot className="size-5" />
            </div>
            <span className="text-lg">
              SupportDesk<span className="text-brand-600 dark:text-brand-400">.AI</span>
            </span>
          </Link>

          {/* Center Links */}
          <nav className="hidden items-center gap-6 text-xs font-semibold text-slate-600 md:flex dark:text-slate-400">
            <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
              Features
            </a>
            <a href="#workflow" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
              Workflow
            </a>
            <Link to="/status" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
              System Status
            </Link>
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <User className="size-3" />
                  <span>{user?.fullName || user?.email}</span>
                  <span className="rounded bg-emerald-200/60 px-1.5 py-0.2 text-[10px] font-bold uppercase dark:bg-emerald-900/60">
                    {user?.roles?.[0] || 'USER'}
                  </span>
                </div>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
                >
                  <LayoutDashboard className="size-3.5" />
                  <span>Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign out of current account"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <LogOut className="size-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-brand-600 dark:text-slate-300 dark:hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT WRAPPER */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-20">
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-white p-8 shadow-sm backdrop-blur-sm sm:p-16 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-900">
          {/* Decorative background glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-96 -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl dark:bg-brand-500/10" />

          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-700 dark:border-brand-900/60 dark:bg-brand-950/60 dark:text-brand-300">
              <Sparkles className="size-3.5" />
              <span>AI-Powered Customer Support Platform</span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
              SupportDesk <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">AI</span>
            </h1>

            <p className="mt-4 text-lg font-medium text-slate-700 sm:text-xl dark:text-slate-200">
              AI-powered customer support platform for modern businesses.
            </p>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base dark:text-slate-400">
              SupportDesk AI brings customer support tickets, real-time conversations, AI-assisted responses,
              knowledge-base support, and actionable analytics together into one unified, secure workspace.
            </p>

            {/* If user is already authenticated, show informative banner and explicit options */}
            {isAuthenticated ? (
              <div className="mt-8 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>You have an active session as <strong>{user?.fullName || user?.email}</strong> ({user?.roles?.join(', ')})</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 hover:shadow-lg"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <LogOut className="size-4" />
                    <span>Sign Out to Switch Account</span>
                  </button>
                </div>
              </div>
            ) : (
              /* If NOT authenticated, show standard Get Started and Sign In buttons */
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 hover:shadow-lg"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <span>Sign In</span>
                </Link>
              </div>
            )}

          {/* Quick Stats / Highlights */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-slate-200/60 pt-8 sm:grid-cols-4 dark:border-slate-800/80 text-left">
            <div className="rounded-2xl bg-white/60 p-4 dark:bg-slate-800/40">
              <p className="text-xs text-slate-500">Response Speed</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">&lt; 2.5s AI Latency</p>
            </div>
            <div className="rounded-2xl bg-white/60 p-4 dark:bg-slate-800/40">
              <p className="text-xs text-slate-500">Security Model</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">JWT + RBAC</p>
            </div>
            <div className="rounded-2xl bg-white/60 p-4 dark:bg-slate-800/40">
              <p className="text-xs text-slate-500">Database Layer</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">Postgres + Mongo</p>
            </div>
            <div className="rounded-2xl bg-white/60 p-4 dark:bg-slate-800/40">
              <p className="text-xs text-slate-500">AI Schema</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">Zod Validated</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section id="features" className="space-y-8 scroll-mt-20">
        <div className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Engineered For Performance
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            Everything You Need to Scale Customer Support
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            A battle-tested architecture combining modern frontend tooling, high-throughput microservices,
            and strict validation guardrails.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80">
            <div className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <Ticket className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              🎫 Ticket Management
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Full lifecycle tracking across OPEN, IN_PROGRESS, WAITING, and RESOLVED. Categorize by Billing,
              Technical, or Account inquiries with priority scoring.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80">
            <div className="grid size-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Bot className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              🤖 AI Support Assistant
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Automated classification extracts intent, priority, sentiment, and whether human specialist
              intervention is needed, returned as strict validated JSON.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80">
            <div className="grid size-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <MessageSquare className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              💬 Real-Time Communication
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Interactive messaging threads connecting customers directly with agents, featuring one-click AI
              draft reply generation for human review.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80">
            <div className="grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <BookOpen className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              📚 Knowledge Base / RAG
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Domain documentation indexing providing grounding data for AI responses, preventing hallucinations
              and treating untrusted user text safely.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80">
            <div className="grid size-12 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
              <BarChart3 className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              📊 Support & AI Analytics
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Administrative telemetry offering complete visibility into resolution rates, category distributions,
              sentiment breakdowns, and active user metrics.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80">
            <div className="grid size-12 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <ShieldCheck className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              🔐 Secure Role-Based Access
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Multi-tiered RBAC enforced on both backend Express middleware and frontend route guards. Separate
              workspaces for Customers, Agents, and Admins.
            </p>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section id="workflow" className="rounded-3xl border border-slate-200/80 bg-slate-50/60 p-8 sm:p-12 dark:border-slate-800 dark:bg-slate-900/40 scroll-mt-20">
        <div className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Intelligent Workflow
          </h2>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
            How SupportDesk AI Resolves Issues Faster
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-5">
          {/* Step 1 */}
          <div className="rounded-2xl bg-white p-5 text-center shadow-xs dark:bg-slate-800">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              1
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Customer creates request</h4>
            <p className="mt-1 text-xs text-slate-500">Ticket filed via customer portal</p>
          </div>

          {/* Step 2 */}
          <div className="rounded-2xl bg-white p-5 text-center shadow-xs dark:bg-slate-800">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              2
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">SupportDesk AI processes</h4>
            <p className="mt-1 text-xs text-slate-500">Intent, sentiment &amp; priority extracted</p>
          </div>

          {/* Step 3 */}
          <div className="rounded-2xl bg-white p-5 text-center shadow-xs dark:bg-slate-800">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              3
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">AI assists support team</h4>
            <p className="mt-1 text-xs text-slate-500">Knowledge retrieved &amp; reply drafted</p>
          </div>

          {/* Step 4 */}
          <div className="rounded-2xl bg-white p-5 text-center shadow-xs dark:bg-slate-800">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              4
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Agent responds</h4>
            <p className="mt-1 text-xs text-slate-500">Human reviews &amp; sends solution</p>
          </div>

          {/* Step 5 */}
          <div className="rounded-2xl bg-white p-5 text-center shadow-xs dark:bg-slate-800">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              5
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Ticket gets resolved</h4>
            <p className="mt-1 text-xs text-slate-500">Customer feedback logged &amp; closed</p>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION (CTA) SECTION */}
      <section className="rounded-3xl border border-brand-200/80 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 p-8 text-center text-white shadow-xl shadow-brand-500/10 sm:p-14">
        <h2 className="text-2xl font-extrabold sm:text-4xl">
          Ready to Upgrade Your Customer Support Operations?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-brand-100 sm:text-base">
          Join small businesses scaling support efficiently with AI-assisted workflows and secure role management.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-md transition hover:bg-brand-50 hover:shadow-lg"
            >
              Open Your Workspace
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-md transition hover:bg-brand-50 hover:shadow-lg"
              >
                Create Your Account
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Sign In to Existing Account
              </Link>
            </>
          )}
        </div>
      </section>
      </main>

      {/* 5. FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white py-8 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-brand-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">SupportDesk AI</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/status" className="hover:text-brand-600 dark:hover:text-brand-400">Status</Link>
            <span>·</span>
            <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400">Sign In</Link>
            <span>·</span>
            <Link to="/register" className="hover:text-brand-600 dark:hover:text-brand-400">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
