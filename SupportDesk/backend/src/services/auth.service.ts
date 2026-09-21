import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { findUserByEmail, findUserById, createUser, type DbUser } from '../db/postgres';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';
import { AppError } from '../utils/AppError';
import { generateOtp } from './otp.service';
import { sendOtpEmail } from './email.service';
import { registerBusinessWorkspace } from './workspace.service';

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    organization: string;
    organizationId: string;
    roles: ('CUSTOMER' | 'AGENT' | 'ADMIN' | 'OWNER')[];
  };
}

function generateToken(user: DbUser): string {
  const payload = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    organizationId: user.organization_id,
    organizationName: user.organization || 'SupportDesk Workspace',
    roles: user.roles,
  };
  return jwt.sign(payload, env.JWT_SECRET as string, { expiresIn: (env.JWT_EXPIRES_IN || '1d') as any });
}

export async function requestRegistrationOtp(email: string): Promise<{ otpSentViaSmtp: boolean; devOtp?: string }> {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw AppError.conflict('A user with this email address already exists');
  }

  const { otp, cooldownRemainingSeconds } = generateOtp(email);
  if (cooldownRemainingSeconds > 0) {
    throw new AppError(`Please wait ${cooldownRemainingSeconds} seconds before requesting a new code.`, 429);
  }

  const { sent } = await sendOtpEmail({ to: email, otp });
  return {
    otpSentViaSmtp: sent,
    devOtp: sent ? undefined : otp,
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  // If websiteUrl is provided, run the full business onboarding flow
  if (input.websiteUrl) {
    const businessResult = await registerBusinessWorkspace({
      fullName: input.fullName,
      email: input.email,
      password: input.password,
      businessName: input.organizationName || 'My Business Workspace',
      websiteUrl: input.websiteUrl,
    });

    return {
      token: businessResult.token,
      user: businessResult.user,
    };
  }

  // 1. Check for duplicate registration
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw AppError.conflict('A user with this email address already exists');
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(input.password, saltRounds);

  const newUser = await createUser({
    email: input.email,
    passwordHash,
    fullName: input.fullName,
    organizationName: input.organizationName || 'Default Workspace',
    role: input.role || 'CUSTOMER',
  });

  const token = generateToken(newUser);

  return {
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.full_name,
      organization: newUser.organization || 'Default Workspace',
      organizationId: newUser.organization_id,
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
      organization: user.organization || 'SupportDesk Workspace',
      organizationId: user.organization_id,
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
    organization: user.organization || 'SupportDesk Workspace',
    organizationId: user.organization_id,
    roles: user.roles,
    createdAt: user.created_at,
  };
}
