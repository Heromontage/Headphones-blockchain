'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'email' | 'phone';
type Mode = 'signin' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: Mode;
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'signin' }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>('email');
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setError('');
    setLoading(false);
    setOtpSent(false);
    setName(''); setEmail(''); setPassword(''); setPhone(''); setOtp('');
    onClose();
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    signIn('google', { callbackUrl: '/profile' });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Signup failed');
          setLoading(false);
          return;
        }
      } catch (err: any) {
        setError('An unexpected error occurred');
        setLoading(false);
        return;
      }
    }

    const result = await signIn('email-login', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      handleClose();
      window.location.href = '/profile';
    }
  };

  const handleSendOtp = async () => {
    if (!phone) { setError('Enter a phone number first'); return; }
    setError('');
    setLoading(true);
    // Simulate OTP send — in production, call your SMS API here
    await new Promise(r => setTimeout(r, 1000));
    setOtpSent(true);
    setLoading(false);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn('phone-otp', {
      phone,
      otp,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      handleClose();
      window.location.href = '/profile';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed z-50 inset-0 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md bg-[#0f0f1a]/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden max-h-[90vh] flex flex-col">
              
              {/* Header */}
              <div className="relative px-8 pt-8 pb-6 border-b border-white/10 shrink-0">
                <button
                  onClick={handleClose}
                  className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors text-xl"
                >
                  ✕
                </button>
                <div className="mb-4">
                  <span className="text-[#c87941] text-xs uppercase tracking-widest font-semibold">Aether Audio</span>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {mode === 'signin' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-white/50 text-sm mt-1">
                  {mode === 'signin' ? 'Sign in to access your profile and orders.' : 'Join Aether to place and track your orders.'}
                </p>
              </div>

              {/* Body */}
              <div className="p-8 overflow-y-auto">
                {/* Google */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 mb-6"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-xs uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Tab switcher */}
                <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6">
                  {(['email', 'phone'] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTab(t); setError(''); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                        tab === t
                          ? 'bg-[#c87941] text-white shadow-md'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {t === 'email' ? '✉ Email' : '📱 Phone'}
                    </button>
                  ))}
                </div>

                {/* Email Form */}
                {tab === 'email' && (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    {mode === 'signup' && (
                      <>
                        <div>
                          <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-2">Full Name</label>
                          <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                            className="w-full bg-white/5 border border-white/10 focus:border-[#c87941]/50 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-2">Phone</label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="+91 XXXXX XXXXX"
                            required
                            className="w-full bg-white/5 border border-white/10 focus:border-[#c87941]/50 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-colors"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="w-full bg-white/5 border border-white/10 focus:border-[#c87941]/50 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-2">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-white/5 border border-white/10 focus:border-[#c87941]/50 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-colors"
                      />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#c87941] hover:bg-[#b06734] text-white py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(200,121,65,0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      {loading ? 'Processing…' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                    </button>
                    {mode === 'signin' && (
                      <p className="text-xs text-white/30 text-center mt-2">
                        Dev mode: use any email + password <code className="text-[#c87941]">password123</code>
                      </p>
                    )}
                  </form>
                )}

                {/* Phone OTP Form */}
                {tab === 'phone' && (
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-2">Phone Number</label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="+91 XXXXX XXXXX"
                          required
                          className="flex-1 bg-white/5 border border-white/10 focus:border-[#c87941]/50 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={loading || otpSent}
                          className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/70 hover:text-white transition-all whitespace-nowrap disabled:opacity-40"
                        >
                          {otpSent ? '✓ Sent' : (loading ? '…' : 'Send OTP')}
                        </button>
                      </div>
                    </div>
                    {otpSent && (
                      <div>
                        <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-2">OTP Code</label>
                        <input
                          type="text"
                          value={otp}
                          onChange={e => setOtp(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          required
                          className="w-full bg-white/5 border border-white/10 focus:border-[#c87941]/50 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-colors tracking-widest text-center text-lg"
                        />
                        <p className="text-xs text-white/30 text-center mt-2">
                          Dev mode: use OTP <code className="text-[#c87941]">123456</code>
                        </p>
                      </div>
                    )}
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    {otpSent && (
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#c87941] hover:bg-[#b06734] text-white py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(200,121,65,0.3)] disabled:opacity-50 mt-2"
                      >
                        {loading ? 'Verifying…' : 'Verify & Sign In'}
                      </button>
                    )}
                  </form>
                )}

                {/* Mode toggle */}
                <p className="text-center text-sm text-white/40 mt-6">
                  {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => {
                      setMode(mode === 'signin' ? 'signup' : 'signin');
                      setError('');
                    }}
                    className="text-[#c87941] hover:underline font-medium"
                  >
                    {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
