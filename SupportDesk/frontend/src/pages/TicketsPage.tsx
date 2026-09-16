import { useState, useEffect, type FormEvent } from 'react';
import { fetchTickets, createTicket } from '../services/ticket.service';
import { classifyText } from '../services/ai.service';
import type { Ticket, TicketPriority, AIClassification } from '../types/ticket';
import { TicketTable } from '../components/TicketTable';
import { TicketCard } from '../components/TicketCard';
import { Modal } from '../components/Modal';
import {
  Search,
  Plus,
  Filter,
  Sparkles,
  LayoutGrid,
  List,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live AI pre-classification state
  const [aiPreview, setAiPreview] = useState<AIClassification | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTickets({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        search: search.trim() || undefined,
      });
      setTickets(data);
    } catch (err: any) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets();
    }, 200);
    return () => clearTimeout(timer);
  }, [statusFilter, priorityFilter, search]);

  const handleLiveClassify = async () => {
    if (!title && !description) return;
    setIsClassifying(true);
    try {
      const res = await classifyText(title || 'Support Ticket', description);
      setAiPreview(res);
      if (res.priority) {
        setPriority(res.priority.toUpperCase() as TicketPriority);
      }
    } catch (err) {
      console.warn('Live classification preview failed:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleCreateTicket = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const newTicket = await createTicket({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });

      setTickets((prev) => [newTicket, ...prev]);
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setCategory('General');
      setPriority('MEDIUM');
      setAiPreview(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Support Tickets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create, search, track, and manage customer support requests
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <Plus className="size-4" />
          <span>Create Ticket</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/70">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by title or description..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800">
            <Filter className="size-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none dark:text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING">Waiting</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none dark:text-slate-200"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'table'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <List className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {viewMode === 'table' ? (
        <TicketTable tickets={tickets} isLoading={isLoading} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket} />
          ))}
        </div>
      )}

      {/* Create Ticket Modal with AI Pre-Classification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Support Ticket"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ticket Title
            </label>
            <input
              type="text"
              required
              minLength={5}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Double charged on subscription invoice"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="General">General</option>
                <option value="Billing">Billing & Refunds</option>
                <option value="Technical">Technical Bug</option>
                <option value="Account">Account & SSO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Issue Description
              </label>
              <button
                type="button"
                onClick={handleLiveClassify}
                disabled={isClassifying || description.length < 5}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-500 disabled:opacity-40 dark:text-brand-400"
              >
                <Sparkles className="size-3" />
                <span>{isClassifying ? 'Analyzing...' : 'AI Pre-Classify'}</span>
              </button>
            </div>
            <textarea
              required
              minLength={10}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue in detail. Our AI will automatically analyze intent and priority..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* AI Pre-Classification Live Card */}
          {aiPreview && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/40">
              <div className="flex items-center justify-between font-semibold text-indigo-900 dark:text-indigo-200">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>AI Pre-Analysis Result:</span>
                </div>
                <span className="capitalize text-indigo-700 dark:text-indigo-300">
                  {aiPreview.intent.replace('_', ' ')}
                </span>
              </div>
              <p className="mt-1 text-indigo-800/80 dark:text-indigo-300/80">
                {aiPreview.response}
              </p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-indigo-600 dark:text-indigo-400">
                <span>Sentiment: <strong>{aiPreview.sentiment}</strong></span>
                <span>Requires Specialist: <strong>{aiPreview.requiresHuman ? 'Yes' : 'No'}</strong></span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Creating...' : 'Submit Ticket'}</span>
              <CheckCircle2 className="size-4" />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
