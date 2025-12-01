// src/app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const token = (body?.token || '').toString();
    const password = (body?.password || '').toString();

    if (!token || !password) {
      return NextResponse.json({ message: 'Token and password required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    user.password = hash;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return NextResponse.json({ message: 'Password updated' }, { status: 200 });
  } catch (err) {
    console.error('reset-password error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
