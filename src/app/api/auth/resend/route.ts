// src/app/api/auth/resend/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';
import { sendVerifyEmail } from '@/lib/mailer';

const LIMIT_MS = 1000 * 60 * 2; // 2 minutes between resends
const OTP_TTL_MS = 1000 * 60 * 15; // 15 minutes

// in-memory map: email -> lastSentTimestamp
const lastSent: Record<string, number> = {};

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email } = await req.json() as { email?: string };
    if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 });

    const now = Date.now();
    if (lastSent[email] && now - lastSent[email] < LIMIT_MS) {
      return NextResponse.json({ message: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    if (user.verified) return NextResponse.json({ message: 'Already verified' }, { status: 400 });

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verifyToken = otp;
    user.verifyTokenExpiry = new Date(Date.now() + OTP_TTL_MS);
    await user.save();

    try {
      await sendVerifyEmail(email, otp);
    } catch (mailErr) {
      // eslint-disable-next-line no-console
      console.error('Resend email failed', mailErr);
    }

    lastSent[email] = now;
    const devReturn = process.env.NODE_ENV === 'production' ? {} : { otp };
    return NextResponse.json({ message: 'OTP resent', ...devReturn }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Resend OTP error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
