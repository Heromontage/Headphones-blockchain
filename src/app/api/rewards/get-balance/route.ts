import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from '@/lib/db';
import { ethers } from "ethers";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get user's wallet address
    const userResult = await query(
      'SELECT wallet_address FROM users WHERE id = ?',
      [userId]
    ) as any[];

    if (userResult.length === 0 || !userResult[0].wallet_address) {
      return NextResponse.json({ balance: 0 }, { status: 200 });
    }

    const walletAddress = userResult[0].wallet_address;

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_NETWORK_RPC_URL);

    // Get contract instance
    const contractAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('Token contract address not configured');
    }

    // Simple ERC20 ABI for balanceOf function
    const abi = ["function balanceOf(address account) view returns (uint256)"];
    const contract = new ethers.Contract(contractAddress, abi, provider);

    // Get balance
    const balanceInWei = await contract.balanceOf(walletAddress);
    const balance = ethers.formatUnits(balanceInWei, 18);

    return NextResponse.json({ balance: parseFloat(balance) }, { status: 200 });
  } catch (error: any) {
    console.error('Balance fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}