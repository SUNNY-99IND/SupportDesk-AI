import { z } from 'zod';

export const sendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  organizationName: z.string().optional(),
  role: z.enum(['CUSTOMER']).default('CUSTOMER'),
  otp: z.string().trim().length(6, 'Verification code must be 6 digits'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
