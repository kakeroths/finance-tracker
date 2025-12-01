// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in environment (.env.local)');
}


export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // create token payload (keep it small)
    const payload = { id: user._id.toString(), email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // return minimal user info safe for client
    const safeUser = { id: user._id.toString(), name: user.name, email: user.email };

    return NextResponse.json({ token, user: safeUser }, { status: 200 });
  } catch (err) {
    // server-side error should be JSON, not HTML
    // eslint-disable-next-line no-console
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
