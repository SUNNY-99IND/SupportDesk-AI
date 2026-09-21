/**
 * In-Memory Database Store & Seed Data
 *
 * Provides instant, zero-friction execution when local PostgreSQL/MongoDB
 * daemons are not running or during rapid testing. Implements the same
 * schema relationships (Organizations -> Users -> Roles, Tickets, Messages, KnowledgeBase)
 * with sample accounts ready to test:
 *   - customer@supportdesk.ai / Password123! (Role: CUSTOMER)
 *   - agent@supportdesk.ai / Password123! (Role: AGENT)
 *   - admin@supportdesk.ai / Password123! (Role: ADMIN / OWNER)
 */
import bcrypt from 'bcryptjs';

export interface DbOrganization {
  id: string;
  name: string;
  website_url?: string;
  owner_id?: string;
  verification_status: 'PENDING' | 'VERIFIED';
  verification_token?: string;
  widget_key?: string;
  created_at: string;
}

export interface DbUser {
  id: string;
  organization_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  roles: ('CUSTOMER' | 'AGENT' | 'ADMIN' | 'OWNER')[];
  organization?: string;
}

export interface DbTicket {
  _id: string;
  organizationId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
  aiClassification?: {
    intent: string;
    priority: string;
    sentiment: string;
    requiresHuman: boolean;
    suggestedAction?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DbMessage {
  _id: string;
  ticketId: string;
  senderId?: string | null;
  senderName: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'AI';
  body: string;
  createdAt: string;
}

export interface DbKnowledgeDoc {
  _id: string;
  organizationId: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

class MemoryStore {
  organizations: DbOrganization[] = [];
  users: DbUser[] = [];
  tickets: DbTicket[] = [];
  messages: DbMessage[] = [];
  knowledgeDocs: DbKnowledgeDoc[] = [];
  private seeded = false;

  async initSeeds(): Promise<void> {
    if (this.seeded) return;
    this.seeded = true;

    const orgId = 'org-1111-2222-3333-4444';
    const adminUserId = 'usr-admin-3333';

    this.organizations.push({
      id: orgId,
      name: 'Acme Technologies Inc.',
      website_url: 'https://acme-tech.com',
      owner_id: adminUserId,
      verification_status: 'VERIFIED',
      verification_token: 'supportdesk-verify-demo-acme-token',
      widget_key: 'wdg_acme_demo_1111',
      created_at: new Date().toISOString(),
    });

    const passwordHash = await bcrypt.hash('Password123!', 10);

    const customerUser: DbUser = {
      id: 'usr-customer-1111',
      organization_id: orgId,
      email: 'customer@supportdesk.ai',
      password_hash: passwordHash,
      full_name: 'Sarah Customer',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      roles: ['CUSTOMER'],
      organization: 'Acme Technologies Inc.',
    };

    const agentUser: DbUser = {
      id: 'usr-agent-2222',
      organization_id: orgId,
      email: 'agent@supportdesk.ai',
      password_hash: passwordHash,
      full_name: 'Alex Agent',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      roles: ['AGENT'],
      organization: 'Acme Technologies Inc.',
    };

    const adminUser: DbUser = {
      id: adminUserId,
      organization_id: orgId,
      email: 'admin@supportdesk.ai',
      password_hash: passwordHash,
      full_name: 'David Administrator',
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      roles: ['OWNER', 'ADMIN'],
      organization: 'Acme Technologies Inc.',
    };

    this.users.push(customerUser, agentUser, adminUser);

    // Initial Tickets
    const ticket1Id = 'tkt-0001';
    const ticket1: DbTicket = {
      _id: ticket1Id,
      organizationId: orgId,
      customerId: customerUser.id,
      customerName: customerUser.full_name,
      customerEmail: customerUser.email,
      assignedAgentId: agentUser.id,
      assignedAgentName: agentUser.full_name,
      title: 'Unable to process international invoice refund',
      description: 'We were charged twice for our annual SaaS subscription last Tuesday. Need urgent refund to our bank account.',
      category: 'Billing',
      priority: 'HIGH',
      status: 'OPEN',
      aiClassification: {
        intent: 'refund',
        priority: 'high',
        sentiment: 'frustrated',
        requiresHuman: true,
        suggestedAction: 'Verify billing transaction and issue credit memo',
      },
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    };

    const ticket2Id = 'tkt-0002';
    const ticket2: DbTicket = {
      _id: ticket2Id,
      organizationId: orgId,
      customerId: customerUser.id,
      customerName: customerUser.full_name,
      customerEmail: customerUser.email,
      assignedAgentId: null,
      assignedAgentName: null,
      title: 'API Rate limit exceeded on reporting webhook',
      description: 'Our backend ETL script is receiving 429 Too Many Requests when syncing daily ticket telemetry at midnight.',
      category: 'Technical',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      aiClassification: {
        intent: 'technical_issue',
        priority: 'medium',
        sentiment: 'neutral',
        requiresHuman: true,
        suggestedAction: 'Check plan tier limits and provide webhook backoff guidelines',
      },
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    };

    const ticket3Id = 'tkt-0003';
    const ticket3: DbTicket = {
      _id: ticket3Id,
      organizationId: orgId,
      customerId: customerUser.id,
      customerName: customerUser.full_name,
      customerEmail: customerUser.email,
      assignedAgentId: agentUser.id,
      assignedAgentName: agentUser.full_name,
      title: 'How to configure SSO with Okta / SAML 2.0?',
      description: 'Where can I find the ACS URL and entity ID for configuring enterprise single sign-on?',
      category: 'Account',
      priority: 'LOW',
      status: 'RESOLVED',
      aiClassification: {
        intent: 'general_inquiry',
        priority: 'low',
        sentiment: 'positive',
        requiresHuman: false,
        suggestedAction: 'Share Okta integration documentation guide',
      },
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    };

    this.tickets.push(ticket1, ticket2, ticket3);

    // Initial Messages for Ticket 1
    this.messages.push(
      {
        _id: 'msg-0001',
        ticketId: ticket1Id,
        senderId: customerUser.id,
        senderName: customerUser.full_name,
        senderType: 'CUSTOMER',
        body: 'We were charged twice for our annual SaaS subscription last Tuesday. Need urgent refund to our bank account.',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        _id: 'msg-0002',
        ticketId: ticket1Id,
        senderId: null,
        senderName: 'SupportDesk AI',
        senderType: 'AI',
        body: 'Hello Sarah! I noticed this is a high-priority refund request regarding duplicate billing. I have notified our senior billing team and assigned Agent Alex to review your transaction ledger.',
        createdAt: new Date(Date.now() - 3600000 * 3.8).toISOString(),
      },
      {
        _id: 'msg-0003',
        ticketId: ticket1Id,
        senderId: agentUser.id,
        senderName: agentUser.full_name,
        senderType: 'AGENT',
        body: 'Hi Sarah, I am reviewing invoice #INV-9821 right now. I will confirm the reversal with our payment gateway within the hour.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    );

    // Initial Knowledge Base Documents for Workspace
    this.knowledgeDocs.push(
      {
        _id: 'kb-0001',
        organizationId: orgId,
        title: 'Return and Refund Policy',
        category: 'Refund Policy',
        content: 'Customers are eligible for a 100% full refund within 30 days of initial purchase or invoice issuance. Duplicate billing errors are reversed immediately upon verification. To initiate a refund, contact billing support with your transaction reference number.',
        tags: ['refund', 'billing', 'charge', 'return', 'money'],
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        _id: 'kb-0002',
        organizationId: orgId,
        title: 'Standard Shipping and Delivery Windows',
        category: 'Shipping Policy',
        content: 'Standard domestic delivery arrives within 3-5 business days. Express next-day shipping is available for orders confirmed before 2:00 PM EST. Real-time courier tracking numbers are dispatched via email immediately after package dispatch.',
        tags: ['shipping', 'delivery', 'carrier', 'tracking', 'order'],
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        _id: 'kb-0003',
        organizationId: orgId,
        title: 'SAML 2.0 SSO and Okta Configuration Guide',
        category: 'Account',
        content: 'Enterprise workspaces can enable Single Sign-On via SAML 2.0 with Okta, Azure AD, or Google Workspace. The ACS URL is https://auth.supportdesk.ai/saml/callback and the Entity ID is urn:supportdesk:sp. Identity provider metadata can be uploaded under Settings > Security.',
        tags: ['sso', 'okta', 'saml', 'login', 'authentication'],
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        _id: 'kb-0004',
        organizationId: orgId,
        title: 'API Rate Limits and Webhook Best Practices',
        category: 'Technical',
        content: 'Standard API limits are set to 60 requests per minute per token. When handling high volume, implement exponential backoff upon receiving HTTP 429. Webhooks retry with exponential backoff up to 5 attempts over 24 hours.',
        tags: ['api', 'rate limit', '429', 'developer', 'webhook'],
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      }
    );
  }
}

export const memoryStore = new MemoryStore();
// Initialize seeds immediately
memoryStore.initSeeds();
