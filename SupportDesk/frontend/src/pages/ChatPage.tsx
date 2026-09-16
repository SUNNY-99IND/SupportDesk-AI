import { ChatBox } from '../components/ChatBox';
import { Sparkles, Cpu, CheckCircle2 } from 'lucide-react';

export function ChatPage() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Main Chat Area */}
      <div className="lg:col-span-2">
        <ChatBox />
      </div>

      {/* Side Info & FAQ Panel */}
      <div className="space-y-6">
        {/* Model Specs Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Cpu className="size-4 text-brand-600 dark:text-brand-400" />
            <span>AI Architecture Details</span>
          </div>

          <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-slate-400">Endpoint</span>
              <span className="font-mono font-semibold">POST /api/ai/chat</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-slate-400">Output Validation</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Zod Structured Schema
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-slate-400">Rate Limiting</span>
              <span className="font-semibold">30 req / min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Key Storage</span>
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                Server-side only (Isolated)
              </span>
            </div>
          </div>
        </div>

        {/* Knowledge & Capabilities */}
        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 to-white p-5 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/20 dark:to-slate-900/70">
          <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
            <Sparkles className="size-4 text-indigo-600 dark:text-indigo-400" />
            <span>AI Capabilities</span>
          </div>

          <ul className="mt-4 space-y-2.5 text-xs text-indigo-950 dark:text-indigo-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500 mt-0.5" />
              <span>Answers technical and invoicing policy inquiries instantly.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500 mt-0.5" />
              <span>Real-time sentiment and intent detection for automatic escalation.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500 mt-0.5" />
              <span>Drafts empathy-tuned suggestions for human support agents.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
