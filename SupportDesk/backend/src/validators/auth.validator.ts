import { z } from 'zod';

/**
 * Strict Email Validator
 * Enforces valid RFC email syntax, proper domain structure, and valid TLD.
 */
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const strictEmailSchema = z
  .string({ required_error: 'Email address is required' })
  .trim()
  .toLowerCase()
  .max(254, 'Email address is too long')
  .refine((val) => !val.includes(' '), {
    message: 'Email address cannot contain spaces',
  })
  .refine((val) => !val.includes('..'), {
    message: 'Email address cannot contain consecutive dots',
  })
  .refine((val) => emailRegex.test(val), {
    message: 'Please enter a valid email address (e.g. name@gmail.com)',
  })
  .refine((val) => {
    const parts = val.split('@');
    if (parts.length !== 2 || !parts[1]) return false;
    const domain = parts[1];
    const tld = domain.split('.').pop();
    return Boolean(tld && tld.length >= 2 && /^[a-z]+$/.test(tld));
  }, {
    message: 'Email domain must have a valid top-level domain (e.g. .com, .org, .edu)',
  });

export const sendOtpSchema = z.object({
  email: strictEmailSchema,
});

export const registerSchema = z.object({
  email: strictEmailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  organizationName: z.string().trim().optional(),
  role: z.enum(['CUSTOMER']).default('CUSTOMER'),
  otp: z.string().trim().optional(), // Kept optional for backwards compatibility
});

export const loginSchema = z.object({
  email: strictEmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
