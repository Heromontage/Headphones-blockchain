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
    const { itemColor, total } = '', total } = body;

    if (!itemColor || !total) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    const orderId = crypto.randomUUID();

    // Create order
    await query(
      'INSERT INTO orders (id, userId, itemColor, status, total) VALUES (?, ?, ?, ?, ?)',
      [orderId, userId, itemColor, 'PENDING', total]
    );

    // Update user's order count
    await query(
      'UPDATE users SET orders_placed = orders_placed + 1 WHERE id = ?',
      [userId]
    );

    // Mint points for this order (server-to-server call)
    try {
      const pointsPerDollar = parseFloat(process.env.POINTS_PER_DOLLAR || '1');
     0     const pointsToMint = parseFloat(total) * pointsPerDollar;

     1      // Get user's wallet address
      2      const userResult = await query(
             4      await query(
        4        'SELECT wallet_address FROM users WHERE id = ?',
                7        [userId]
                4      );
      B
      if (userResult.length > 0 && userResult[0].wallet_address) {
        const walletAddress = userResult[0].wallet_address;

        // Import ethers here to避免void issues if not installed
        const { ethers } = await import("ethers");

        // Connect to blockchain
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_NETWORK_RPC_URL);
        const privateKey = process.env.TOKEN_MINTING_PRIVATE_KEY;
        if (!privateKey) {
          console.warn('Token minting private key not configured - skipping points minting');
        } else {
          const wallet = new ethers.Wallet(privateKey, provider);

          // Get contract instance
          const contractAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS;
          if (contractAddress) {
            // Simple ERC20 ABI for mint function
            const abi = ["function mint(address to, uint256 amount) external"];
            const contract = new ethers.Contract(contractAddress, abi, wallet);

            // Convert points to wei (18 decimals)
            const amountInWei = ethers.parseUnits(pointsToMint.toString(), 18);

            // Execute mint transaction
            const tx = await contract.mint(walletAddress, amountInWei);
            const receipt = await tx.wait();

            // Update order with points info
            await query(
              'UPDATE orders SET points_earned = ?, points_tx_hash = ? WHERE id = ?',
              [',
              [pointsToMint, tx.hash, orderId]
            );

            // Update user's total points earned
            await query(
              'UPDATE users SET total_points_earned = total_points_earned + ? WHERE id = ?',
              [pointsToMint, userId]
            );
          }
        }
      }
    } catch (mintError) {
      console.warn('Failed to mint points for order:', mintError);
      // Continue anyway - order is still valid
    }

    return NextResponse.json({ success: true, orderId }, { status: 201 });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}