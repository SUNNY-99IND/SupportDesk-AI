import { Link } from 'react-router-dom';
import type { Ticket } from '../types/ticket';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { formatTicketDisplayId } from '../utils/jsConcepts';
import { ChevronRight, Sparkles, UserCheck, Clock } from 'lucide-react';

interface TicketTableProps {
  tickets: Ticket[];
  isLoading?: boolean;
}

export function TicketTable({ tickets, isLoading }: TicketTableProps) {
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/60 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>Loading support tickets...</span>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
        <div className="grid size-12 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
          <Clock className="size-6" />
        </div>
        <h4 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
          No tickets found
        </h4>
        <p className="mt-1 text-xs text-slate-500">
          Try changing your filter criteria or create a new support ticket.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3.5">Ticket</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Priority</th>
              <th className="px-4 py-3.5">AI Insights</th>
              <th className="px-4 py-3.5">Assigned Agent</th>
              <th className="px-4 py-3.5">Created</th>
              <th className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {tickets.map((t) => (
              <tr
                key={t._id}
                className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              >
                <td className="px-5 py-4">
                  <Link
                    to={`/tickets/${t._id}`}
                    className="group block font-semibold text-slate-900 transition hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                  >
                    <div className="line-clamp-1">{t.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                      <span className="font-mono text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                        {formatTicketDisplayId(t._id)}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {t.category}
                      </span>
                      <span>by {t.customerName || 'Customer'}</span>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {t.aiClassification ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="size-3 shrink-0" />
                        <span className="font-medium capitalize">{t.aiClassification.intent.replace('_', ' ')}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Sentiment: <span className="font-medium text-slate-600 dark:text-slate-300">{t.aiClassification.sentiment}</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                  {t.assignedAgentName ? (
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="size-3.5 text-emerald-500" />
                      <span>{t.assignedAgentName}</span>
                    </div>
                  ) : (
                    <span className="italic text-slate-400">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                  {new Date(t.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-4 py-4 text-right whitespace-nowrap">
                  <Link
                    to={`/tickets/${t._id}`}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
                  >
                    <span>View</span>
                    <ChevronRight className="size-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
