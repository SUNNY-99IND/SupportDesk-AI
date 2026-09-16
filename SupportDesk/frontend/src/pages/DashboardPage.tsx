import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchTickets } from '../services/ticket.service';
import type { Ticket } from '../types/ticket';
import { TicketTable } from '../components/TicketTable';
import {
  Ticket as TicketIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchTickets();
        setTickets(data);
      } catch (err) {
        console.error('Failed to load dashboard tickets:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  const isCustomer = user?.roles.includes('CUSTOMER') && !user?.roles.includes('AGENT') && !user?.roles.includes('ADMIN');
  const isAgent = user?.roles.includes('AGENT') && !user?.roles.includes('ADMIN');
  const isAdmin = user?.roles.includes('ADMIN');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-brand-200/80 bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-700 p-8 text-white shadow-lg shadow-brand-500/10 md:flex-row md:items-center dark:border-brand-900/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              {isAdmin ? '🛡️ Administrator Workspace' : isAgent ? '🎧 Support Specialist Portal' : '👤 Customer Portal'}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="mt-1 text-sm text-brand-100 max-w-xl">
            {isCustomer
              ? 'Track your active support requests, resolve issues faster, and consult your dedicated AI assistant.'
              : isAgent
              ? 'Manage assigned customer tickets, resolve pending issues, and leverage AI-drafted responses.'
              : 'Oversee full-stack operations, review system health metrics, manage users, and monitor tickets.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/tickets"
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
          >
            <Plus className="size-4" />
            <span>New Ticket</span>
          </Link>
          <Link
            to="/chat"
            className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <Sparkles className="size-4" />
            <span>AI Copilot</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Tickets
            </span>
            <div className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <TicketIcon className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</p>
          <p className="mt-1 text-xs text-slate-400">Recorded in MongoDB</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Open Pending
            </span>
            <div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {openCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">Awaiting agent response</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              In Progress
            </span>
            <div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {inProgressCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">Under active investigation</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Resolved
            </span>
            <div className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {resolvedCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">Successfully closed</p>
        </div>
      </div>

      {/* Recent Activity & Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isCustomer ? 'My Support Tickets' : 'Support Queue'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time synchronization with document & relational data stores
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

      {/* AI Assistant Callout */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-brand-50/70 p-6 dark:border-indigo-900/50 dark:from-indigo-950/30 dark:to-slate-900">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                Have a question or need instant guidance?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                The SupportDesk AI assistant is trained to help resolve billing, SAML, and technical issues.
              </p>
            </div>
          </div>
          <Link
            to="/chat"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <MessageSquare className="size-3.5" />
            <span>Launch AI Copilot</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
