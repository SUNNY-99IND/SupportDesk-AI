import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchTicketById,
  updateTicket,
  deleteTicket,
  fetchTicketMessages,
  sendTicketMessage,
} from '../services/ticket.service';
import { getSuggestedReply } from '../services/ai.service';
import { useAuth } from '../context/AuthContext';
import type { Ticket, TicketMessage, TicketStatus, TicketPriority } from '../types/ticket';
import {
  ArrowLeft,
  Send,
  Sparkles,
  User,
  Bot,
  Headphones,
  Trash2,
  AlertCircle,
  Calendar,
  Check,
} from 'lucide-react';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const isStaff = user?.roles.includes('AGENT') || user?.roles.includes('ADMIN');
  const isAdmin = user?.roles.includes('ADMIN');

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const [ticketData, messageData] = await Promise.all([
          fetchTicketById(id),
          fetchTicketMessages(id),
        ]);
        setTicket(ticketData);
        setMessages(messageData);
      } catch (err: any) {
        setError(err.message || 'Failed to load ticket details');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      const updated = await updateTicket(ticket._id, { status: newStatus });
      setTicket(updated);
      setSuccessNotice(`Status changed to ${newStatus}`);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!ticket) return;
    try {
      const updated = await updateTicket(ticket._id, { priority: newPriority });
      setTicket(updated);
      setSuccessNotice(`Priority changed to ${newPriority}`);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update priority');
    }
  };

  const handleAssignToMe = async () => {
    if (!ticket || !user) return;
    try {
      const updated = await updateTicket(ticket._id, { assignedAgentId: user.id });
      setTicket(updated);
      setSuccessNotice(`Assigned to ${user.fullName}`);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to assign ticket');
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;

    try {
      await deleteTicket(ticket._id);
      navigate('/tickets');
    } catch (err: any) {
      setError(err.message || 'Failed to delete ticket');
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticket || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const sent = await sendTicketMessage(ticket._id, newMessage.trim());
      setMessages((prev) => [...prev, sent]);
      setNewMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to post message');
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateSuggestion = async () => {
    if (!ticket) return;
    setIsGeneratingSuggestion(true);
    try {
      const suggestion = await getSuggestedReply(ticket._id);
      setNewMessage(suggestion);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI suggestion');
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>Loading ticket conversation...</span>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/40">
        <AlertCircle className="mx-auto size-8 text-rose-600" />
        <h3 className="mt-2 font-semibold text-rose-800 dark:text-rose-200">Error Loading Ticket</h3>
        <p className="mt-1 text-sm text-rose-600 dark:text-rose-300">{error}</p>
        <Link
          to="/tickets"
          className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
        >
          Back to Tickets
        </Link>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="size-4" />
          <span>Back to all tickets</span>
        </Link>

        <div className="flex items-center gap-2">
          {successNotice && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="size-3.5" />
              {successNotice}
            </span>
          )}
          {(isAdmin || ticket.customerId === user?.id) && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="size-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Ticket Header Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {ticket.category}
              </span>
              <span className="text-xs text-slate-400">ID: {ticket._id}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
              {ticket.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Status:</span>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING">Waiting</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Priority:</span>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reporter and Assignment Row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <User className="size-3.5 text-slate-400" />
              <span>Customer: <strong>{ticket.customerName || 'Sarah Customer'}</strong> ({ticket.customerEmail || 'customer@supportdesk.ai'})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-slate-400" />
              <span>Created {new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span>Assigned:</span>
            {ticket.assignedAgentName ? (
              <span className="rounded-lg bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                {ticket.assignedAgentName}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleAssignToMe}
                className="rounded-lg border border-brand-200 bg-brand-50 px-2 py-0.5 font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300"
              >
                + Assign to me
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Structured Intelligence Card */}
      {ticket.aiClassification && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-brand-50/70 p-5 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-slate-900">
          <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
            <Sparkles className="size-4 text-brand-600 dark:text-brand-400" />
            <span>AI Automated Assessment & Classification</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
            <div className="rounded-xl bg-white/70 p-3 shadow-xs dark:bg-slate-800/60">
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Detected Intent</p>
              <p className="mt-1 font-bold text-slate-800 dark:text-slate-200 capitalize">
                {ticket.aiClassification.intent.replace('_', ' ')}
              </p>
            </div>
            <div className="rounded-xl bg-white/70 p-3 shadow-xs dark:bg-slate-800/60">
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Assessed Sentiment</p>
              <p className="mt-1 font-bold text-slate-800 dark:text-slate-200 capitalize">
                {ticket.aiClassification.sentiment}
              </p>
            </div>
            <div className="rounded-xl bg-white/70 p-3 shadow-xs dark:bg-slate-800/60">
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Calculated Priority</p>
              <p className="mt-1 font-bold uppercase text-brand-600 dark:text-brand-400">
                {ticket.aiClassification.priority}
              </p>
            </div>
            <div className="rounded-xl bg-white/70 p-3 shadow-xs dark:bg-slate-800/60">
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Human Specialist</p>
              <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                {ticket.aiClassification.requiresHuman ? 'Required' : 'Automated OK'}
              </p>
            </div>
          </div>

          {ticket.aiClassification.suggestedAction && (
            <div className="mt-3 rounded-xl bg-white/60 p-3 text-xs text-indigo-900 dark:bg-slate-800/50 dark:text-indigo-200">
              <strong>Recommended Agent Action:</strong> {ticket.aiClassification.suggestedAction}
            </div>
          )}
        </div>
      )}

      {/* Conversation Thread */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Conversation Thread ({messages.length})
        </h3>

        <div className="mt-6 space-y-4">
          {messages.map((m) => {
            const isAI = m.senderType === 'AI';
            const isAgentMessage = m.senderType === 'AGENT';

            return (
              <div
                key={m._id}
                className={`flex gap-3.5 rounded-2xl p-4 transition ${
                  isAI
                    ? 'border border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20'
                    : isAgentMessage
                    ? 'border border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/40'
                    : 'border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800/70'
                }`}
              >
                <div
                  className={`grid size-9 shrink-0 place-items-center rounded-xl text-white ${
                    isAI
                      ? 'bg-gradient-to-tr from-indigo-600 to-brand-500'
                      : isAgentMessage
                      ? 'bg-brand-600'
                      : 'bg-slate-600'
                  }`}
                >
                  {isAI ? (
                    <Bot className="size-4" />
                  ) : isAgentMessage ? (
                    <Headphones className="size-4" />
                  ) : (
                    <User className="size-4" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {m.senderName}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          isAI
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : isAgentMessage
                            ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {m.senderType}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                    {m.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input Box */}
        <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Add Response
            </h4>

            {/* AI Suggested Response Button (for Agents) */}
            {isStaff && (
              <button
                type="button"
                onClick={handleGenerateSuggestion}
                disabled={isGeneratingSuggestion}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
              >
                <Sparkles className="size-3.5" />
                <span>
                  {isGeneratingSuggestion ? 'Drafting AI Response...' : '✨ Generate AI Suggested Reply'}
                </span>
              </button>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="mt-3 space-y-3">
            <textarea
              required
              rows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your response to the customer..."
              className="w-full rounded-2xl border border-slate-200 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
              >
                <span>{isSending ? 'Sending...' : 'Send Message'}</span>
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
