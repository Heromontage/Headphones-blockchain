import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from '@/lib/db';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: orderId } = await context.params;
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { txHash } = body;

    if (!txHash) {
      return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 });
    }

    // 1. Fetch order to verify it's awaiting payment and belongs to user
    const orderResult = await query(
      'SELECT * FROM orders WHERE id = ? AND userId = ? AND status = ?',
      [orderId, userId, 'AWAITING_PAYMENT']
    ) as any[];

    if (!orderResult.length) {
      return NextResponse.json({ error: 'Order not found or not awaiting payment' }, { status: 404 });
    }

    const order = orderResult[0];

    // 2. Prevent tx hash reuse
    const txCheck = await query(
      'SELECT id FROM orders WHERE payment_tx_hash = ?',
      [txHash]
    ) as any[];
    
    if (txCheck.length > 0) {
      return NextResponse.json({ error: 'Transaction hash already used for another order' }, { status: 400 });
    }

    // 3. Verify payment on-chain server-side
    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545'); // Hardhat local RPC
    const devWalletAddress = process.env.DEV_WALLET_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt || receipt.status !== 1) {
        return NextResponse.json({ error: 'Transaction failed or not found on chain' }, { status: 400 });
      }

      const tx = await provider.getTransaction(txHash);
      if (!tx || tx.to?.toLowerCase() !== devWalletAddress.toLowerCase()) {
         return NextResponse.json({ error: 'Invalid transaction recipient' }, { status: 400 });
      }
      
      // We stored eth_amount as DECIMAL, need to compare carefully.
      // ethAmount in DB is e.g. 0.166333
      const expectedAmountWei = ethers.parseUnits(order.eth_amount.toString(), 18);
      
      // Allow a tiny margin of error if floating point issues happened, but mostly exact match.
      // Actually since we generated it as a string on frontend via quote, it should match closely.
      // Since ethers parsing can be strict, we'll check if value is >= expected - small diff
      const difference = tx.value > expectedAmountWei ? tx.value - expectedAmountWei : expectedAmountWei - tx.value;
      
      // Margin of 10000 wei is negligible
      if (difference > BigInt(10000)) {
         return NextResponse.json({ error: 'Transaction amount does not match expected amount' }, { status: 400 });
      }

    } catch (err) {
       console.error("Verification failed with RPC:", err);
       return NextResponse.json({ error: 'Failed to verify transaction with RPC' }, { status: 500 });
    }

    // 4. Verification passed: set status to PAID, store tx details
    await query(
      'UPDATE orders SET status = ?, payment_tx_hash = ? WHERE id = ?',
      ['PAID', txHash, orderId]
    );

    // 5. Trigger AETHER Points minting logic
    let pointsEarned = 0;
    try {
      const pointsPerDollar = parseFloat(process.env.POINTS_PER_DOLLAR || '1');
      pointsEarned = parseFloat(order.total) * pointsPerDollar;

      // Get user's wallet address
      const userResult = await query(
        'SELECT wallet_address FROM users WHERE id = ?',
        [userId]
      ) as any[];

      if (userResult.length > 0 && userResult[0].wallet_address) {
        const walletAddress = userResult[0].wallet_address;

        const privateKey = process.env.TOKEN_MINTING_PRIVATE_KEY;
        if (!privateKey) {
          console.warn('Token minting private key not configured - skipping points minting');
        } else {
          const wallet = new ethers.Wallet(privateKey, provider);

          const contractAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS;
          if (contractAddress) {
            const abi = ["function mint(address to, uint256 amount) external"];
            const contract = new ethers.Contract(contractAddress, abi, wallet);

            const amountInWei = ethers.parseUnits(pointsEarned.toString(), 18);
            const mintTx = await contract.mint(walletAddress, amountInWei);
            await mintTx.wait();

            await query(
              'UPDATE orders SET points_earned = ?, points_tx_hash = ? WHERE id = ?',
              [pointsEarned, mintTx.hash, orderId]
            );

            await query(
              'UPDATE users SET total_points_earned = total_points_earned + ? WHERE id = ?',
              [pointsEarned, userId]
            );
          }
        }
      }
    } catch (mintError) {
      console.warn('Failed to mint points for order:', mintError);
    }

    return NextResponse.json({ 
      success: true, 
      status: 'PAID',
      pointsEarned 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
