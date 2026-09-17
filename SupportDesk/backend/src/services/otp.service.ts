import crypto from 'crypto';

interface OtpRecord {
  otp: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
}

// In-memory store for OTP records keyed by normalized email
const otpStore = new Map<string, OtpRecord>();

const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;      // 60 seconds
const MAX_VERIFY_ATTEMPTS = 5;

/**
 * Generate a cryptographically secure 6-digit numeric OTP code.
 */
export function generateOtp(email: string): { otp: string; cooldownRemainingSeconds: number } {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = otpStore.get(normalizedEmail);
  const now = Date.now();

  // Check cooldown if an OTP was recently sent
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const cooldownRemainingSeconds = Math.ceil(
      (RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000
    );
    return { otp: existing.otp, cooldownRemainingSeconds };
  }

  // Generate a random 6-digit integer [100000, 999999]
  const otpNumber = crypto.randomInt(100000, 1000000);
  const otp = otpNumber.toString();

  otpStore.set(normalizedEmail, {
    otp,
    expiresAt: now + OTP_EXPIRATION_MS,
    lastSentAt: now,
    attempts: 0,
  });

  return { otp, cooldownRemainingSeconds: 0 };
}

/**
 * Verify that the entered OTP matches and has not expired.
 * Removes the OTP upon successful verification.
 */
export function verifyOtp(
  email: string,
  enteredOtp: string
): { success: boolean; message?: string } {
  const normalizedEmail = email.toLowerCase().trim();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return {
      success: false,
      message: 'No verification code was requested for this email. Please request a new code.',
    };
  }

  const now = Date.now();

  // Check expiry
  if (now > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      message: 'Verification code has expired. Please request a new one.',
    };
  }

  // Check attempt limit to prevent brute force
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      message: 'Too many incorrect attempts. Please request a new verification code.',
    };
  }

  record.attempts += 1;

  if (record.otp !== enteredOtp.trim()) {
    const attemptsLeft = MAX_VERIFY_ATTEMPTS - record.attempts;
    return {
      success: false,
      message: `Invalid verification code. ${attemptsLeft} attempt(s) remaining.`,
    };
  }

  // Correct OTP: delete to prevent reuse
  otpStore.delete(normalizedEmail);
  return { success: true };
}
