import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, password } = body;

    if (!name || !phone || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUsers = await query('SELECT * FROM users WHERE email = ? OR phone = ?', [email, phone]);
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json({ error: 'User with this email or phone already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    await query(
      'INSERT INTO users (id, name, email, phone, password, orders_placed) VALUES (?, ?, ?, ?, ?, 0)',
      [id, name, email, phone, hashedPassword]
    );

    return NextResponse.json({ success: true, user: { id, name, email, phone } }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
