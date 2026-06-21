'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import ShinyText from './ShinyText';

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Specs', href: '/specs' },
  { label: 'Order', href: '/#order' },
];

export default function Navbar() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-transparent border-b border-transparent"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
        {/* Wordmark */}
        <a
          href="#"
          className="text-sm font-bold uppercase tracking-widest"
        >
          <ShinyText
            text="AETHER"
            speed={3}
            color="#c87941"
            shineColor="#ffffff"
            spread={100}
          />
        </a>

        {/* Nav Links */}
        <ul className="flex items-center gap-8">
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
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </motion.nav>
  );
}
