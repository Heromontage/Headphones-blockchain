'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface GlassHeroProps {
  title: string;
  label?: string;
  subtitle?: string;
}

const LENS_SIZE = 150;

export default function GlassHero({ title, label, subtitle }: GlassHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  /* Smooth mouse tracking with lerp */
  const targetRef = useRef({ x: -400, y: -400 });
  const currentRef = useRef({ x: -400, y: -400 });
  const [lensStyle, setLensStyle] = useState<React.CSSProperties>({
    transform: 'translate(-400px, -400px)',
    opacity: 0,
  });

  const onMouseMove = useCallback((e: MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    targetRef.current = {
      x: e.clientX - rect.left - LENS_SIZE / 2,
      y: e.clientY - rect.top - LENS_SIZE / 2,
    };
  }, []);

  const onMouseLeave = useCallback(() => {
    targetRef.current = { x: -400, y: -400 };
  }, []);

  /* rAF lerp loop */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    let running = true;
    const tick = () => {
      if (!running) return;
      const t = targetRef.current;
      const c = currentRef.current;
      const lerpFactor = 0.1;

      c.x += (t.x - c.x) * lerpFactor;
      c.y += (t.y - c.y) * lerpFactor;

      const isVisible = t.x > -300;

      setLensStyle({
        transform: `translate(${c.x}px, ${c.y}px)`,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [onMouseMove, onMouseLeave]);

  return (
    <>
      {/* SVG filter — refraction displacement map */}
      <svg width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }}>
        <defs>
          <filter id="glass-lens-filter" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018 0.018"
              numOctaves="3"
              seed="8"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="14"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            {/* Subtle chromatic aberration: shift red channel slightly */}
            <feColorMatrix type="saturate" values="1.15" in="displaced" />
          </filter>
        </defs>
      </svg>

      <div
        ref={containerRef}
        className="relative w-full flex flex-col items-center justify-center select-none"
        style={{ minHeight: '180px', cursor: 'none' }}
      >
        {/* Heading text */}
        <h1
          className="relative z-10 text-7xl md:text-9xl font-bold tracking-[-0.04em] text-white text-center pointer-events-none"
          style={{
            textShadow:
              '0 0 80px rgba(200,121,65,0.45), 0 2px 30px rgba(0,0,0,0.7)',
          }}
        >
          {title}
        </h1>

        {/* Glass lens — sits on top, applies the SVG displacement to whatever is below */}
        <div
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: LENS_SIZE,
            height: LENS_SIZE,
            ...lensStyle,
          }}
        >
          {/* Refraction layer — applies displacement filter to a clipped crop of the heading */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              overflow: 'hidden',
              filter: 'url(#glass-lens-filter)',
              backdropFilter: 'blur(0.5px) brightness(1.08) saturate(1.3)',
            }}
          />

          {/* Glass body — rim + specular highlight */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.18) 0%, rgba(200,121,65,0.06) 35%, transparent 65%)',
              border: '1px solid rgba(200,121,65,0.4)',
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.15)',
            }}
          />

          {/* Custom cursor dot at center */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'rgba(200,121,65,0.6)',
            }}
          />
        </div>
      </div>
    </>
  );
}
