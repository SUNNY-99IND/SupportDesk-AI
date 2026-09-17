import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

interface AppShellProps {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {isAuthenticated ? (
          <div className="flex flex-col gap-8 md:flex-row">
            <Sidebar />
            <main className="min-w-0 flex-1">{children ?? <Outlet />}</main>
          </div>
        ) : (
          <main className="min-w-0 flex-1">{children ?? <Outlet />}</main>
        )}
      </div>

      <footer className="border-t border-slate-200/80 bg-white/50 py-6 text-center text-xs text-slate-500 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 SupportDesk AI. Full-Stack AI-Assisted Customer Support.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>PostgreSQL & MongoDB Dual-Store</span>
            <span>·</span>
            <span>REST API</span>
            <span>·</span>
            <span>AI Structured Output</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
