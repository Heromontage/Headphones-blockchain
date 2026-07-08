import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // Check if user is admin
    const userResult = await query('SELECT is_admin FROM users WHERE id = ?', [userId]) as any[];
    if (!userResult.length || !userResult[0].is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all orders with basic user details
    const orders = await query(`
      SELECT 
        o.id, o.userId, o.itemColor, o.status, o.total, 
        o.eth_amount, o.payment_tx_hash, o.createdAt,
        u.email, u.name 
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
      ORDER BY o.createdAt DESC
    `) as any[];

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error('Admin orders error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
