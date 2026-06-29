import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { itemColor, total } = body;

    if (!itemColor || !total) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    const orderId = crypto.randomUUID();

    await query(
      'INSERT INTO orders (id, userId, itemColor, status, total) VALUES (?, ?, ?, ?, ?)',
      [orderId, userId, itemColor, 'PENDING', total]
    );

    await query(
      'UPDATE users SET orders_placed = orders_placed + 1 WHERE id = ?',
      [userId]
    );

    return NextResponse.json({ success: true, orderId }, { status: 201 });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
