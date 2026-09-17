export type Role = 'CUSTOMER' | 'AGENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  organization: string;
  roles: Role[];
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  organizationName?: string;
  role: Role;
  otp: string;
}
