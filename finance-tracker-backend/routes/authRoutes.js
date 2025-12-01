// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  signup,
  verifySignupOTP,
  login,
  verifyLoginOTP,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/signup/verify', verifySignupOTP);

router.post('/login', login);
router.post('/login/verify', verifyLoginOTP);

router.post('/forgot', forgotPassword);
router.post('/reset', resetPassword);

// 👇 Protected route (JWT required)
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});
module.exports = router;
