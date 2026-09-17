/**
 * Environment configuration.
 *
 * Why this file exists: reading `process.env.X` all over the codebase means a
 * typo silently becomes `undefined` and the bug shows up much later. Instead we
 * load and validate every variable once, here, and crash immediately with a
 * readable message if something is missing or malformed. The rest of the app
 * imports the typed `env` object and can trust it.
 */
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load backend/.env into process.env. Values already present in the real
// environment (e.g. set by a hosting provider) win over the file.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // z.coerce turns the string "5000" from the shell into the number 5000.
  PORT: z.coerce.number().int().positive().max(65535).default(5000),

  // Browser origin allowed to call this API (Vite dev server)
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // JWT configuration
  JWT_SECRET: z.string().default('supportdesk-ai-super-secret-jwt-key-2026'),
  JWT_EXPIRES_IN: z.string().default('1d'),

  // Database URLs (optional; memory fallback activates if offline or empty)
  POSTGRES_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  MONGO_URL: z.string().optional(),

  // LLM API configuration
  LLM_API_KEY: z.string().optional(),
  LLM_PROVIDER: z.string().default('mock'),
  LLM_MODEL: z.string().default('claude-3-5-sonnet'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('\nCopy backend/.env.example to backend/.env and fix the values above.');
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
