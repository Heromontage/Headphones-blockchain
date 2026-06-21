'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface BlurInProps {
  children: React.ReactNode;
  /** Extra Tailwind / style classes on the wrapper */
  className?: string;
  /** Delay before this element starts animating (ms) */
  delay?: number;
  /** 'top' slides down into place, 'bottom' slides up */
  direction?: 'top' | 'bottom';
  /** Duration of the animation in seconds */
  duration?: number;
  /** IntersectionObserver threshold */
  threshold?: number;
}

export default function BlurIn({
  children,
  className = '',
  delay = 0,
  direction = 'bottom',
  duration = 0.6,
  threshold = 0.15,
}: BlurInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current!);
        }
      },
      { threshold },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  const yOffset = direction === 'top' ? -40 : 40;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: yOffset, filter: 'blur(10px)' }}
      animate={
        inView
          ? { opacity: 1, y: 0, filter: 'blur(0px)' }
          : { opacity: 0, y: yOffset, filter: 'blur(10px)' }
      }
      transition={{
        duration,
        delay: delay / 1000,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}
