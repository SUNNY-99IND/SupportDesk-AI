import { useAuth } from '../context/AuthContext';
import { User, Building2, Key } from 'lucide-react';
import type { Role } from '../types/auth';

export function ProfilePage() {
  const { user, switchDemoUser } = useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          User Profile & Credentials
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Identity, organization membership, and role-based permissions
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
          <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md">
            <User className="size-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user?.fullName}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="mt-2 flex items-center gap-1.5">
              {user?.roles.map((r) => (
                <span
                  key={r}
                  className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <Building2 className="size-4 text-brand-600" />
              <span>Organization (PostgreSQL)</span>
            </div>
            <p className="mt-2 font-medium text-slate-900 dark:text-white">
              {user?.organization || 'Acme Technologies Inc.'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Enforced by Foreign Key CASCADE</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <Key className="size-4 text-brand-600" />
              <span>Authentication (JWT)</span>
            </div>
            <p className="mt-2 font-medium text-emerald-600 dark:text-emerald-400">
              Active Session (HMAC-SHA256)
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Validated via Express Bearer middleware</p>
          </div>
        </div>

        {/* Demo persona testing switch */}
        <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-900/40 dark:bg-brand-950/20">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            Testing Persona Switcher
          </h4>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Instantly switch between roles to test RBAC rules and views:
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {(['CUSTOMER', 'AGENT', 'ADMIN'] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => switchDemoUser(r)}
                className={`rounded-xl border p-2 text-xs font-medium transition ${
                  user?.roles.includes(r)
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {r === 'CUSTOMER' ? '👤 Customer' : r === 'AGENT' ? '🎧 Agent' : '🛡️ Admin'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
