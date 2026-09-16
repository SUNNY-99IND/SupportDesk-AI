import { useState, useEffect } from 'react';
import { fetchAllUsers, updateUserRole, fetchSystemStats, type SystemStats } from '../services/admin.service';
import type { User, Role } from '../types/auth';
import { Server, Users, Activity, Check, AlertCircle } from 'lucide-react';

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [userData, statsData] = await Promise.all([
        fetchAllUsers(),
        fetchSystemStats(),
      ]);
      setUsers(userData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await updateUserRole(userId, newRole);
      setNotice(`Role successfully updated to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, roles: [newRole] } : u))
      );
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>Loading admin panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Administration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage workspace users, roles, and review server telemetry
        </p>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Check className="size-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* System Telemetry Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                System Status
              </span>
              <Activity className="size-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.system.status}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Uptime: {Math.floor(stats.system.uptimeSeconds / 60)} mins · Node {stats.system.nodeVersion}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Registered Users
              </span>
              <Users className="size-4 text-brand-600" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
              {stats.users.total} Total
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {stats.users.customers} Customers · {stats.users.agents} Agents
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Process Memory
              </span>
              <Server className="size-4 text-indigo-600" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
              {stats.system.memoryUsageMb} MB
            </p>
            <p className="mt-1 text-xs text-slate-400">Heap Used in V8</p>
          </div>
        </div>
      )}

      {/* Users Management Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="border-b border-slate-100 p-5 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">User & Role Management</h3>
          <p className="text-xs text-slate-500">
            Update roles in the PostgreSQL `user_roles` relation in real time
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Organization</th>
                <th className="px-4 py-3.5">Assigned Role</th>
                <th className="px-4 py-3.5 text-right">Modify Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                    {u.fullName}
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{u.email}</td>
                  <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                    {u.organization}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {u.roles[0]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <select
                      value={u.roles[0]}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="AGENT">AGENT</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
