// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP } = require('../utils/otp');
const { sendOTPEmail } = require('../utils/mailer');

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'dev_jwt_secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

async function signup(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'username, email, password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES || '10') * 60 * 1000));

    const user = new User({ username, email, password: hashed, otp: { code: otpCode, expiresAt }});
    await user.save();

    // send OTP email (if fails, we still return userId so you can re-request)
    try {
      await sendOTPEmail(email, 'Your signup OTP', `Your OTP is ${otpCode}. It expires in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.`);
    } catch (e) {
      console.warn('Failed to send OTP email:', e.message || e);
    }

    return res.status(201).json({ message: 'Signup created. OTP sent to email (or logged).', userId: user._id, email: user.email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function verifySignupOTP(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'email and code required' });

    const user = await User.findOne({ email });
    if (!user || !user.otp) return res.status(400).json({ message: 'No OTP pending for this user' });

    if (user.otp.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

    // 🔁 FIX HERE
    if (String(user.otp.code) !== String(code).trim())
      return res.status(400).json({ message: 'Invalid OTP' });

    user.otp = undefined;
    await user.save();

    const token = signToken(user._id);
    return res.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}


async function login(req, res) {
  try {
    const { email, password, requestOtp } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    if (requestOtp) {
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES || '10') * 60 * 1000));
      user.otp = { code: otpCode, expiresAt };
      await user.save();
      try { await sendOTPEmail(user.email, 'Login OTP', `Your login OTP is ${otpCode}`); } catch(e){ console.warn('Email failed', e); }
      return res.json({ message: 'OTP sent to your email', email: user.email });
    }

    const token = signToken(user._id);
    return res.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function verifyLoginOTP(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'email and code required' });

    const user = await User.findOne({ email });
    if (!user || !user.otp) return res.status(400).json({ message: 'No OTP pending' });
    if (user.otp.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });
    if (user.otp.code !== String(code).trim()) return res.status(400).json({ message: 'Invalid OTP' });

    user.otp = undefined;
    await user.save();
    const token = signToken(user._id);
    return res.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'No user with that email' });

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES || '10') * 60 * 1000));
    user.otp = { code: otpCode, expiresAt };
    await user.save();

    try { await sendOTPEmail(email, 'Reset password OTP', `Your OTP: ${otpCode}`); } catch(e){ console.warn('Email failed', e); }
    return res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ message: 'email, code, newPassword required' });

    const user = await User.findOne({ email });
    if (!user || !user.otp) return res.status(400).json({ message: 'No OTP pending' });
    if (user.otp.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });
    if (user.otp.code !== String(code).trim()) return res.status(400).json({ message: 'Invalid OTP' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { signup, verifySignupOTP, login, verifyLoginOTP, forgotPassword, resetPassword };
