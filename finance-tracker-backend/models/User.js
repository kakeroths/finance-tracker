// models/User.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  code: { type: String },
  expiresAt: { type: Date }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  otp: { type: otpSchema, default: undefined }
}, {
  timestamps: true
});

// safe toJSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
