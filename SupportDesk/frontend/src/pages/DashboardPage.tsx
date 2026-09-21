import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchTickets } from '../services/ticket.service';
import { fetchMyWorkspace, verifyWorkspaceOwnership } from '../services/workspace.service';
import type { Ticket } from '../types/ticket';
import type { WorkspaceDetails } from '../types/workspace';
import { TicketTable } from '../components/TicketTable';
import {
  Ticket as TicketIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  ArrowRight,
  Globe,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  BookOpen,
  Bot,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceDetails | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const loadData = async () => {
    try {
      const [ticketsData, workspaceData] = await Promise.all([
        fetchTickets().catch(() => []),
        fetchMyWorkspace().catch(() => null),
      ]);
      setTickets(ticketsData);
      if (workspaceData) {
        setWorkspace(workspaceData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyOwnership = async (sandboxBypass = false) => {
    setIsVerifying(true);
    setVerificationFeedback(null);
    try {
      const result = await verifyWorkspaceOwnership({ sandboxBypass });
      setVerificationFeedback({
        success: result.verified,
        message:
          result.message ||
          (result.verified
            ? 'Website ownership successfully confirmed! Your workspace is fully active.'
            : 'Could not find the verification meta tag on your website.'),
      });
      if (result.verified && workspace) {
        setWorkspace({ ...workspace, verificationStatus: 'VERIFIED' });
      }
    } catch (err: any) {
      setVerificationFeedback({
        success: false,
        message: err.message || 'Verification failed. Please check your website and try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Metrics computation
  const totalCount = workspace?.metrics?.totalTickets ?? tickets.length;
  const openCount = workspace?.metrics?.openTickets ?? tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = workspace?.metrics?.inProgressTickets ?? tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount =
    workspace?.metrics?.resolvedTickets ?? tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const aiHandledCount =
    workspace?.metrics?.aiHandledCount ?? tickets.filter((t) => t.aiClassification && !t.aiClassification.requiresHuman).length;
  const avgResponseTime = workspace?.metrics?.averageResponseTime || '1.8m';

  const isOwner = user?.roles.includes('OWNER');
  const isAgent = user?.roles.includes('AGENT');
  const widgetKey = workspace?.widgetKey || 'wdg_demo_key';
  const verificationToken = workspace?.verificationToken || 'supportdesk-token';

  const embedSnippet = `<script\n  src="${window.location.origin}/widget.js"\n  data-widget-key="${widgetKey}"\n  async>\n</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* 1. Connected Business Workspace Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-200/80 bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-700 p-8 text-white shadow-lg shadow-brand-500/10 dark:border-brand-900/50">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                <Globe className="size-3.5" />
                <span>{workspace?.name || user?.organization || 'Connected Business'}</span>
              </span>

              {workspace?.verificationStatus === 'VERIFIED' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 border border-emerald-400/40 px-2.5 py-0.5 text-xs font-medium text-emerald-200 backdrop-blur-sm">
                  <ShieldCheck className="size-3.5 text-emerald-300" />
                  <span>Verified Website</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/30 border border-amber-400/40 px-2.5 py-0.5 text-xs font-medium text-amber-200 backdrop-blur-sm">
                  <AlertCircle className="size-3.5 text-amber-300" />
                  <span>Pending Ownership Verification</span>
                </span>
              )}

              <span className="rounded-full bg-indigo-500/30 px-2.5 py-0.5 text-xs font-medium text-indigo-100">
                {isOwner ? 'Workspace Owner' : isAgent ? 'Support Agent' : 'Team Member'}
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {workspace?.name || 'SupportDesk Workspace'}
            </h1>

            {workspace?.websiteUrl && (
              <p className="flex items-center gap-1.5 text-sm text-brand-100">
                <span>Connected Website:</span>
                <a
                  href={workspace.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline hover:text-white flex items-center gap-1"
                >
                  <span>{workspace.websiteUrl}</span>
                  <ExternalLink className="size-3" />
                </a>
              </p>
            )}
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/tickets"
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
            >
              <Plus className="size-4" />
              <span>Create Ticket</span>
            </Link>

            <Link
              to="/widget-preview"
              className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <Bot className="size-4" />
              <span>Preview Support Widget</span>
            </Link>

            <Link
              to="/knowledge"
              className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <BookOpen className="size-4" />
              <span>Knowledge Base</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Website Ownership Verification Card (Shown if Pending) */}
      {workspace && workspace.verificationStatus !== 'VERIFIED' && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold">
                <ShieldCheck className="size-5 text-amber-600 dark:text-amber-400" />
                <span>Verify Website Ownership to Finalize Activation</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 max-w-2xl leading-relaxed">
                Add this meta tag to your website's <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded font-mono">&lt;head&gt;</code> section so SupportDesk AI can verify you own <strong>{workspace.websiteUrl}</strong>:
              </p>
              <div className="mt-2 rounded-xl bg-slate-900 p-3 text-xs font-mono text-emerald-400 flex items-center justify-between overflow-x-auto">
                <span>&lt;meta name="supportdesk-verification" content="{verificationToken}" /&gt;</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`<meta name="supportdesk-verification" content="${verificationToken}" />`);
                  }}
                  className="ml-3 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-white shrink-0"
                >
                  Copy Tag
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleVerifyOwnership(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
              >
                {isVerifying ? <RefreshCw className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                <span>Check Website Now</span>
              </button>

              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleVerifyOwnership(true)}
                title="Instant verification for evaluation and testing without modifying live DNS"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-300"
              >
                <Sparkles className="size-3.5 text-amber-500" />
                <span>Instant Verify (Sandbox)</span>
              </button>
            </div>
          </div>

          {verificationFeedback && (
            <div
              className={`mt-4 rounded-xl p-3 text-xs flex items-center gap-2 ${
                verificationFeedback.success
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              }`}
            >
              {verificationFeedback.success ? <Check className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
              <span>{verificationFeedback.message}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. 6 Core Support Workspace Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {/* Total Tickets */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Tickets</span>
            <div className="grid size-8 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <TicketIcon className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Workspace total</p>
        </div>

        {/* Open Tickets */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Open Tickets</span>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{openCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Awaiting agent reply</p>
        </div>

        {/* Pending / In Progress */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">In Progress</span>
            <div className="grid size-8 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Under investigation</p>
        </div>

        {/* Resolved */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Resolved</span>
            <div className="grid size-8 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{resolvedCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Successfully closed</p>
        </div>

        {/* AI Handled */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">AI Handled</span>
            <div className="grid size-8 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
              <Sparkles className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-violet-600 dark:text-violet-400">{aiHandledCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Deflected via AI RAG</p>
        </div>

        {/* Avg Response Time */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Avg Response</span>
            <div className="grid size-8 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400">{avgResponseTime}</p>
          <p className="mt-1 text-[11px] text-slate-400">AI + Agent combined</p>
        </div>
      </div>

      {/* 4. Support Widget Embed Code Panel */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="size-5 text-brand-600 dark:text-brand-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Website Support Widget</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Embed the SupportDesk AI customer chat on <strong>{workspace?.websiteUrl || 'your website'}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/widget-preview"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ExternalLink className="size-3.5" />
              <span>Test Widget Simulator</span>
            </Link>
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              {copiedSnippet ? <Check className="size-3.5 text-white" /> : <Copy className="size-3.5" />}
              <span>{copiedSnippet ? 'Copied to Clipboard!' : 'Copy Embed Code'}</span>
            </button>
          </div>
        </div>

        <div className="mt-4">
          <pre className="rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
            <code>{embedSnippet}</code>
          </pre>
          <p className="mt-2 text-[11px] text-slate-400">
            Public widget key: <code className="text-brand-600 dark:text-brand-400 font-semibold">{widgetKey}</code>. Customer inquiries are automatically linked to your workspace knowledge base and ticket queues.
          </p>
        </div>
      </div>

      {/* 5. Support Queue & Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Workspace Support Queue</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live customer tickets synced with AI classification and agent assignments
            </p>
          </div>

          <Link
            to="/tickets"
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
          >
            <span>View all tickets</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <TicketTable tickets={tickets.slice(0, 5)} isLoading={isLoading} />
      </div>
    </div>
  );
}
