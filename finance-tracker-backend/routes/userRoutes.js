// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  getMe,
  updateProfile,
  changePasswordRequest,
  changePasswordVerify
} = require('../controllers/userController');

router.get('/me', auth, getMe);
router.put('/update', auth, updateProfile);

// change password (OTP)
router.post('/change-request', auth, changePasswordRequest);
router.post('/change-verify', auth, changePasswordVerify);

module.exports = router;
