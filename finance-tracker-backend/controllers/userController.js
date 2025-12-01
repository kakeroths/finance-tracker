// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateOTP } = require('../utils/otp');
const { sendOTPEmail } = require('../utils/mailer');

async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updateProfile(req, res) {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'username required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.username = username;
    await user.save();

    const safe = user.toJSON();
    return res.json({ message: 'Profile updated', user: safe });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * Change password flow (2-step):
 * 1) POST /user/change-request  -> sends OTP to user's email (auth required)
 * 2) POST /user/change-verify   -> body: { code, newPassword } -> verifies OTP and sets new password
 */
async function changePasswordRequest(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES || '10') * 60 * 1000));
    user.otp = { code: otpCode, expiresAt };
    await user.save();

    try {
      await sendOTPEmail(user.email, 'Change password OTP', `Your OTP to change password is ${otpCode}.`);
    } catch (e) {
      console.warn('Email failed', e);
    }

    return res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function changePasswordVerify(req, res) {
  try {
    const { code, newPassword } = req.body;
    if (!code || !newPassword) return res.status(400).json({ message: 'code and newPassword required' });

    const user = await User.findById(req.user._id);
    if (!user || !user.otp) return res.status(400).json({ message: 'No OTP pending' });

    if (user.otp.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });
    if (user.otp.code !== String(code).trim()) return res.status(400).json({ message: 'Invalid OTP' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getMe,
  updateProfile,
  changePasswordRequest,
  changePasswordVerify
};
