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
import { env } from '../config/env';
import { memoryStore, type DbUser, type DbOrganization } from './memoryStore';

export type { DbUser, DbOrganization };

let pool: Pool | null = null;
let isPostgresAvailable = false;

export async function initPostgres(): Promise<boolean> {
  const connectionString = env.POSTGRES_URL;
  if (!connectionString) {
    console.info('ℹ️  POSTGRES_URL not provided. Using in-memory relational store.');
    return false;
  }

  try {
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 3000,
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
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
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
        INSERT INTO roles (name) VALUES ('CUSTOMER'), ('AGENT'), ('ADMIN')
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

export async function createUser(data: {
  email: string;
  passwordHash: string;
  fullName: string;
  organizationName?: string;
  role: 'CUSTOMER' | 'AGENT' | 'ADMIN';
}): Promise<DbUser> {
  if (!isPostgresAvailable || !pool) {
    const orgId = `org-${Date.now()}`;
    const orgName = data.organizationName || 'Default Workspace';
    let org = memoryStore.organizations.find((o) => o.name.toLowerCase() === orgName.toLowerCase());
    if (!org) {
      org = { id: orgId, name: orgName, created_at: new Date().toISOString() };
      memoryStore.organizations.push(org);
    }

    const newUser: DbUser = {
      id: `usr-${Date.now()}`,
      organization_id: org.id,
      email: data.email,
      password_hash: data.passwordHash,
      full_name: data.fullName,
      is_active: true,
      created_at: new Date().toISOString(),
      roles: [data.role],
      organization: org.name,
    };
    memoryStore.users.push(newUser);
    return newUser;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Find or create Organization
    const orgName = data.organizationName || 'Default Workspace';
    let orgResult = await client.query('SELECT id, name FROM organizations WHERE LOWER(name) = LOWER($1)', [orgName]);
    let orgId: string;
    if (orgResult.rows.length === 0) {
      const newOrg = await client.query(
        'INSERT INTO organizations (name) VALUES ($1) RETURNING id, name',
        [orgName]
      );
      orgId = newOrg.rows[0].id;
    } else {
      orgId = orgResult.rows[0].id;
    }

    // 2. Insert User
    const userResult = await client.query(
      `INSERT INTO users (organization_id, email, password_hash, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, organization_id, email, full_name, is_active, created_at`,
      [orgId, data.email, data.passwordHash, data.fullName]
    );
    const user = userResult.rows[0];

    // 3. Link Role
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

export async function updateUserRole(userId: string, newRole: 'CUSTOMER' | 'AGENT' | 'ADMIN'): Promise<boolean> {
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
