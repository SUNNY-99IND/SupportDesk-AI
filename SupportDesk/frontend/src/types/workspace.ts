export interface WorkspaceDetails {
  id: string;
  name: string;
  websiteUrl: string;
  verificationStatus: 'PENDING' | 'VERIFIED';
  verificationToken: string;
  widgetKey: string;
  ownerId?: string;
  createdAt: string;
  metrics?: {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    aiHandledCount: number;
    agentsCount: number;
    averageResponseTime: string;
  };
}

export interface WorkspaceAgent {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

export interface UrlValidationResult {
  normalizedUrl: string;
  hostname: string;
  isReachable: boolean;
  statusCode?: number;
  error?: string;
}

export interface OwnershipVerificationResult {
  verified: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED';
  message?: string;
}

export interface WidgetPublicConfig {
  workspaceId: string;
  businessName: string;
  websiteUrl: string;
  verificationStatus: 'PENDING' | 'VERIFIED';
  widgetKey: string;
  greeting: string;
}
