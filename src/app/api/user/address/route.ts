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
    const result = await query('SELECT shipping_address FROM users WHERE id = ?', [userId]) as any[];

    if (!result.length || !result[0].shipping_address) {
      return NextResponse.json({ address: null }, { status: 200 });
    }

    const address = typeof result[0].shipping_address === 'string'
      ? JSON.parse(result[0].shipping_address)
      : result[0].shipping_address;

    return NextResponse.json({ address }, { status: 200 });
  } catch (error: any) {
    console.error('Address fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { full_name, line1, line2, city, state, postal_code, country, phone } = body;

    if (!full_name || !line1 || !city || !state || !postal_code || !country || !phone) {
      return NextResponse.json({ error: 'Missing required address fields' }, { status: 400 });
    }

    const shippingAddress = {
      full_name,
      line1,
      line2,
      city,
      state,
      postal_code,
      country,
      phone
    };

    await query(
      'UPDATE users SET shipping_address = ? WHERE id = ?',
      [JSON.stringify(shippingAddress), userId]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Address update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
