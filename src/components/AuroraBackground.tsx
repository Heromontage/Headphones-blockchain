'use client';

/**
 * AuroraBackground
 *
 * Renders several large, soft radial-gradient blobs that slowly drift
 * and pulse using CSS keyframe animations. The blobs use the site's
 * copper / teal / indigo palette and sit behind all page content.
 *
 * No canvas, no WebGL — pure CSS animations so performance is excellent.
 */

import { useEffect, useRef } from 'react';

export default function AuroraBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  /* Subtle mouse-parallax: blobs shift a few px toward the cursor */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = ((e.clientX - cx) / cx) * 40; // max ±40 px
      const dy = ((e.clientY - cy) / cy) * 30; // max ±30 px
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <>
      {/* Keyframe definitions injected once */}
      <style>{`
        @keyframes aurora-drift-1 {
          0%,100% { transform: translate(0%,   0%)   scale(1);    }
          33%      { transform: translate(12%, -15%)  scale(1.15); }
          66%      { transform: translate(-10%, 12%)  scale(0.85); }
        }
        @keyframes aurora-drift-2 {
          0%,100% { transform: translate(0%,   0%)   scale(1);    }
          40%      { transform: translate(-15%, 12%)  scale(1.2);  }
          70%      { transform: translate(10%, -10%)  scale(0.85); }
        }
        @keyframes aurora-drift-3 {
          0%,100% { transform: translate(0%,   0%)   scale(1);    }
          25%      { transform: translate(8%,  15%)   scale(1.15); }
          75%      { transform: translate(-12%,-10%)  scale(0.9);  }
        }
        @keyframes aurora-drift-4 {
          0%,100% { transform: translate(0%,   0%)   scale(1);    }
          50%      { transform: translate(-10%,-15%)  scale(1.2);  }
        }
        @keyframes aurora-pulse {
          0%,100% { opacity: 0.45; }
          50%      { opacity: 0.95; }
        }
      `}</style>

      {/* Wrapper — oversized so parallax shift never reveals edges */}
      <div
        ref={containerRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-5%',
          zIndex: 0,
          transition: 'transform 0.12s ease-out',
          willChange: 'transform',
          overflow: 'hidden',
        }}
      >
        {/* ── Blob 1: Copper — top-center ── */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '30%',
          width: '65vw',
          height: '65vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,121,65,0.38) 0%, rgba(200,121,65,0.12) 40%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'aurora-drift-1 12s ease-in-out infinite, aurora-pulse 6s ease-in-out infinite',
        }} />

        {/* ── Blob 2: Deep teal — left ── */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '-15%',
          width: '70vw',
          height: '70vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,90,90,0.45) 0%, rgba(26,90,90,0.15) 45%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'aurora-drift-2 14s ease-in-out infinite, aurora-pulse 7s ease-in-out infinite 1s',
        }} />

        {/* ── Blob 3: Indigo — right ── */}
        <div style={{
          position: 'absolute',
          top: '30%',
          right: '-12%',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(80,60,160,0.35) 0%, rgba(80,60,160,0.10) 45%, transparent 70%)',
          filter: 'blur(85px)',
          animation: 'aurora-drift-3 16s ease-in-out infinite, aurora-pulse 8s ease-in-out infinite 2s',
        }} />

        {/* ── Blob 4: Warm copper accent — bottom-center ── */}
        <div style={{
          position: 'absolute',
          bottom: '-5%',
          left: '25%',
          width: '55vw',
          height: '55vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(180,90,40,0.28) 0%, rgba(180,90,40,0.08) 50%, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'aurora-drift-4 13s ease-in-out infinite, aurora-pulse 6.5s ease-in-out infinite 1.5s',
        }} />

        {/* ── Vignette overlay — keeps edges dark and focused ── */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(10,10,15,0.75) 75%, rgba(10,10,15,0.95) 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    </>
  );
}
