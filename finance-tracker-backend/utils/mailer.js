// utils/mailer.js
const nodemailer = require('nodemailer');

let transporter;

// If you provide SMTP in .env, use it. Otherwise create an Ethereal test account fallback.
async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    return transporter;
  }
  

  // Fallback: create Ethereal account (dev only)
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
  console.log('Ethereal test account created. Preview emails at:', testAccount.user);
  return transporter;
}


async function sendOTPEmail(to, subject, text) {
  const t = await getTransporter();
  const info = await t.sendMail({
    from: process.env.EMAIL_FROM || (process.env.EMAIL_USER || 'no-reply@example.com'),
    to,
    subject,
    text
  });

  // If using Ethereal, provide preview URL in console
  if (nodemailer.getTestMessageUrl && info) {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log('Email preview URL:', preview);
  }
  return info;
}
async function sendResetEmail(to, resetUrl) {
  const t = await getTransporter();

  const subject = 'Reset your password';
  const text = `Reset your password:\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`;
  const html = `
    <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
    <p>If you did not request this, you can safely ignore this email.</p>
  `;

  const info = await t.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@example.com',
    to,
    subject,
    text,
    html
  });

  if (nodemailer.getTestMessageUrl && info) {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log('Reset Email Preview URL:', preview);
  }

  return info;
}

module.exports = { sendOTPEmail, getTransporter ,sendResetEmail};
