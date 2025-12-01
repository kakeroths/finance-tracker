// src/models/User.ts
import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  verified?: boolean;
  verifyToken?: string | null;
  verifyTokenExpiry?: Date | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verifyToken: { type: String, default: null },
    verifyTokenExpiry: { type: Date, default: null },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null }
  },
  { timestamps: true }
);

// avoid recompilation in dev (Next.js hot reload)
const User: Model<IUser> = (mongoose.models?.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
