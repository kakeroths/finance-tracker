// src/app/api/auth/verify/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const email = url.searchParams.get('email') ?? undefined;

    if (!token) return NextResponse.json({ message: 'Token required' }, { status: 400 });

    // if email provided, find by email+token; otherwise find by token
    const query = email ? { email, verifyToken: token } : { verifyToken: token };
    const user = await User.findOne(query);
    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
    }

    if (!user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
      return NextResponse.json({ message: 'Token expired' }, { status: 400 });
    }

    user.verified = true;
    user.verifyToken = null;
    user.verifyTokenExpiry = null;
    await user.save();

    return NextResponse.json({ message: 'Email verified', verified: true }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Verify GET error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, token } = body as { email?: string; token?: string };

    if (!email || !token) {
      return NextResponse.json({ message: 'Email and token required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    if (!user.verifyToken || user.verifyToken !== token) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 400 });
    }

    if (!user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
      return NextResponse.json({ message: 'Token expired' }, { status: 400 });
    }

    user.verified = true;
    user.verifyToken = null;
    user.verifyTokenExpiry = null;
    await user.save();

    return NextResponse.json({ message: 'Verified', verified: true }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Verify POST error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
