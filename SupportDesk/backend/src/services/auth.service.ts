import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { findUserByEmail, findUserById, createUser, type DbUser } from '../db/postgres';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    organization: string;
    roles: ('CUSTOMER' | 'AGENT' | 'ADMIN')[];
  };
}

function generateToken(user: DbUser): string {
  const payload = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    organizationId: user.organization_id,
    organizationName: user.organization || 'Acme Technologies Inc.',
    roles: user.roles,
  };
  return jwt.sign(payload, env.JWT_SECRET as string, { expiresIn: (env.JWT_EXPIRES_IN || '1d') as any });
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    const error = new Error('A user with this email address already exists');
    (error as any).status = 409;
    throw error;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(input.password, saltRounds);

  const newUser = await createUser({
    email: input.email,
    passwordHash,
    fullName: input.fullName,
    organizationName: input.organizationName || 'Default Workspace',
    role: 'CUSTOMER', // Strict security: public registrations are always CUSTOMER
  });

  const token = generateToken(newUser);

  return {
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.full_name,
      organization: newUser.organization || 'Default Workspace',
      roles: newUser.roles,
    },
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);
  if (!user) {
    const error = new Error('Invalid email or password');
    (error as any).status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(input.password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    (error as any).status = 401;
    throw error;
  }

  if (!user.is_active) {
    const error = new Error('Your account has been deactivated. Please contact an administrator.');
    (error as any).status = 403;
    throw error;
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      organization: user.organization || 'Acme Technologies Inc.',
      roles: user.roles,
    },
  };
}

export async function getProfile(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    const error = new Error('User not found');
    (error as any).status = 404;
    throw error;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    organization: user.organization || 'Acme Technologies Inc.',
    organizationId: user.organization_id,
    roles: user.roles,
    createdAt: user.created_at,
  };
}
