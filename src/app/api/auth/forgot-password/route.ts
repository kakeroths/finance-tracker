// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';
import { sendResetEmail } from '@/lib/mailer';

const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const email = (body?.email || '').toString().trim().toLowerCase();
    if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user) {
      // generic response to avoid user probing
      return NextResponse.json({ message: 'If an account exists, reset instructions were sent' }, { status: 200 });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiry = new Date(Date.now() + RESET_TTL_MS);

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();

    const frontend = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const url = `${frontend}/reset-password/confirm?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    try {
      await sendResetEmail(email, url);
    } catch (mailErr) {
      console.error('sendResetEmail error:', mailErr);
    }

    const devReturn = process.env.NODE_ENV === 'production' ? {} : { token };
    return NextResponse.json({ message: 'If an account exists, reset instructions were sent', ...devReturn }, { status: 200 });
  } catch (err) {
    console.error('forgot-password error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
