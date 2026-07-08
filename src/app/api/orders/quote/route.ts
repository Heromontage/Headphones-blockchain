import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Very simple in-memory cache for the rate to avoid rate limits
let cachedRate: number | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usdPrice = 499;
    let ethUsdRate = cachedRate;

    const now = Date.now();
    if (!ethUsdRate || now - lastFetchTime > CACHE_TTL) {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        if (res.ok) {
          const data = await res.json();
          if (data.ethereum && data.ethereum.usd) {
            ethUsdRate = data.ethereum.usd;
            cachedRate = ethUsdRate;
            lastFetchTime = now;
          }
        }
      } catch (err) {
        console.error('Failed to fetch ETH rate:', err);
      }
    }

    if (!ethUsdRate) {
      // Fallback rate if API fails entirely
      ethUsdRate = 3000; 
    }

    // Amount in ETH
    const ethAmount = usdPrice / ethUsdRate;
    
    // Import ethers dynamically to avoid issues
    const { ethers } = await import("ethers");
    const ethAmountInWei = ethers.parseUnits(ethAmount.toFixed(18), 18).toString();

    return NextResponse.json({
      usdPrice,
      ethUsdRate,
      ethAmount: ethAmountInWei
    });
  } catch (error: any) {
    console.error('Quote error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
