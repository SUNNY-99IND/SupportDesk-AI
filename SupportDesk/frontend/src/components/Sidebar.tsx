import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Ticket, MessageSquare, Users, User, ShieldCheck } from 'lucide-react';

export function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('ADMIN');

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tickets', label: 'Tickets', icon: Ticket },
    { to: '/chat', label: 'AI Assistant', icon: MessageSquare },
    ...(isAdmin ? [{ to: '/admin', label: 'User Admin', icon: Users }] : []),
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-full shrink-0 md:w-60">
      <div className="sticky top-20 rounded-2xl border border-slate-200/80 bg-white/70 p-3 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
                  }`
                }
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Workspace info card */}
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>Workspace</span>
          </div>
          <p className="mt-1 truncate text-slate-500 dark:text-slate-400">
            {user?.organization || 'Acme Technologies Inc.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
