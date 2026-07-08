import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const result = await query(
      'SELECT total_points_earned, total_points_redeemed FROM users WHERE id = ?',
      [userId]
    ) as any[];

    if (!result.length) {
      return NextResponse.json({ availablePoints: 0 }, { status: 200 });
    }

    const earned = parseFloat(result[0].total_points_earned || '0');
    const redeemed = parseFloat(result[0].total_points_redeemed || '0');
    const availablePoints = Math.max(0, earned - redeemed);

    return NextResponse.json({ availablePoints, earned, redeemed }, { status: 200 });
  } catch (error: any) {
    console.error('Points fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
