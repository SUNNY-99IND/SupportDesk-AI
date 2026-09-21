/**
 * PostgreSQL Database Adapter
 *
 * Implements relational data access (Organizations, Users, Roles, User_Roles)
 * using node-postgres (`pg`) and SQL queries featuring Primary Keys, Foreign
 * Keys, and multi-table SQL JOINs.
 *
 * Automatically falls back to memoryStore if PostgreSQL is not active,
 * logging diagnostic state so local dev and testing never crash.
 */
import { Pool, type QueryResult } from 'pg';
import crypto from 'node:crypto';
import { env } from '../config/env';
import { memoryStore, type DbUser, type DbOrganization } from './memoryStore';

export type { DbUser, DbOrganization };

let pool: Pool | null = null;
let isPostgresAvailable = false;

export async function initPostgres(): Promise<boolean> {
  const connectionString = (env.POSTGRES_URL || env.DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRESQL_URL || '').trim();
  if (!connectionString) {
    console.info('ℹ️  POSTGRES_URL / DATABASE_URL not provided. Using in-memory relational store.');
    return false;
  }

  try {
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 5000,
    });

    // Test connection
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      isPostgresAvailable = true;
      console.log('✅ PostgreSQL connected successfully');

      // Bootstrap tables if not yet created
      await client.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE TABLE IF NOT EXISTS organizations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          website_url TEXT UNIQUE,
          owner_id UUID,
          verification_status TEXT NOT NULL DEFAULT 'PENDING',
          verification_token TEXT,
          widget_key TEXT UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website_url TEXT UNIQUE;
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_id UUID;
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'PENDING';
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS verification_token TEXT;
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS widget_key TEXT UNIQUE;

        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS roles (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS user_roles (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
          PRIMARY KEY (user_id, role_id)
        );
        INSERT INTO roles (name) VALUES ('OWNER'), ('ADMIN'), ('AGENT'), ('CUSTOMER')
        ON CONFLICT (name) DO NOTHING;
      `);
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.warn('⚠️  PostgreSQL connection failed. Falling back to in-memory store:', (error as Error).message);
    isPostgresAvailable = false;
    return false;
  }
}

/**
 * SQL JOIN Demonstration:
 * Fetches user joined with organization and aggregated roles
 */
export async function findUserByEmail(email: string): Promise<DbUser | null> {
  if (!isPostgresAvailable || !pool) {
    const user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user || null;
  }

  const query = `
    SELECT
      u.id,
      u.organization_id,
      u.email,
      u.password_hash,
      u.full_name,
      u.is_active,
      u.created_at,
      o.name AS organization,
      COALESCE(ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
    FROM users u
    INNER JOIN organizations o ON o.id = u.organization_id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE LOWER(u.email) = LOWER($1)
    GROUP BY u.id, u.organization_id, u.email, u.password_hash, u.full_name, u.is_active, u.created_at, o.name;
  `;

  const result: QueryResult = await pool.query(query, [email]);
  if (result.rows.length === 0) return null;
  return result.rows[0] as DbUser;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  if (!isPostgresAvailable || !pool) {
    const user = memoryStore.users.find((u) => u.id === id);
    return user || null;
  }

  const query = `
    SELECT
      u.id,
      u.organization_id,
      u.email,
      u.password_hash,
      u.full_name,
      u.is_active,
      u.created_at,
      o.name AS organization,
      COALESCE(ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
    FROM users u
    INNER JOIN organizations o ON o.id = u.organization_id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE u.id = $1
    GROUP BY u.id, u.organization_id, u.email, u.password_hash, u.full_name, u.is_active, u.created_at, o.name;
  `;

  const result: QueryResult = await pool.query(query, [id]);
  if (result.rows.length === 0) return null;
  return result.rows[0] as DbUser;
}

export async function getAllUsers(): Promise<DbUser[]> {
  if (!isPostgresAvailable || !pool) {
    return memoryStore.users;
  }

  const query = `
    SELECT
      u.id,
      u.organization_id,
      u.email,
      u.password_hash,
      u.full_name,
      u.is_active,
      u.created_at,
      o.name AS organization,
      COALESCE(ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
    FROM users u
    INNER JOIN organizations o ON o.id = u.organization_id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    GROUP BY u.id, u.organization_id, u.email, u.password_hash, u.full_name, u.is_active, u.created_at, o.name
    ORDER BY u.created_at DESC;
  `;

  const result = await pool.query(query);
  return result.rows as DbUser[];
}

export async function getUsersByOrganization(orgId: string): Promise<DbUser[]> {
  if (!isPostgresAvailable || !pool) {
    return memoryStore.users.filter((u) => u.organization_id === orgId);
  }

  const query = `
    SELECT
      u.id,
      u.organization_id,
      u.email,
      u.password_hash,
      u.full_name,
      u.is_active,
      u.created_at,
      o.name AS organization,
      COALESCE(ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
    FROM users u
    INNER JOIN organizations o ON o.id = u.organization_id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE u.organization_id = $1
    GROUP BY u.id, u.organization_id, u.email, u.password_hash, u.full_name, u.is_active, u.created_at, o.name
    ORDER BY u.created_at DESC;
  `;

  const result = await pool.query(query, [orgId]);
  return result.rows as DbUser[];
}

export async function findOrganizationById(id: string): Promise<DbOrganization | null> {
  if (!isPostgresAvailable || !pool) {
    const org = memoryStore.organizations.find((o) => o.id === id);
    return org || null;
  }

  const result = await pool.query(
    'SELECT id, name, website_url, owner_id, verification_status, verification_token, widget_key, created_at FROM organizations WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0] as DbOrganization;
}

export async function findOrganizationByWebsiteUrl(normalizedUrl: string): Promise<DbOrganization | null> {
  if (!isPostgresAvailable || !pool) {
    const org = memoryStore.organizations.find(
      (o) => o.website_url && o.website_url.toLowerCase() === normalizedUrl.toLowerCase()
    );
    return org || null;
  }

  const result = await pool.query(
    'SELECT id, name, website_url, owner_id, verification_status, verification_token, widget_key, created_at FROM organizations WHERE LOWER(website_url) = LOWER($1)',
    [normalizedUrl]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0] as DbOrganization;
}

export async function findOrganizationByWidgetKey(widgetKey: string): Promise<DbOrganization | null> {
  if (!isPostgresAvailable || !pool) {
    const org = memoryStore.organizations.find((o) => o.widget_key === widgetKey);
    return org || null;
  }

  const result = await pool.query(
    'SELECT id, name, website_url, owner_id, verification_status, verification_token, widget_key, created_at FROM organizations WHERE widget_key = $1',
    [widgetKey]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0] as DbOrganization;
}

export async function updateOrganizationVerification(
  orgId: string,
  status: 'PENDING' | 'VERIFIED'
): Promise<boolean> {
  if (!isPostgresAvailable || !pool) {
    const org = memoryStore.organizations.find((o) => o.id === orgId);
    if (!org) return false;
    org.verification_status = status;
    return true;
  }

  const result = await pool.query(
    'UPDATE organizations SET verification_status = $1 WHERE id = $2',
    [status, orgId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function createWorkspaceWithOwner(data: {
  name: string;
  websiteUrl: string;
  ownerName: string;
  email: string;
  passwordHash: string;
  verificationToken: string;
  widgetKey: string;
}): Promise<{ workspace: DbOrganization; owner: DbUser }> {
  if (!isPostgresAvailable || !pool) {
    const orgId = `org-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const ownerId = `usr-owner-${Date.now()}`;

    const workspace: DbOrganization = {
      id: orgId,
      name: data.name,
      website_url: data.websiteUrl,
      owner_id: ownerId,
      verification_status: 'PENDING',
      verification_token: data.verificationToken,
      widget_key: data.widgetKey,
      created_at: new Date().toISOString(),
    };
    memoryStore.organizations.push(workspace);

    const owner: DbUser = {
      id: ownerId,
      organization_id: orgId,
      email: data.email,
      password_hash: data.passwordHash,
      full_name: data.ownerName,
      is_active: true,
      created_at: new Date().toISOString(),
      roles: ['OWNER', 'ADMIN'],
      organization: data.name,
    };
    memoryStore.users.push(owner);

    return { workspace, owner };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert Organization
    const orgResult = await client.query(
      `INSERT INTO organizations (name, website_url, verification_status, verification_token, widget_key)
       VALUES ($1, $2, 'PENDING', $3, $4)
       RETURNING id, name, website_url, owner_id, verification_status, verification_token, widget_key, created_at`,
      [data.name, data.websiteUrl, data.verificationToken, data.widgetKey]
    );
    const workspace = orgResult.rows[0] as DbOrganization;

    // 2. Insert Owner User
    const userResult = await client.query(
      `INSERT INTO users (organization_id, email, password_hash, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, organization_id, email, full_name, is_active, created_at`,
      [workspace.id, data.email, data.passwordHash, data.ownerName]
    );
    const ownerRecord = userResult.rows[0];

    // 3. Update Organization with Owner ID
    await client.query('UPDATE organizations SET owner_id = $1 WHERE id = $2', [ownerRecord.id, workspace.id]);
    workspace.owner_id = ownerRecord.id;

    // 4. Link Roles: OWNER and ADMIN
    for (const roleName of ['OWNER', 'ADMIN']) {
      const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [roleName]);
      if (roleRes.rows.length > 0) {
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [ownerRecord.id, roleRes.rows[0].id]
        );
      }
    }

    await client.query('COMMIT');

    const owner: DbUser = {
      id: ownerRecord.id,
      organization_id: workspace.id,
      email: ownerRecord.email,
      password_hash: data.passwordHash,
      full_name: ownerRecord.full_name,
      is_active: ownerRecord.is_active,
      created_at: ownerRecord.created_at,
      roles: ['OWNER', 'ADMIN'],
      organization: workspace.name,
    };

    return { workspace, owner };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  fullName: string;
  organizationId?: string;
  organizationName?: string;
  role: 'CUSTOMER' | 'AGENT' | 'ADMIN' | 'OWNER';
}): Promise<DbUser> {
  if (!isPostgresAvailable || !pool) {
    let orgId = data.organizationId;
    let orgName = data.organizationName || 'Default Workspace';

    if (!orgId) {
      let org = memoryStore.organizations.find((o) => o.name.toLowerCase() === orgName.toLowerCase());
      if (!org) {
        org = {
          id: `org-${Date.now()}`,
          name: orgName,
          verification_status: 'PENDING',
          created_at: new Date().toISOString(),
        };
        memoryStore.organizations.push(org);
      }
      orgId = org.id;
      orgName = org.name;
    } else {
      const org = memoryStore.organizations.find((o) => o.id === orgId);
      if (org) orgName = org.name;
    }

    const newUser: DbUser = {
      id: `usr-${Date.now()}`,
      organization_id: orgId,
      email: data.email,
      password_hash: data.passwordHash,
      full_name: data.fullName,
      is_active: true,
      created_at: new Date().toISOString(),
      roles: [data.role],
      organization: orgName,
    };
    memoryStore.users.push(newUser);
    return newUser;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let orgId = data.organizationId;
    let orgName = data.organizationName || 'Default Workspace';

    if (!orgId) {
      let orgResult = await client.query('SELECT id, name FROM organizations WHERE LOWER(name) = LOWER($1)', [orgName]);
      if (orgResult.rows.length === 0) {
        const newOrg = await client.query(
          'INSERT INTO organizations (name) VALUES ($1) RETURNING id, name',
          [orgName]
        );
        orgId = newOrg.rows[0].id;
      } else {
        orgId = orgResult.rows[0].id;
      }
    } else {
      const orgRes = await client.query('SELECT name FROM organizations WHERE id = $1', [orgId]);
      if (orgRes.rows.length > 0) {
        orgName = orgRes.rows[0].name;
      }
    }

    // Insert User
    const userResult = await client.query(
      `INSERT INTO users (organization_id, email, password_hash, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, organization_id, email, full_name, is_active, created_at`,
      [orgId, data.email, data.passwordHash, data.fullName]
    );
    const user = userResult.rows[0];

    // Link Role
    const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [data.role]);
    if (roleResult.rows.length > 0) {
      await client.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user.id, roleResult.rows[0].id]
      );
    }

    await client.query('COMMIT');

    return {
      id: user.id,
      organization_id: user.organization_id,
      email: user.email,
      password_hash: data.passwordHash,
      full_name: user.full_name,
      is_active: user.is_active,
      created_at: user.created_at,
      roles: [data.role],
      organization: orgName,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateUserRole(
  userId: string,
  newRole: 'CUSTOMER' | 'AGENT' | 'ADMIN' | 'OWNER'
): Promise<boolean> {
  if (!isPostgresAvailable || !pool) {
    const user = memoryStore.users.find((u) => u.id === userId);
    if (!user) return false;
    user.roles = [newRole];
    return true;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [newRole]);
    if (roleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }
    const roleId = roleResult.rows[0].id;

    await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
    await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleId]);
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
