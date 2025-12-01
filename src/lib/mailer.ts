// src/lib/mailer.ts
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const DEFAULT_FROM = process.env.SENDGRID_FROM || process.env.EMAIL_FROM || `no-reply@${new URL(APP_URL).hostname}`;

async function createTransport() {
  // 1) SendGrid via SMTP (preferred quick production)
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    } as SMTPTransport.Options);
  }

  // 2) Gmail via app password
  if (process.env.EMAIL_SERVICE === 'gmail' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    } as SMTPTransport.Options);
  }

  // 3) Gmail OAuth2 (optional)
  if (
    process.env.EMAIL_CLIENT_ID &&
    process.env.EMAIL_CLIENT_SECRET &&
    process.env.EMAIL_REFRESH_TOKEN &&
    process.env.EMAIL_USER
  ) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_REFRESH_TOKEN,
        accessToken: process.env.EMAIL_ACCESS_TOKEN
      }
    } as SMTPTransport.Options);
  }

  // 4) Ethereal (dev fallback) — creates a test account and returns a preview URL in console
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  } as SMTPTransport.Options);
}

export async function sendVerifyEmail(to: string, token: string) {
  const transport = await createTransport();
  const link = `${APP_URL}/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;

  const text = `Your verification code: ${token}\n\nOr click to verify: ${link}\n\nIf you didn't request this, ignore.`;
  const html = `<p>Your verification code: <strong>${token}</strong></p><p>Or click <a href="${link}">this link</a> to verify.</p>`;

  const info = await transport.sendMail({
    from: DEFAULT_FROM,
    to,
    subject: 'Verify your account',
    text,
    html
  });
  const preview = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
  if (preview) {
    // eslint-disable-next-line no-console
    console.log('Preview URL:', preview);
  }
  return info;
}
