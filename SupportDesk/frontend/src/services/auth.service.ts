import { apiRequest } from './api';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth';

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data!;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data!;
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await apiRequest<User>('/api/auth/me', {
    method: 'GET',
  });
  return res.data!;
}
