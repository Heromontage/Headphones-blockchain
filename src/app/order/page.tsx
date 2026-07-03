'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Aurora from '@/components/Aurora';
import BlurIn from '@/components/BlurIn';
import CircularGallery from '@/components/CircularGallery';
import AuthModal from '@/components/AuthModal';

const colors = [
  { name: 'Shadow Black', hex: '#111116', image: '/shadow-black.png' },
  { name: 'Eccentric Purple', hex: '#5227FF', image: '/eccentric-purple.png' },
  { name: 'White', hex: '#e2e8f0', image: '/white.png' },
];

const galleryItems = colors.map((c) => ({ image: c.image, text: c.name }));

export default function OrderPage() {
  const [selectedColor, setSelectedColor] = useState('Shadow Black');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const activeIndex = colors.findIndex((c) => c.name === selectedColor);

  const { data: session } = useSession();
  const router = useRouter();

  const handleCheckout = async () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemColor: selectedColor, total: 499 }),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to order success page with order ID
        router.push(`/order-success?orderId=${data.orderId}`);
      } else {
        alert('Failed to place order. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred. Please try again.');
      setLoading(false);
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
              {/* Decorative Ring */}
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

              {/* Interactive Circular Gallery */}
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
            <p className="text-white/60 text-lg mb-10 max-w-md leading-relaxed">
              Experience the purest sound imaginable. Secure your limited edition Aether headphones today.
            </p>

            {/* Color Selection */}
            <div className="mb-10">
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

            {/* Price & Checkout */}
            <div className="pt-8 border-t border-white/10">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-white/40 text-sm tracking-wider uppercase mb-1">Total Due Today</p>
                  <p className="text-4xl font-light">$499</p>
                </div>
                <div className="text-right">
                  <p className="text-[#c87941] text-sm">Ships October 2026</p>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-[#c87941] hover:bg-[#b06734] text-white py-4 rounded-xl text-lg font-medium tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(200,121,65,0.3)] hover:shadow-[0_0_30px_rgba(200,121,65,0.5)] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Complete Order'}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-white/40 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Secure encrypted checkout
              </div>
            </div>
          </BlurIn>
        </div>
      </div>

      <Footer />
    </main>
  );
}