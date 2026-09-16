import { apiRequest } from './api';
import type { User, Role } from '../types/auth';

export interface SystemStats {
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  users: {
    total: number;
    customers: number;
    agents: number;
  };
  system: {
    status: string;
    uptimeSeconds: number;
    nodeVersion: string;
    memoryUsageMb: number;
  };
}

export async function fetchAllUsers(): Promise<User[]> {
  const res = await apiRequest<User[]>('/api/admin/users');
  return res.data || [];
}

export async function updateUserRole(userId: string, role: Role): Promise<void> {
  await apiRequest<void>(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function fetchSystemStats(): Promise<SystemStats> {
  const res = await apiRequest<SystemStats>('/api/admin/stats');
  return res.data!;
}
