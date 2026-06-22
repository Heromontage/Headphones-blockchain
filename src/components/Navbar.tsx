'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import ShinyText from './ShinyText';
import AuthModal from './AuthModal';

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Specs', href: '/specs' },
  { label: 'Order', href: '/order' },
];

export default function Navbar() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'signin' | 'signup' }>({
    open: false,
    mode: 'signin',
  });
  const { data: session, status } = useSession();

  const openSignIn = () => setAuthModal({ open: true, mode: 'signin' });
  const openSignUp = () => setAuthModal({ open: true, mode: 'signup' });
  const closeModal = () => setAuthModal((m) => ({ ...m, open: false }));

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-transparent border-b border-transparent"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          {/* Wordmark */}
          <a href="/" className="text-sm font-bold uppercase tracking-widest">
            <ShinyText
              text="AETHER"
              speed={3}
              color="#c87941"
              shineColor="#ffffff"
              spread={100}
            />
          </a>

          {/* Nav Links & Auth */}
          <div className="flex items-center gap-12">
            <ul className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="relative text-sm tracking-wide text-white/60 hover:text-white transition-colors duration-300 py-1"
                    onMouseEnter={() => setHoveredLink(link.label)}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    {link.label}
                    {hoveredLink === link.label && (
                      <motion.span
                        layoutId="navbar-underline"
                        className="absolute left-0 right-0 -bottom-0.5 h-px"
                        style={{ backgroundColor: '#c87941' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4">
              {status === 'loading' ? (
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
              ) : session ? (
                <div className="flex items-center gap-4">
                  <Link href="/profile" className="flex items-center gap-2 group">
                    <div className="w-9 h-9 rounded-full bg-[#c87941]/20 border border-[#c87941]/50 flex items-center justify-center text-sm font-semibold text-[#c87941] group-hover:bg-[#c87941] group-hover:text-white transition-all duration-300 shadow-[0_0_12px_rgba(200,121,65,0.2)]">
                      {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm tracking-wide text-white/70 group-hover:text-white transition-colors hidden md:inline">
                      {session.user?.name?.split(' ')[0] || 'Profile'}
                    </span>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="text-sm tracking-wide text-white/40 hover:text-white transition-colors duration-300"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={openSignIn}
                    className="text-sm tracking-wide text-white/60 hover:text-white transition-colors duration-300"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={openSignUp}
                    className="text-sm tracking-wide bg-[#c87941]/10 text-[#c87941] border border-[#c87941]/30 hover:bg-[#c87941]/20 hover:border-[#c87941]/60 px-4 py-2 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(200,121,65,0.1)] hover:shadow-[0_0_20px_rgba(200,121,65,0.3)]"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      <AuthModal
        isOpen={authModal.open}
        onClose={closeModal}
        defaultMode={authModal.mode}
      />
    </>
  );
}
