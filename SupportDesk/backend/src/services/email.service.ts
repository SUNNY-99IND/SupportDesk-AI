import nodemailer, { type Transporter } from 'nodemailer';

interface SendOtpOptions {
  to: string;
  otp: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;

  if (user && pass) {
    if (host) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      // Default to Gmail service if host not explicitly provided
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }
    return transporter;
  }

  return null;
}

export function isSmtpConfigured(): boolean {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD;
  return Boolean(user && pass);
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
      console.error(`[EMAIL SERVICE] Failed to send email via SMTP to ${to}:`, err.message);
      // Fall through to console log so user flow is not broken if credentials are misconfigured
    }
  }

  // Fallback for development / when SMTP credentials are not yet added
  console.log(`\n=============================================================`);
  console.log(`[EMAIL SERVICE - DEV FALLBACK]`);
  console.log(`Verification OTP for: ${to}`);
  console.log(`OTP Code: >>> ${otp} <<<`);
  console.log(`Valid for 10 minutes`);
  console.log(`To send real emails, set SMTP_USER and SMTP_PASS in .env or Render`);
  console.log(`=============================================================\n`);

  return { sent: false };
}
