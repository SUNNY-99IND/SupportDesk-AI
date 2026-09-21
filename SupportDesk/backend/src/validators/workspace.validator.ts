import { z } from 'zod';
import { strictEmailSchema } from './auth.validator';

export const validateUrlSchema = z.object({
  url: z.string({ required_error: 'Website URL is required' }).trim().min(3, 'Please enter a valid website URL'),
});

export const businessRegisterSchema = z.object({
  fullName: z.string({ required_error: 'Owner name is required' }).trim().min(2, 'Owner name must be at least 2 characters'),
  email: strictEmailSchema,
  password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  businessName: z.string({ required_error: 'Business name is required' }).trim().min(2, 'Business name must be at least 2 characters'),
  websiteUrl: z.string({ required_error: 'Website URL is required' }).trim().min(3, 'Please enter a valid website URL'),
});

export const verifyOwnershipSchema = z.object({
  sandboxBypass: z.boolean().optional(),
});

export const inviteAgentSchema = z.object({
  fullName: z.string().trim().min(2, 'Agent name must be at least 2 characters'),
  email: strictEmailSchema,
  password: z.string().min(6).optional(),
});

export type ValidateUrlInput = z.infer<typeof validateUrlSchema>;
export type BusinessRegisterInput = z.infer<typeof businessRegisterSchema>;
export type VerifyOwnershipInput = z.infer<typeof verifyOwnershipSchema>;
export type InviteAgentInput = z.infer<typeof inviteAgentSchema>;
