export type Role = 'CUSTOMER' | 'AGENT' | 'ADMIN' | 'OWNER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  organization: string;
  organizationId?: string;
  roles: Role[];
  isActive?: boolean;
  createdAt?: string;
  websiteUrl?: string;
  verificationStatus?: 'PENDING' | 'VERIFIED';
  widgetKey?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  workspace?: {
    id: string;
    name: string;
    websiteUrl: string;
    verificationStatus: 'PENDING' | 'VERIFIED';
    verificationToken: string;
    widgetKey: string;
  };
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
  businessName?: string;
  websiteUrl?: string;
  role?: Role;
  otp?: string;
}
