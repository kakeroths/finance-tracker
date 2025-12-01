// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // attempt DB connection (connectDB should be idempotent)
    await connectDB();

    const readyState = mongoose.connection.readyState; // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    const status =
      readyState === 1
        ? 'ok'
        : readyState === 2
        ? 'connecting'
        : 'unhealthy';

    return NextResponse.json(
      {
        status: 'ok',
        database: {
          readyState,
          status
        },
        time: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (err) {
    // log error to server console for debugging
    // eslint-disable-next-line no-console
    console.error('Health check failed:', err);
    return NextResponse.json(
      {
        status: 'error',
        message: (err as Error).message ?? 'unknown',
        time: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
