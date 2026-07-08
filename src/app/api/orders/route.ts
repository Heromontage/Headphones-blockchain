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
    
    // Check if wallet is connected
    const userResult = await query('SELECT wallet_connected FROM users WHERE id = ?', [userId]) as any[];
    if (!userResult.length || !userResult[0].wallet_connected) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 403 });
    }

    const body = await request.json();
    const { itemColor } = body; // Don't trust total from client

    if (!itemColor) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    const orderId = crypto.randomUUID();
    
    // Fetch quote from our own API or logic
    // We'll reproduce the quote logic here to be safe and autonomous
    const usdPrice = 499;
    let ethUsdRate = 3000;
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      if (res.ok) {
        const data = await res.json();
        if (data.ethereum && data.ethereum.usd) {
          ethUsdRate = data.ethereum.usd;
        }
      }
    } catch (err) {}

    const ethAmount = usdPrice / ethUsdRate;
    
    // Import ethers dynamically to avoid issues
    const { ethers } = await import("ethers");
    const ethAmountInWei = ethers.parseUnits(ethAmount.toFixed(18), 18).toString();

    // Create order with status AWAITING_PAYMENT
    await query(
      'INSERT INTO orders (id, userId, itemColor, status, total, eth_amount, usd_to_eth_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderId, userId, itemColor, 'AWAITING_PAYMENT', usdPrice, ethAmount, ethUsdRate]
    );

    // Update user's order count
    await query(
      'UPDATE users SET orders_placed = orders_placed + 1 WHERE id = ?',
      [userId]
    );

    // Developer Wallet address to pay to (Hardhat account 1 usually, or specific address)
    // Here we'll use a hardcoded DEV address or from env
    const devWalletAddress = process.env.DEV_WALLET_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

    return NextResponse.json({ 
      success: true, 
      orderId,
      ethAmount: ethAmountInWei,
      devWalletAddress 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}