import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from '@/lib/db';
import crypto from 'crypto';

const BASE_USD_PRICE = 499;
const POINTS_TO_DOLLAR_VALUE = parseFloat(process.env.POINTS_TO_DOLLAR_VALUE || '0.5');

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // Check if wallet is connected & fetch current points balance
    const userResult = await query(
      'SELECT wallet_connected, total_points_earned, total_points_redeemed FROM users WHERE id = ?',
      [userId]
    ) as any[];
    if (!userResult.length || !userResult[0].wallet_connected) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 403 });
    }

    const body = await request.json();
    const { itemColor, pointsToRedeem: rawPointsToRedeem = 0 } = body;

    if (!itemColor) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    // Validate points redemption amount
    const earned = parseFloat(userResult[0].total_points_earned || '0');
    const redeemed = parseFloat(userResult[0].total_points_redeemed || '0');
    const availablePoints = Math.max(0, earned - redeemed);
    const pointsToRedeem = Math.min(Math.max(0, parseFloat(rawPointsToRedeem) || 0), availablePoints);

    // Calculate discount: each point = $0.50 off
    const discount = parseFloat((pointsToRedeem * POINTS_TO_DOLLAR_VALUE).toFixed(2));
    const usdPrice = Math.max(0, BASE_USD_PRICE - discount);

    const orderId = crypto.randomUUID();
    
    // Fetch live ETH rate
    let ethUsdRate = 3000;
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      if (res.ok) {
        const data = await res.json();
        if (data.ethereum?.usd) ethUsdRate = data.ethereum.usd;
      }
    } catch (err) {}

    const ethAmount = usdPrice / ethUsdRate;
    const { ethers } = await import("ethers");
    const ethAmountInWei = ethers.parseUnits(ethAmount.toFixed(18), 18).toString();

    // Create order
    await query(
      'INSERT INTO orders (id, userId, itemColor, status, total, eth_amount, usd_to_eth_rate, points_redeemed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [orderId, userId, itemColor, 'AWAITING_PAYMENT', usdPrice, ethAmount, ethUsdRate, pointsToRedeem]
    );

    // Deduct redeemed points from user balance immediately (prevent double-spend)
    if (pointsToRedeem > 0) {
      await query(
        'UPDATE users SET total_points_redeemed = total_points_redeemed + ? WHERE id = ?',
        [pointsToRedeem, userId]
      );
    }

    // Update user's order count
    await query('UPDATE users SET orders_placed = orders_placed + 1 WHERE id = ?', [userId]);

    const devWalletAddress = process.env.DEV_WALLET_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

    return NextResponse.json({ 
      success: true, 
      orderId,
      ethAmount: ethAmountInWei,
      usdTotal: usdPrice,
      discount,
      pointsRedeemed: pointsToRedeem,
      devWalletAddress 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}