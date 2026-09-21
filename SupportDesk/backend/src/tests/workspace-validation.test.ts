import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeWebsiteUrl,
  isPrivateOrReservedIPv4,
  isPrivateOrReservedIPv6,
} from '../utils/urlValidator';
import {
  registerBusinessWorkspace,
  verifyWorkspaceOwnership,
  getWorkspaceDetails,
} from '../services/workspace.service';
import { createTicket, getTicketById } from '../services/ticket.service';
import { findRelevantArticles, createKnowledgeDoc } from '../services/knowledge.service';
import { findOrganizationByWidgetKey } from '../db/postgres';

describe('Website URL Normalization & SSRF Safety', () => {
  it('normalizes valid URLs consistently', () => {
    const r1 = normalizeWebsiteUrl('HTTP://WWW.Example.COM/');
    assert.equal(r1.normalizedUrl, 'http://www.example.com');
    assert.equal(r1.hostname, 'www.example.com');

    const r2 = normalizeWebsiteUrl('https://abcshoes.com:443/store/');
    assert.equal(r2.normalizedUrl, 'https://abcshoes.com/store');

    const r3 = normalizeWebsiteUrl('example.com');
    assert.equal(r3.normalizedUrl, 'https://example.com');
  });

  it('rejects invalid URL formats', () => {
    assert.throws(() => normalizeWebsiteUrl('hello'), /valid website domain/i);
    assert.throws(() => normalizeWebsiteUrl('abc'), /valid website domain/i);
    assert.throws(() => normalizeWebsiteUrl('not-a-url'), /valid website domain/i);
    assert.throws(() => normalizeWebsiteUrl('ftp://example.com'), /standard web URLs/i);
    assert.throws(() => normalizeWebsiteUrl('javascript:alert(1)'), /standard web URLs/i);
  });

  it('identifies and blocks private and loopback IPv4 addresses (SSRF Protection)', () => {
    // Loopback
    assert.equal(isPrivateOrReservedIPv4('127.0.0.1'), true);
    assert.equal(isPrivateOrReservedIPv4('127.1.2.3'), true);
    // 0.0.0.0
    assert.equal(isPrivateOrReservedIPv4('0.0.0.0'), true);
    // 10.0.0.0/8
    assert.equal(isPrivateOrReservedIPv4('10.0.1.5'), true);
    // 192.168.0.0/16
    assert.equal(isPrivateOrReservedIPv4('192.168.1.1'), true);
    // 172.16.0.0/12
    assert.equal(isPrivateOrReservedIPv4('172.16.0.1'), true);
    assert.equal(isPrivateOrReservedIPv4('172.31.255.254'), true);
    // Link-local
    assert.equal(isPrivateOrReservedIPv4('169.254.1.1'), true);

    // Public IPs should be allowed
    assert.equal(isPrivateOrReservedIPv4('8.8.8.8'), false);
    assert.equal(isPrivateOrReservedIPv4('93.184.216.34'), false);
  });

  it('blocks private IPv6 addresses', () => {
    assert.equal(isPrivateOrReservedIPv6('::1'), true);
    assert.equal(isPrivateOrReservedIPv6('fe80::1'), true);
    assert.equal(isPrivateOrReservedIPv6('fc00::1'), true);
  });

  it('rejects localhost and local domains', () => {
    assert.throws(() => normalizeWebsiteUrl('http://localhost:3000'), /cannot be used/i);
    assert.throws(() => normalizeWebsiteUrl('https://mycompany.local'), /cannot be used/i);
    assert.throws(() => normalizeWebsiteUrl('http://router.internal'), /cannot be used/i);
  });
});

describe('Workspace Registration & Reachability Validation', () => {
  it('rejects unreachable websites where DNS resolution fails', async () => {
    await assert.rejects(
      async () => {
        await registerBusinessWorkspace({
          fullName: 'Fake Store Owner',
          email: 'fake@unreachable-domain-test.com',
          password: 'Password123!',
          businessName: 'Unreachable Store',
          websiteUrl: 'https://fake-unreachable-store-9876543210.org',
        });
      },
      (err: any) => {
        return (
          err.message.includes("couldn't resolve the domain") ||
          err.message.includes('could not be reached') ||
          err.statusCode === 400
        );
      }
    );
  });

  const timestamp = Date.now();
  const testBusinessEmail = `owner-${timestamp}@shoestore.com`;
  const testWebsite = `https://example.com/store-${timestamp}`;

  it('successfully creates workspace with owner account and generates tokens for valid reachable URL', async () => {
    const result = await registerBusinessWorkspace({
      fullName: 'Shoe Store Owner',
      email: testBusinessEmail,
      password: 'Password123!',
      businessName: 'Apex Shoes Inc.',
      websiteUrl: testWebsite,
    });

    assert.ok(result.token, 'Must return JWT token');
    assert.equal(result.user.email, testBusinessEmail.toLowerCase());
    assert.ok(result.user.roles.includes('OWNER'), 'User must have OWNER role');
    assert.ok(result.workspace.id, 'Must generate workspace ID');
    assert.ok(result.workspace.verificationToken.startsWith('supportdesk-verify-'));
    assert.ok(result.workspace.widgetKey.startsWith('wdg_'));
    assert.equal(result.workspace.verificationStatus, 'PENDING');
  });

  it('rejects duplicate registration of the same website', async () => {
    await assert.rejects(
      async () => {
        await registerBusinessWorkspace({
          fullName: 'Another Person',
          email: `different-${Date.now()}@other.com`,
          password: 'Password123!',
          businessName: 'Copycat Store',
          websiteUrl: testWebsite, // Same website
        });
      },
      (err: any) => {
        return err.message.includes('already connected to a SupportDesk workspace');
      }
    );
  });

  it('allows website ownership verification in sandbox mode', async () => {
    const ts = Date.now();
    const created = await registerBusinessWorkspace({
      fullName: 'Sandbox Owner',
      email: `sandbox-${ts}@test.com`,
      password: 'Password123!',
      businessName: 'Sandbox Store',
      websiteUrl: `https://example.com/sandbox-${ts}`,
    });

    const verifyRes = await verifyWorkspaceOwnership(created.workspace.id, { sandboxBypass: true });
    assert.equal(verifyRes.verified, true);
    assert.equal(verifyRes.workspace.verification_status, 'VERIFIED');

    const details = await getWorkspaceDetails(created.workspace.id);
    assert.equal(details.verificationStatus, 'VERIFIED');
    assert.ok(details.metrics);
    assert.equal(typeof details.metrics.totalTickets, 'number');
  });
});

describe('Multi-Tenant Data Isolation & RAG', () => {
  it('prevents cross-workspace ticket access', async () => {
    const ts = Date.now();
    const ws1 = await registerBusinessWorkspace({
      fullName: 'Tenant A Owner',
      email: `tenantA-${ts}@a.com`,
      password: 'Password123!',
      businessName: 'Tenant A',
      websiteUrl: `https://example.com/tenant-a-${ts}`,
    });

    const ws2 = await registerBusinessWorkspace({
      fullName: 'Tenant B Owner',
      email: `tenantB-${ts}@b.com`,
      password: 'Password123!',
      businessName: 'Tenant B',
      websiteUrl: `https://example.com/tenant-b-${ts}`,
    });

    // Create ticket in Workspace A
    const ticketA = await createTicket(
      {
        title: 'Tenant A Private Ticket',
        description: 'Sensitive billing dispute for Tenant A',
        category: 'Billing',
        priority: 'HIGH',
      },
      {
        id: ws1.user.id,
        email: ws1.user.email,
        fullName: ws1.user.fullName,
        organizationId: ws1.workspace.id,
        roles: ['OWNER'],
      }
    );

    // Tenant B trying to access Tenant A ticket must be rejected with 403
    await assert.rejects(
      async () => {
        await getTicketById(ticketA._id, {
          id: ws2.user.id,
          email: ws2.user.email,
          fullName: ws2.user.fullName,
          organizationId: ws2.workspace.id, // Workspace B
          roles: ['OWNER'],
        });
      },
      (err: any) => {
        return err.message.includes('does not belong to your workspace');
      }
    );
  });

  it('isolates knowledge base and RAG retrieval by workspace', async () => {
    const ts = Date.now();
    const wsAlpha = await registerBusinessWorkspace({
      fullName: 'Alpha Owner',
      email: `alpha-${ts}@alpha.com`,
      password: 'Password123!',
      businessName: 'Alpha Store',
      websiteUrl: `https://example.com/alpha-${ts}`,
    });

    const wsBeta = await registerBusinessWorkspace({
      fullName: 'Beta Owner',
      email: `beta-${ts}@beta.com`,
      password: 'Password123!',
      businessName: 'Beta Store',
      websiteUrl: `https://example.com/beta-${ts}`,
    });

    // Add unique policy to Alpha
    await createKnowledgeDoc(
      {
        title: 'Alpha Shoes Special 90-Day VIP Return Policy',
        category: 'Return Policy',
        content: 'Alpha Shoes allows 90 days returns with free prepaid courier collection.',
        tags: ['return', 'alpha', 'vip'],
      },
      wsAlpha.workspace.id
    );

    // Search Alpha's workspace
    const alphaResults = await findRelevantArticles(wsAlpha.workspace.id, 'What is the return policy?');
    assert.ok(alphaResults.length > 0);
    assert.ok(alphaResults[0]?.title.includes('Alpha Shoes Special'));

    // Search Beta's workspace with the same query: Alpha's policy MUST NOT appear in Beta!
    const betaResults = await findRelevantArticles(wsBeta.workspace.id, 'What is the return policy?');
    assert.equal(betaResults.length, 0, "Beta must not retrieve Alpha's knowledge articles");
  });

  it('supports public widget key lookup without exposing secrets', async () => {
    const ts = Date.now();
    const ws = await registerBusinessWorkspace({
      fullName: 'Widget Store Owner',
      email: `widget-${ts}@store.com`,
      password: 'Password123!',
      businessName: 'Widget Store Inc',
      websiteUrl: `https://example.com/widget-store-${ts}`,
    });

    const org = await findOrganizationByWidgetKey(ws.workspace.widgetKey);
    assert.ok(org);
    assert.equal(org.name, 'Widget Store Inc');
    assert.equal(org.widget_key, ws.workspace.widgetKey);
  });

  it('allows website visitors to file support tickets through the widget', async () => {
    const ts = Date.now();
    const ws = await registerBusinessWorkspace({
      fullName: 'Store Owner',
      email: `store-${ts}@store.com`,
      password: 'Password123!',
      businessName: 'Apex Sports',
      websiteUrl: `https://example.com/store-${ts}`,
    });

    const { createTicketFromWidget } = await import('../services/ticket.service');
    const ticket = await createTicketFromWidget({
      organizationId: ws.workspace.id,
      customerName: 'Sam Customer',
      customerEmail: 'sam@gmail.com',
      title: 'Order Tracking Help',
      description: 'Where is my package #9988? It was shipped 2 days ago.',
      category: 'General',
    });

    assert.ok(ticket._id, 'Ticket ID should be created');
    assert.equal(ticket.organizationId, ws.workspace.id);
    assert.equal(ticket.customerEmail, 'sam@gmail.com');
    assert.equal(ticket.status, 'OPEN');
    assert.ok(ticket.aiClassification, 'Must include AI classification');
  });
});
