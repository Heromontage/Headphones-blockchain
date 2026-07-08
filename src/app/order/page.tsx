'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { hardhat } from 'wagmi/chains';
import { parseUnits } from 'viem';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Aurora from '@/components/Aurora';
import BlurIn from '@/components/BlurIn';
import CircularGallery from '@/components/CircularGallery';
import AuthModal from '@/components/AuthModal';
import WalletConnection from '@/components/WalletConnection';

const colors = [
  { name: 'Shadow Black', hex: '#111116', image: '/shadow-black.png' },
  { name: 'Eccentric Purple', hex: '#5227FF', image: '/eccentric-purple.png' },
  { name: 'White', hex: '#e2e8f0', image: '/white.png' },
];

const galleryItems = colors.map((c) => ({ image: c.image, text: c.name }));

export default function OrderPage() {
  const [selectedColor, setSelectedColor] = useState('Shadow Black');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Quote State
  const [quote, setQuote] = useState<{usdPrice: number, ethUsdRate: number, ethAmount: string} | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Points / Rewards State
  const [availablePoints, setAvailablePoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const POINTS_TO_DOLLAR = 0.5;
  const BASE_USD_PRICE = 499;
  const discount = parseFloat((pointsToRedeem * POINTS_TO_DOLLAR).toFixed(2));
  const discountedUsdPrice = Math.max(0, BASE_USD_PRICE - discount);
  // Recalculate ETH in real-time using cached rate from quote
  const ethUsdRate = quote ? quote.ethUsdRate : 3000;
  const adjustedEthDisplay = (discountedUsdPrice / ethUsdRate).toFixed(4);

  // Address State
  const [address, setAddress] = useState({
    full_name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    phone: ''
  });
  const [savedAddress, setSavedAddress] = useState<typeof address | null>(null);
  const [usingSaved, setUsingSaved] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  
  const activeIndex = colors.findIndex((c) => c.name === selectedColor);

  const { data: session } = useSession();
  const { isConnected, address: walletAddress, chainId } = useAccount();
  const router = useRouter();

  const { data: txHash, sendTransactionAsync } = useSendTransaction();
  const { isLoading: isWaitingForTx, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Fetch quote
  useEffect(() => {
    if (session && isConnected) {
      setQuoteLoading(true);
      fetch('/api/orders/quote')
        .then(res => res.json())
        .then(data => {
          if (!data.error) setQuote(data);
          setQuoteLoading(false);
        })
        .catch(() => setQuoteLoading(false));
    }
  }, [session, isConnected]);

  // Fetch saved address
  useEffect(() => {
    if (session) {
      fetch('/api/user/address')
        .then(res => res.json())
        .then(data => {
          if (data.address) setSavedAddress(data.address);
        })
        .catch(console.error);
    }
  }, [session]);

  // Fetch available points balance
  useEffect(() => {
    if (session) {
      fetch('/api/user/points')
        .then(res => res.json())
        .then(data => {
          if (data.availablePoints !== undefined) setAvailablePoints(data.availablePoints);
        })
        .catch(console.error);
    }
  }, [session]);

  // Sync wallet to backend automatically if connected
  useEffect(() => {
    if (session && isConnected && walletAddress) {
      fetch('/api/user/wallet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      }).catch(console.error);
    }
  }, [session, isConnected, walletAddress]);

  const applySavedAddress = () => {
    if (savedAddress) {
      setAddress(savedAddress);
      setUsingSaved(true);
    }
  };

  const clearAddress = () => {
    setAddress({ full_name: '', line1: '', line2: '', city: '', state: '', postal_code: '', country: '', phone: '' });
    setUsingSaved(false);
  };

  const handleCheckout = async () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!isConnected || !walletAddress) {
      alert("Please connect your wallet first");
      return;
    }
    
    // Check if on correct network
    const { hardhat } = await import('wagmi/chains');
    const currentChainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
    if (parseInt(currentChainId, 16) !== hardhat.id) {
      alert("Please switch to the Hardhat Local network in your wallet to checkout.");
      return;
    }

    if (!address.full_name || !address.line1 || !address.city || !address.postal_code) {
      alert("Please fill in required shipping address fields");
      return;
    }
    if (!quote) {
      alert("Failed to get pricing quote, please refresh");
      return;
    }

    setLoading(true);
    try {
      setStatusText('Saving address...');
      // 1. Save Address
      const addressRes = await fetch('/api/user/address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address)
      });
      if (!addressRes.ok) throw new Error("Failed to save address");

      setStatusText('Creating order...');
      // 2. Create Order (pass points to redeem for discount)
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemColor: selectedColor, pointsToRedeem }),
      });
      
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");
      
      setStatusText('Awaiting wallet approval...');
      // 3. Send Transaction
      const hash = await sendTransactionAsync({
        to: orderData.devWalletAddress as `0x${string}`,
        value: BigInt(orderData.ethAmount),
      });

      setStatusText('Verifying payment on-chain...');
      // 4. Verify Payment Server-Side
      // We will wait a little to ensure the node mined it (Hardhat is instant usually, but safety first)
      await new Promise(r => setTimeout(r, 2000));
      
      const verifyRes = await fetch(`/api/orders/${orderData.orderId}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: hash }),
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");

      // 5. Success
      setStatusText('Success! Redirecting...');
      router.push(`/order-success?orderId=${orderData.orderId}`);
      
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'An error occurred during checkout.');
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative selection:bg-[#c87941]/30">
      <Navbar />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} defaultMode="signup" />

      {/* WebGL Aurora Background */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <Aurora
          colorStops={["#7cff67","#B497CF","#5227FF"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

      <div className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 min-h-[calc(100vh-80px)]">

        {/* Left Column - Product Showcase */}
        <div className="flex-1 flex items-center justify-center relative">
          <BlurIn delay={0.1} direction="bottom" className="w-full h-full min-h-[400px] lg:min-h-[600px] flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-full flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-[#c87941]/30 opacity-50"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-8 rounded-full border border-[#c87941]/10 opacity-30"
              />
              <div className="w-full h-full md:w-[150%] md:h-[150%] absolute z-10 drop-shadow-[0_0_30px_rgba(200,121,65,0.2)]" style={{ height: '500px' }}>
                <CircularGallery
                  items={galleryItems}
                  bend={3}
                  textColor="#ffffff"
                  borderRadius={0.05}
                  scrollSpeed={2}
                  activeIndex={activeIndex}
                  onIndexChange={(index) => {
                    const color = colors[index];
                    if (color) setSelectedColor(color.name);
                  }}
                />
              </div>
            </div>
          </BlurIn>
        </div>

        {/* Right Column - Configuration & Checkout */}
        <div className="flex-1 flex flex-col justify-center">
          <BlurIn delay={0.3} direction="top">
            <div className="mb-2">
              <span className="text-[#c87941] text-sm uppercase tracking-widest font-semibold">Order Now</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">Aether Audio<br/>Edition 1</h1>
            
            {!session ? (
              <div className="mt-8">
                <p className="text-white/60 text-lg mb-6 max-w-md leading-relaxed">
                  Sign in or create an account to secure your limited edition Aether headphones.
                </p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full max-w-xs bg-[#c87941] hover:bg-[#b06734] text-white py-4 rounded-xl text-lg font-medium tracking-wide transition-all duration-300"
                >
                  Sign In to Continue
                </button>
              </div>
            ) : (!isConnected || !walletAddress) ? (
              <div className="mt-8 bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
                <p className="text-sm text-white/50 mb-6">
                  You must connect a MetaMask wallet on the Hardhat local network to pay with Crypto and earn AETHER points.
                </p>
                <WalletConnection />
              </div>
            ) : (
              <div className="space-y-8 mt-6">
                {/* Color Selection */}
                <div>
                  <h3 className="text-sm uppercase tracking-wider text-white/40 mb-4 font-semibold">Select Finish</h3>
                  <div className="flex gap-4">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          selectedColor === color.name ? 'scale-110' : 'hover:scale-105 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full shadow-inner"
                          style={{ backgroundColor: color.hex, border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        {selectedColor === color.name && (
                          <motion.div
                            layoutId="color-ring"
                            className="absolute inset-0 rounded-full border-2 border-[#c87941]"
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-white/80 font-medium">{selectedColor}</p>
                </div>

                {/* Shipping Address */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm uppercase tracking-wider text-white/40 font-semibold">Shipping Address</h3>
                    {savedAddress && !usingSaved && (
                      <button
                        type="button"
                        onClick={applySavedAddress}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#c87941] bg-[#c87941]/10 border border-[#c87941]/30 px-3 py-1.5 rounded-lg hover:bg-[#c87941]/20 transition-all duration-200"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Use saved address
                      </button>
                    )}
                    {usingSaved && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-[#7cff67] bg-[#7cff67]/10 border border-[#7cff67]/20 px-2 py-1 rounded-lg">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Saved address applied
                        </span>
                        <button
                          type="button"
                          onClick={clearAddress}
                          className="text-xs text-white/40 hover:text-white/70 transition-colors underline"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Saved address preview banner */}
                  {savedAddress && !usingSaved && (
                    <button
                      type="button"
                      onClick={applySavedAddress}
                      className="w-full text-left bg-[#c87941]/5 border border-[#c87941]/20 rounded-xl px-4 py-3 hover:bg-[#c87941]/10 transition-all duration-200 group"
                    >
                      <p className="text-xs text-white/40 mb-1 uppercase tracking-widest">Last used address</p>
                      <p className="text-sm text-white/80 font-medium">{savedAddress.full_name}</p>
                      <p className="text-xs text-white/50">
                        {savedAddress.line1}{savedAddress.line2 ? `, ${savedAddress.line2}` : ''}, {savedAddress.city}, {savedAddress.state} {savedAddress.postal_code}, {savedAddress.country}
                      </p>
                      <p className="text-xs text-[#c87941] mt-2 group-hover:underline">Click to autofill →</p>
                    </button>
                  )}

                  <input type="text" placeholder="Full Name *" value={address.full_name} onChange={e => { setUsingSaved(false); setAddress({...address, full_name: e.target.value}); }} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c87941]/50 transition-colors" />
                  <input type="text" placeholder="Address Line 1 *" value={address.line1} onChange={e => { setUsingSaved(false); setAddress({...address, line1: e.target.value}); }} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c87941]/50 transition-colors" />
                  <input type="text" placeholder="Address Line 2 (Optional)" value={address.line2} onChange={e => setAddress({...address, line2: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c87941]/50 transition-colors" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="City *" value={address.city} onChange={e => { setUsingSaved(false); setAddress({...address, city: e.target.value}); }} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c87941]/50 transition-colors" />
                    <input type="text" placeholder="State/Province" value={address.state} onChange={e => setAddress({...address, state: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c87941]/50 transition-colors" />
                    <input type="text" placeholder="Postal Code *" value={address.postal_code} onChange={e => { setUsingSaved(false); setAddress({...address, postal_code: e.target.value}); }} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c87941]/50 transition-colors" />
                    <input type="text" placeholder="Country" value={address.country} onChange={e => setAddress({...address, country: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c87941]/50 transition-colors" />
                  </div>
                  <input type="text" placeholder="Phone Number" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#c87941]/50 transition-colors" />
                </div>

                {/* ── AETHER Points Redemption ── */}
                {availablePoints > 0 && (
                  <div className="bg-gradient-to-br from-[#c87941]/10 to-[#5227FF]/5 border border-[#c87941]/30 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⭐</span>
                        <span className="text-sm font-semibold text-white">Use AETHER Points</span>
                      </div>
                      <span className="text-xs text-white/50 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                        {availablePoints.toFixed(1)} pts available
                      </span>
                    </div>

                    {/* Slider */}
                    <input
                      type="range"
                      min={0}
                      max={availablePoints}
                      step={0.5}
                      value={pointsToRedeem}
                      onChange={e => setPointsToRedeem(parseFloat(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#c87941] bg-white/10"
                    />

                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="text-white/40">0 pts</span>
                      <span className="text-white/40">{availablePoints.toFixed(1)} pts</span>
                    </div>

                    {/* Quick preset buttons */}
                    <div className="flex gap-2 mt-3">
                      {[0, Math.min(1, availablePoints), Math.min(2, availablePoints), availablePoints].filter((v, i, arr) => arr.indexOf(v) === i).map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setPointsToRedeem(val)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                            pointsToRedeem === val
                              ? 'bg-[#c87941] text-white'
                              : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          {val === 0 ? 'None' : val === availablePoints ? 'All' : `${val} pt`}
                        </button>
                      ))}
                    </div>

                    {/* Redemption summary */}
                    {pointsToRedeem > 0 && (
                      <div className="mt-4 flex items-center justify-between bg-[#7cff67]/5 border border-[#7cff67]/20 rounded-xl px-4 py-2">
                        <span className="text-xs text-white/60">
                          Redeeming <span className="text-[#c87941] font-semibold">{pointsToRedeem.toFixed(1)} pts</span>
                        </span>
                        <span className="text-sm font-bold text-[#7cff67]">−${discount.toFixed(2)} off</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Price & Checkout */}
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-white/40 text-sm tracking-wider uppercase mb-1">Total Due Today</p>
                      {discount > 0 ? (
                        <div className="flex items-baseline gap-3">
                          <p className="text-4xl font-light">${discountedUsdPrice.toFixed(2)}</p>
                          <p className="text-lg text-white/30 line-through">${BASE_USD_PRICE}</p>
                        </div>
                      ) : (
                        <p className="text-4xl font-light">${BASE_USD_PRICE}</p>
                      )}
                      {discount > 0 && (
                        <p className="text-xs text-[#7cff67] mt-1">
                          You save ${discount.toFixed(2)} with {pointsToRedeem.toFixed(1)} pts
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {quoteLoading ? (
                        <p className="text-white/50 text-sm">Fetching live ETH rate...</p>
                      ) : quote ? (
                        <>
                          <p className="text-[#c87941] text-xl font-medium">{adjustedEthDisplay} ETH</p>
                          <p className="text-white/40 text-xs">Rate: 1 ETH = ${quote.ethUsdRate.toLocaleString()}</p>
                          <p className="text-green-400 text-xs mt-1">Earn 1.5 AETHER Points on this order</p>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loading || quoteLoading || !quote || chainId !== hardhat.id}
                    className="w-full mt-4 bg-[#c87941] hover:bg-[#b06734] text-white py-4 rounded-xl text-lg font-medium tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(200,121,65,0.3)] hover:shadow-[0_0_30px_rgba(200,121,65,0.5)] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? statusText || 'Processing...' : chainId !== hardhat.id ? 'Wrong Network' : `Confirm & Pay ${adjustedEthDisplay} ETH`}
                  </button>
                  <div className="mt-4 flex items-center justify-center gap-2 text-white/40 text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Secure on-chain checkout
                  </div>
                </div>

              </div>
            )}
          </BlurIn>
        </div>
      </div>

      <Footer />
    </main>
  );
}