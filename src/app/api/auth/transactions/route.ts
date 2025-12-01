// src/app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Transaction from '@/models/Transaction';

type TransactionFilter = {
  type?: 'income' | 'expense';
  [key: string]: unknown;
};

export async function GET(req: Request) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const page = Math.max(Number(url.searchParams.get('page') ?? '1'), 1);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? '10'), 1), 100);
    const type = url.searchParams.get('type') ?? undefined;
    const skip = (page - 1) * limit;

    const filter: TransactionFilter = {};
    if (type === 'income' || type === 'expense') {
      filter.type = type;
    }

    const [data, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(filter)
    ]);

    return NextResponse.json({ data, meta: { total, page, limit } });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /api/transactions error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { type, description, amount } = body as { type?: string; description?: string; amount?: number };

    if (!type || !description || typeof amount !== 'number') {
      return NextResponse.json({ message: 'type, description, amount required' }, { status: 400 });
    }

    const created = await Transaction.create({
      type,
      description,
      amount,
      createdAt: new Date()
    });

    return NextResponse.json({ transaction: created }, { status: 201 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('POST /api/transactions error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
