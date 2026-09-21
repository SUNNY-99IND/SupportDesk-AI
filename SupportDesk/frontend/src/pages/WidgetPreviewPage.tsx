import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchMyWorkspace, sendWidgetChatMessage, submitWidgetTicket } from '../services/workspace.service';
import type { WorkspaceDetails } from '../types/workspace';
import {
  Bot,
  Send,
  Ticket,
  ArrowLeft,
  CheckCircle2,
  Globe,
  User,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface WidgetMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  relevantArticles?: { title: string; category: string }[];
  requiresHuman?: boolean;
}

export function WidgetPreviewPage() {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceDetails | null>(null);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'ticket'>('chat');

  // Ticket Form in Widget
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const ws = await fetchMyWorkspace();
        setWorkspace(ws);
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `Hi! Welcome to ${ws.name || 'our store'}. How can we help you today? Ask about our shipping, return policies, or speak with an agent.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } catch (err) {
        console.error('Failed to load workspace:', err);
      }
    }
    load();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text || !workspace?.widgetKey || isLoading) return;

    const userMsg: WidgetMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendWidgetChatMessage({
        widgetKey: workspace.widgetKey,
        message: text,
        history,
      });

      const aiMsg: WidgetMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relevantArticles: res.relevantArticles,
        requiresHuman: res.classification?.requiresHuman,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I am having trouble connecting to customer support right now. Please try again or create a ticket.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace?.widgetKey || !customerEmail || !ticketDescription) return;

    setIsSubmittingTicket(true);
    setTicketSuccess(null);

    try {
      const res = await submitWidgetTicket({
        widgetKey: workspace.widgetKey,
        customerName: customerName.trim() || 'Website Visitor',
        customerEmail: customerEmail.trim().toLowerCase(),
        title: ticketSubject.trim() || 'Customer support inquiry from website',
        message: ticketDescription.trim(),
      });

      setTicketSuccess(res.message || 'Ticket submitted successfully! An agent will respond via email.');
      setTicketSubject('');
      setTicketDescription('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit ticket');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              <ArrowLeft className="size-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            SupportDesk Widget Simulator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive preview of how the support widget appears and behaves on {workspace?.websiteUrl || 'your website'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Globe className="size-3 text-brand-600 dark:text-brand-400" />
            <span>Workspace: {workspace?.name || user?.organization}</span>
          </span>
        </div>
      </div>

      {/* Simulator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Mock Connected Website Browser View */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {/* Mock Browser Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-rose-400" />
              <span className="size-3 rounded-full bg-amber-400" />
              <span className="size-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 rounded-xl bg-white px-3 py-1 text-center font-mono text-xs text-slate-600 shadow-2xs dark:bg-slate-900 dark:text-slate-400 truncate">
              {workspace?.websiteUrl || 'https://your-store-website.com'}
            </div>
          </div>

          {/* Mock Store Frontpage Content */}
          <div className="p-8 space-y-6 min-h-[460px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {workspace?.name || 'Your Connected Store'}
                </span>
                <span className="text-xs text-slate-400 font-medium">Customer View Simulation</span>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-slate-100 to-slate-50 p-6 dark:from-slate-800/60 dark:to-slate-900">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Spring Collection & Modern Footwear
                </h2>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
                  Browse our catalog of premium products with fast domestic shipping and our 30-day money-back satisfaction guarantee.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                    Shop Now
                  </span>
                  <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">
                    Learn More
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl border border-slate-100 p-3 text-center dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Express Delivery</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">3-5 Business Days</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3 text-center dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">30-Day Returns</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Hassle-free guarantee</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3 text-center dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">SupportDesk AI</p>
                  <p className="text-[10px] text-emerald-500 mt-0.5 font-medium">Active Widget</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
              The SupportDesk widget on the right demonstrates live integration with your workspace's knowledge base and ticketing pipeline.
            </div>
          </div>
        </div>

        {/* Right: Embedded Widget Frame */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col h-[580px]">
          {/* Widget Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-brand-600 to-indigo-600 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white">
                <Bot className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">{workspace?.name || 'SupportDesk AI'}</h3>
                <span className="flex items-center gap-1 text-[11px] text-brand-100">
                  <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span>AI Support Online</span>
                </span>
              </div>
            </div>

            {/* Tab switch */}
            <div className="flex rounded-xl bg-black/20 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  activeTab === 'chat' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ticket')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  activeTab === 'ticket' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Ticket
              </button>
            </div>
          </div>

          {/* Widget Body */}
          {activeTab === 'chat' ? (
            <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
              {/* Message scroll area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div key={m.id} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                      <div
                        className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs ${
                          isUser
                            ? 'bg-brand-600 text-white'
                            : 'bg-indigo-600 text-white shadow-2xs'
                        }`}
                      >
                        {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                      </div>

                      <div className={`max-w-[82%] space-y-1 ${isUser ? 'items-end text-right' : ''}`}>
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            isUser
                              ? 'bg-brand-600 text-white rounded-tr-none'
                              : 'bg-white text-slate-800 shadow-xs border border-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-line">{m.content}</p>

                          {m.relevantArticles && m.relevantArticles.length > 0 && (
                            <div className="mt-2 border-t border-slate-100 pt-1.5 dark:border-slate-800 text-[10px] text-slate-400">
                              <span>Source: {m.relevantArticles.map((a) => a.title).join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {m.requiresHuman && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('ticket')}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                          >
                            <Ticket className="size-3" />
                            <span>Escalate to Human Specialist</span>
                          </button>
                        )}
                        <span className="text-[10px] text-slate-400 block">{m.time}</span>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="size-3.5 animate-spin text-brand-600" />
                    <span>SupportDesk AI is replying...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <div className="border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="flex size-8 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition"
                  >
                    <Send className="size-3.5" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Ticket Creation Sub-Form */
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 dark:bg-slate-950/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Human Support</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Leave your inquiry and our team will get back to you via email.
              </p>

              {ticketSuccess && (
                <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{ticketSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateTicket} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Jane Customer"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Subject / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Order #1049 refund inquiry"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    How can we help?
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition"
                >
                  {isSubmittingTicket ? 'Submitting ticket...' : 'Submit Support Request'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
