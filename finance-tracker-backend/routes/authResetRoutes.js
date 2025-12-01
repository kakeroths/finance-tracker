// routes/authResetRoutes.js
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const router = express.Router();

const User = require('../models/User'); // adjust path if your User model is elsewhere
// Most backends keep mailer in utils; change this if your mailer is somewhere else.
let sendResetEmail;
try {
  // try common backend mailer path
  ({ sendResetEmail } = require('../utils/mailer'));
} catch (e) {
  try {
    ({ sendResetEmail } = require('../lib/mailer')); // alternative
  } catch (e2) {
    // leave undefined -> we'll log if missing
    sendResetEmail = undefined;
  }
}

const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour
const SALT_ROUNDS = 10;

router.post('/forgot-password', async (req, res) => {
  try {
    // ensure body is parsed
    const email = (req.body && req.body.email) ? String(req.body.email).trim().toLowerCase() : '';
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) {
      // don't reveal user existence
      return res.status(200).json({ message: 'If an account exists, reset instructions were sent' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const url = `${frontend}/reset-password/confirm?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    if (typeof sendResetEmail === 'function') {
      try {
        const mailRes = await sendResetEmail(email, url);
        // If mailer returns preview url property, print it for Ethereal
        console.log('sendResetEmail result:', mailRes && (mailRes.previewUrl || mailRes.messageId || mailRes));
      } catch (mailErr) {
        console.error('sendResetEmail failed (non-fatal):', mailErr && (mailErr.stack || mailErr));
      }
    } else {
      console.warn('sendResetEmail is not defined — check mailer import path.');
    }

    const devReturn = process.env.NODE_ENV === 'production' ? {} : { token };
    return res.json({ message: 'If an account exists, reset instructions were sent', ...devReturn });
  } catch (err) {
    console.error('forgot-password handler error:', err && (err.stack || err));
    return res.status(500).json({ message: 'Server error', detail: String(err && err.message ? err.message : err) });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const token = req.body?.token ? String(req.body.token) : '';
    const password = req.body?.password ? String(req.body.password) : '';

    if (!token || !password) return res.status(400).json({ message: 'Token and password required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(password, SALT_ROUNDS);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('reset-password handler error:', err && (err.stack || err));
    return res.status(500).json({ message: 'Server error', detail: String(err && err.message ? err.message : err) });
  }
});

module.exports = router;
