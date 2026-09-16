import { useState, useRef, useEffect } from 'react';
import { askAI } from '../services/ai.service';
import type { AIChatMessage } from '../types/ai';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';

interface ChatBoxProps {
  initialPrompt?: string;
}

export function ChatBox({ initialPrompt }: ChatBoxProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I am SupportDesk AI, your intelligent support copilot. Ask me about policies, billing, account setup, or technical issues, and I'll assist or route you to a specialist!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'How do I request a refund for an annual invoice?',
    'What are the rate limits for the reporting API?',
    'Where can I configure SAML 2.0 Single Sign-On?',
    'What are your human support agent hours?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: AIChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const history = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const res = await askAI(text.trim(), history);

      const aiMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.message,
        classification: res.classification,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to get response from AI assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[600px] flex-col rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-sm">
            <Bot className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">SupportDesk AI Copilot</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live AI-assisted support & classification
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          AI Online
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`grid size-8 shrink-0 place-items-center rounded-xl ${
                  isUser
                    ? 'bg-brand-600 text-white'
                    : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                }`}
              >
                {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
              </div>

              <div className={`max-w-[80%] space-y-1.5`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-brand-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* AI Structured Insight Pill */}
                  {!isUser && m.classification && (
                    <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
                          <Sparkles className="size-3" />
                          Intent: {m.classification.intent.replace('_', ' ')}
                        </span>
                        <span>·</span>
                        <span>Priority: <strong className="uppercase">{m.classification.priority}</strong></span>
                        <span>·</span>
                        <span>Sentiment: <strong className="capitalize">{m.classification.sentiment}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                <p className={`text-[10px] text-slate-400 ${isUser ? 'text-right' : 'text-left'}`}>
                  {m.timestamp}
                </p>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Bot className="size-4" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-800/80">
              <span className="size-2 animate-bounce rounded-full bg-brand-600 [animation-delay:-0.3s]" />
              <span className="size-2 animate-bounce rounded-full bg-brand-600 [animation-delay:-0.15s]" />
              <span className="size-2 animate-bounce rounded-full bg-brand-600" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-2 dark:border-slate-800 dark:bg-slate-800/30">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <span className="shrink-0 text-[11px] font-medium text-slate-400">Suggestions:</span>
          {quickPrompts.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 border-t border-slate-100 p-4 dark:border-slate-800"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or describe an issue..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
        >
          <span>Send</span>
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
