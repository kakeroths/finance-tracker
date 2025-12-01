// src/app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerifyEmail } from '@/lib/mailer';

const OTP_TTL_MS = 1000 * 60 * 15; // 15 minutes

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password } = body as { name?: string; email?: string; password?: string };

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email and password are required' }, { status: 400 });
    }

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const created = await User.create({ name, email, password: hashed, verified: false });

    // generate OTP token (numeric or hex). Here: 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const expiry = new Date(Date.now() + OTP_TTL_MS);

    created.verifyToken = otp;
    created.verifyTokenExpiry = expiry;
    await created.save();

    // send OTP email (best-effort)
    try {
      await sendVerifyEmail(email, otp);
    } catch (mailErr) {
      // log only
      // eslint-disable-next-line no-console
      console.error('Failed to send verification email:', mailErr);
    }

    // For dev convenience we return otp only when NODE_ENV !== 'production'
    const devReturn = process.env.NODE_ENV === 'production' ? {} : { otp };

    return NextResponse.json({ message: 'User created. Verify your email.', needsVerification: true, ...devReturn }, { status: 201 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Signup error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
