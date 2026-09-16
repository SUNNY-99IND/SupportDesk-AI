import { Link } from 'react-router-dom';
import type { Ticket } from '../types/ticket';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Sparkles, Calendar, User } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  return (
    <Link
      to={`/tickets/${ticket._id}`}
      className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-brand-700"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {ticket.category}
          </span>
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <h4 className="mt-3 font-semibold text-slate-900 group-hover:text-brand-600 transition dark:text-white dark:group-hover:text-brand-400">
          {ticket.title}
        </h4>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
          {ticket.description}
        </p>

        {ticket.aiClassification && (
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-indigo-50/70 px-2.5 py-1.5 text-xs text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
            <Sparkles className="size-3.5 shrink-0 text-indigo-500" />
            <span className="font-medium capitalize">{ticket.aiClassification.intent.replace('_', ' ')}</span>
            <span className="text-slate-400">·</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{ticket.aiClassification.sentiment}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <User className="size-3.5 shrink-0" />
          <span className="truncate">{ticket.customerName || 'Customer'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="size-3.5 shrink-0" />
          <span>{new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </Link>
  );
}
