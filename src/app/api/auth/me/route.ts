// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || '';

function getAuthHeader(req: Request): string | undefined {
  return req.headers.get('authorization') ?? undefined;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const auth = getAuthHeader(req);
    if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const m = auth.match(/^Bearer (.+)$/);
    if (!m) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
      const payload = jwt.verify(m[1], JWT_SECRET) as { id: string; email?: string };
      const user = await User.findById(payload.id).lean();
      if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      return NextResponse.json({ id: user._id.toString(), name: user.name, email: user.email });
    } catch (err) {
      const e = err as Error;
      console.error('JWT verify failed:', e.name, e.message);
      return NextResponse.json({ message: 'Unauthorized', reason: e.message }, { status: 401 });
    }
  } catch (err) {
    console.error('GET /api/auth/me error', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
