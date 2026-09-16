import type { TicketPriority } from '../types/ticket';

interface PriorityBadgeProps {
  priority: TicketPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config: Record<TicketPriority, { label: string; bg: string; text: string; icon: string }> = {
    LOW: {
      label: 'Low',
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      text: 'text-slate-600',
      icon: '↓',
    },
    MEDIUM: {
      label: 'Medium',
      bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      text: 'text-blue-600',
      icon: '→',
    },
    HIGH: {
      label: 'High',
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      text: 'text-amber-600',
      icon: '↑',
    },
    URGENT: {
      label: 'Urgent',
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      text: 'text-rose-600',
      icon: '▲',
    },
  };

  const style = config[priority] || config.MEDIUM;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${style.bg}`}
    >
      <span className="font-bold">{style.icon}</span>
      {style.label}
    </span>
  );
}
