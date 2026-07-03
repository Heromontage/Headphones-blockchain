import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from '@/lib/db';
import { ethers } from "ethers";
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { points } = await request.json();

    if (!points || points <= 0) {
      return NextResponse.json({ error: 'Invalid points amount' }, { status: 400 });
    }

    // Get user's wallet address and current balance
    const userResult = await query(
      `SELECT wallet_address, total_points_earned, total_points_redeemed
       FROM users WHERE id = ?`,
      [userId]
    ) as any[];

    if (userResult.length === 0 || !userResult[0].wallet_address) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 400 });
    }

    const walletAddress = userResult[0].wallet_address;
    const totalEarned = parseFloat(userResult[0].total_points_earned || '0');
    const totalRedeemed = parseFloat(userResult[0].total_points_redeemed || '0');
    const availablePoints = totalEarned - totalRedeemed;

    if (points > availablePoints) {
      return NextResponse.json({ error: 'Insufficient points balance' }, { status: 400 });
    }

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_NETWORK_RPC_URL);
    const privateKey = process.env.TOKEN_MINTING_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Token minting private key not configured');
    }
    const wallet = new ethers.Wallet(privateKey, provider);

    // Get contract instance
    const contractAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('Token contract address not configured');
    }

    // Simple ERC20 ABI for burn function
    const abi = ["function burn(address from, uint256 amount) external"];
    const contract = new ethers.Contract(contractAddress, abi, wallet);

    // Convert points to wei (18 decimals)
    const amountInWei = ethers.parseUnits(points.toString(), 18);

    // Execute burn transaction
    const tx = await contract.burn(walletAddress, amountInWei);
    const receipt = await tx.wait();

    // Generate discount code (simple implementation)
    const discountCode = `AETHER${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Store redemption in database
    const redemptionId = crypto.randomUUID();
    await query(
      `INSERT INTO redemptions (id, userId, points_redeemed, discount_code, status, redemption_tx_hash)
       VALUES (?, ?, ?, ?, 'completed', ?)`,
      [redemptionId, userId, points, discountCode, tx.hash]
    );

    // Update user's total points redeemed
    await query(
      'UPDATE users SET total_points_redeemed = total_points_redeemed + ? WHERE id = ?',
      [points, userId]
    );

    return NextResponse.json({
      success: true,
      discountCode,
      transactionHash: tx.hash
    }, { status: 200 });
  } catch (error: any) {
    console.error('Redemption error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}