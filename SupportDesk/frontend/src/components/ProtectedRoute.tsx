import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/auth';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = user.roles.some((r) => allowedRoles.includes(r));
    if (!hasPermission) {
      return (
        <div className="mx-auto max-w-lg rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/40">
          <h2 className="text-lg font-semibold text-rose-800 dark:text-rose-200">
            Access Restricted
          </h2>
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">
            Your current role ({user.roles.join(', ')}) does not have permission to view this page.
          </p>
          <a
            href="/dashboard"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Return to Dashboard
          </a>
        </div>
      );
    }
  }

  return <>{children}</>;
}
