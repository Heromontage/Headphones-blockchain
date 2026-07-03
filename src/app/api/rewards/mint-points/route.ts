import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from '@/lib/db';
import { ethers } from "ethers";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { orderId, total } = await request.json();

    if (!orderId || !total) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    // Get user's wallet address
      const userResult = await query(
        'SELECT wallet_address FROM users WHERE id = ?',
        [userId]
      ) as any[];

    if (userResult.length === 0 || !userResult[0].wallet_address) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 400 });
    }

    const walletAddress = userResult[0].wallet_address;

    // Calculate points to mint (1 point per $1 by default)
    const pointsPerDollar = parseFloat(process.env.POINTS_PER_DOLLAR || '1');
    const pointsToMint = parseFloat(total) * pointsPerDollar;

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

    // Simple ERC20 ABI for mint function
    const abi = ["function mint(address to, uint256 amount) external"];
    const contract = new ethers.Contract(contractAddress, abi, wallet);

    // Convert points to wei (18 decimals)
    const amountInWei = ethers.parseUnits(pointsToMint.toString(), 18);

    // Execute mint transaction
    const tx = await contract.mint(walletAddress, amountInWei);
    const receipt = await tx.wait();

    // Store transaction in database
    await query(
      'UPDATE orders SET points_earned = ?, points_tx_hash = ? WHERE id = ? AND userId = ?',
      [pointsToMint, tx.hash, orderId, userId]
    );

    // Update user's total points earned
    await query(
      'UPDATE users SET total_points_earned = total_points_earned + ? WHERE id = ?',
      [pointsToMint, userId]
    );

    return NextResponse.json({
      success: true,
      transactionHash: tx.hash,
      points: pointsToMint
    }, { status: 200 });
  } catch (error: any) {
    console.error('Reward minting error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}