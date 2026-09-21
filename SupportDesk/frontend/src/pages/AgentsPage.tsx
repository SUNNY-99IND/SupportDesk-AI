import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWorkspaceAgents, inviteWorkspaceAgent } from '../services/workspace.service';
import type { WorkspaceAgent } from '../types/workspace';
import {
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  Lock,
  Headphones,
  Loader2,
} from 'lucide-react';
import { Modal } from '../components/Modal';

export function AgentsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<WorkspaceAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isOwnerOrAdmin = user?.roles.includes('OWNER') || user?.roles.includes('ADMIN');

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWorkspaceAgents();
      setAgents(data);
    } catch (err: any) {
      console.error('Failed to load agents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleInviteAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newAgent = await inviteWorkspaceAgent({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password || undefined,
      });

      setAgents((prev) => [...prev, newAgent]);
      setNotice(`Agent ${newAgent.fullName} successfully added to your workspace!`);
      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to add support agent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Support Agents & Team
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage agents responding to customer inquiries for {user?.organization || 'your workspace'}.
          </p>
        </div>

        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 transition"
          >
            <UserPlus className="size-4" />
            <span>Add Support Agent</span>
          </button>
        )}
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Role explanation */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-start gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">Role-Based Access Separation</p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Workspace Owners</strong> maintain full administrative authority, manage agents, verify websites, and control workspace settings. <strong>Support Agents</strong> receive assigned customer tickets, draft AI-assisted responses, update ticket status, and resolve issues.
            </p>
          </div>
        </div>
      </div>

      {/* Agents Table / List */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="size-4 text-brand-600 dark:text-brand-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Assigned Support Agents</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {agents.length} Active
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-xs text-slate-400 gap-2">
            <Loader2 className="size-4 animate-spin text-brand-600" />
            <span>Loading support agents...</span>
          </div>
        ) : agents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No support agents added yet. Click &quot;Add Support Agent&quot; to invite a team member.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Agent Name</th>
                  <th className="px-6 py-3.5 font-semibold">Email</th>
                  <th className="px-6 py-3.5 font-semibold">Workspace Role</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs dark:bg-indigo-950/60 dark:text-indigo-300">
                        {agent.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{agent.fullName}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono">{agent.email}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                        SUPPORT AGENT
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium dark:text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'Active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Agent Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Support Agent to Workspace">
        <form onSubmit={handleInviteAgent} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Agent Full Name
            </label>
            <div className="relative mt-1">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Agent Email
            </label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@abcshoes.com"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Initial Password (Optional)
            </label>
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank for auto-generated default password"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Default password if blank: <code className="font-mono text-slate-500 dark:text-slate-300">SupportAgent123!</code>
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding Agent...' : 'Add Support Agent'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
