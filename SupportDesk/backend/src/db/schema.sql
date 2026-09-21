-- SupportDesk AI — PostgreSQL Relational Schema
-- Demonstrates Primary Keys, Foreign Keys, Cascades, and Many-to-Many Join Tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Workspaces)
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

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 4. User Roles (Many-to-Many Relationship Join Table)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  PRIMARY KEY (user_id, role_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_website ON organizations(website_url);
CREATE INDEX IF NOT EXISTS idx_org_widget ON organizations(widget_key);

-- Initial Roles Seed
INSERT INTO roles (name) VALUES ('OWNER'), ('ADMIN'), ('AGENT'), ('CUSTOMER')
ON CONFLICT (name) DO NOTHING;
