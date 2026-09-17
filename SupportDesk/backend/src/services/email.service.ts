import nodemailer, { type Transporter } from 'nodemailer';

interface SendOtpOptions {
  to: string;
  otp: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD || '';
  const pass = rawPass.replace(/\s+/g, '');
  const host = (process.env.SMTP_HOST || '').trim();
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: host ? port : 465,
      secure: host ? port === 465 : true,
      auth: { user, pass },
      // Strict 4-second timeouts to prevent hanging if cloud host (e.g. Render free tier) blocks SMTP ports
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
    });
    return transporter;
  }

  return null;
}

export function isSmtpConfigured(): boolean {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD;
  const resendKey = process.env.RESEND_API_KEY;
  return Boolean((user && pass) || resendKey);
}

/**
 * Send an OTP verification email to the user.
 * Falls back to logging to console if SMTP credentials are not configured.
 */
export async function sendOtpEmail({ to, otp }: SendOtpOptions): Promise<{ sent: boolean }> {
  const mailTransporter = getTransporter();
  const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'no-reply@supportdesk.ai';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>SupportDesk AI Verification Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 540px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 32px 28px; color: #1e293b; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
        .instruction { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: monospace; }
        .expiry-note { font-size: 12px; color: #94a3b8; margin-top: 8px; }
        .footer { border-top: 1px solid #f1f5f9; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SupportDesk AI</h1>
          <p>Customer Support Platform</p>
        </div>
        <div class="content">
          <div class="greeting">Verify your email address</div>
          <p class="instruction">
            Thank you for registering with SupportDesk AI. Please use the verification code below to complete your registration.
          </p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry-note">This code will expire in 10 minutes.</div>
          </div>
          <p class="instruction">
            If you did not request this code, please ignore this email. No account will be created without this verification.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} SupportDesk AI. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Try Resend HTTP API first if configured (works over port 443 HTTPS, never blocked by cloud firewalls like Render free tier)
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendApiKey) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'SupportDesk AI <onboarding@resend.dev>',
          to: [to],
          subject: `${otp} is your SupportDesk AI verification code`,
          html: htmlContent,
        }),
      });

      if (resendRes.ok) {
        console.log(`[EMAIL SERVICE] Verification OTP successfully sent to ${to} via Resend HTTP API`);
        return { sent: true };
      } else {
        const errorText = await resendRes.text();
        console.error(`[EMAIL SERVICE] Resend API error (${resendRes.status}):`, errorText);
      }
    } catch (err: any) {
      console.error(`[EMAIL SERVICE] Failed to send email via Resend API:`, err.message);
    }
  }

  // 2. Try SMTP with strict 4s timeout
  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: `"SupportDesk AI" <${senderEmail}>`,
        to,
        subject: `${otp} is your SupportDesk AI verification code`,
        text: `Your SupportDesk AI verification code is: ${otp}. It will expire in 10 minutes.`,
        html: htmlContent,
      });
      console.log(`[EMAIL SERVICE] Verification OTP successfully sent to ${to}`);
      return { sent: true };
    } catch (err: any) {
      console.error(`[EMAIL SERVICE] Outbound SMTP failed/timed out to ${to}:`, err.message);
      console.error(`[EMAIL SERVICE] Note: Cloud providers like Render free tier block outbound SMTP ports 25, 465, and 587. Falling back gracefully.`);
    }
  }

  // Fallback for development / when SMTP credentials are not yet added or blocked
  console.log(`\n=============================================================`);
  console.log(`[EMAIL SERVICE - EVALUATION FALLBACK]`);
  console.log(`Verification OTP for: ${to}`);
  console.log(`OTP Code: >>> ${otp} <<<`);
  console.log(`Valid for 10 minutes`);
  console.log(`=============================================================\n`);

  return { sent: false };
}
