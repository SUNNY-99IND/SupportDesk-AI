import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Bot, Sun, Moon, LogOut, User as UserIcon, Shield, Headphones } from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20">
            <Bot className="size-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              SupportDesk<span className="text-brand-600 dark:text-brand-400">.AI</span>
            </span>
            <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
              Intelligent Support Platform
            </p>
          </div>
        </Link>

        {/* Center: Authenticated User Role Badge (Read-Only) */}
        {isAuthenticated && user && (
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-1.5 md:flex dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500">Workspace:</span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {user.organization || 'SupportDesk'}
            </span>
            <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[11px] font-bold uppercase text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {user.roles?.[0] || 'CUSTOMER'}
            </span>
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800"
              >
                <div className="grid size-7 place-items-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  {user?.roles.includes('ADMIN') ? (
                    <Shield className="size-4" />
                  ) : user?.roles.includes('AGENT') ? (
                    <Headphones className="size-4" />
                  ) : (
                    <UserIcon className="size-4" />
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {user?.fullName}
                  </p>
                  <p className="text-[10px] font-medium text-brand-600 dark:text-brand-400">
                    {user?.roles[0]}
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={logout}
                aria-label="Logout"
                title="Logout"
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl px-3.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
