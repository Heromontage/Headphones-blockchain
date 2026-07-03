'use client';

import { useTransform, motion, type MotionValue } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Alignment = 'left' | 'center' | 'right';

interface OverlayBlockProps {
  scrollYProgress: MotionValue<number>;
  /** Scroll fraction where fade-in begins (opacity 0) */
  fadeInStart: number;
  /** Scroll fraction where fade-in ends (opacity 1) */
  fadeInEnd: number;
  /** Scroll fraction where fade-out begins (opacity 1) */
  fadeOutStart: number;
  /** Scroll fraction where fade-out ends (opacity 0) */
  fadeOutEnd: number;
  alignment: Alignment;
  title: string;
  description?: string;
  /** Optional small copper label rendered above the title */
  label?: string;
  /** Render the title at hero scale */
  hero?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Alignment helper                                                   */
/* ------------------------------------------------------------------ */

const alignmentClasses: Record<Alignment, string> = {
  left: 'items-start text-left left-8 md:left-16 right-auto',
  center: 'items-center text-center left-1/2 -translate-x-1/2',
  right: 'items-end text-right right-8 md:right-16 left-auto',
};

/* ------------------------------------------------------------------ */
/*  OverlayBlock                                                       */
/* ------------------------------------------------------------------ */

function OverlayBlock({
  scrollYProgress,
  fadeInStart,
  fadeInEnd,
  fadeOutStart,
  fadeOutEnd,
  alignment,
  title,
  description,
  label,
  hero = false,
}: OverlayBlockProps) {
  /*
   * Opacity ramp: 0 → 1 during [fadeInStart, fadeInEnd]
   *               1 → 1 during [fadeInEnd, fadeOutStart]
   *               1 → 0 during [fadeOutStart, fadeOutEnd]
   */
  const opacity = useTransform(
    scrollYProgress,
    [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd],
    [0, 1, 1, 0],
  );

  /* Parallax Y: slides up 50 px → 0 px during fade-in, then 0 → -30 px during fade-out */
  const y = useTransform(
    scrollYProgress,
    [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd],
    [50, 0, 0, -30],
  );

  /* Combine vertical centering (-50%) with parallax y offset */
  const translateY = useTransform(y, (v) => `calc(-50% + ${v}px)`);

  return (
    <motion.div
      className={`absolute top-1/2 z-10 flex max-w-xl flex-col gap-4 ${alignmentClasses[alignment]}`}
      style={{ opacity, translateY, willChange: 'opacity, transform' }}
    >
      {/* Copper label */}
      {label && (
        <span
          className="text-xl tracking-widest uppercase md:text-xl"
          style={{ color: '#c87941' }}
        >
          {label}
        </span>
      )}

      {/* Title */}
      <h2
        className={
          hero
            ? 'font-bold leading-none tracking-[-0.04em] text-white text-7xl md:text-9xl'
            : 'font-bold leading-tight text-white text-4xl md:text-6xl'
        }
        style={{
          textShadow: '0 2px 30px rgba(0,0,0,0.8), 0 0px 8px rgba(0,0,0,0.5)',
        }}
      >
        {title}
      </h2>

      {/* Description */}
      {description && (
        <p
          className="max-w-md text-base leading-relaxed text-white/70 md:text-lg"
          style={{
            textShadow: '0 1px 12px rgba(0,0,0,0.6)',
          }}
        >
          {description}
        </p>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Overlay (default export)                                           */
/* ------------------------------------------------------------------ */

export default function Overlay({ scrollYProgress }: { scrollYProgress?: MotionValue<number> }) {
  if (!scrollYProgress) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* -------- Hero: 0 % – 15 % -------- */}
      <OverlayBlock
        scrollYProgress={scrollYProgress}
        fadeInStart={0}
        fadeInEnd={0.05}
        fadeOutStart={0.1}
        fadeOutEnd={0.15}
        alignment="center"
        title="AETHER"
        label="Engineered for Silence"
        hero
      />

      {/* -------- Feature 1: 25 % – 40 % -------- */}
      <OverlayBlock
        scrollYProgress={scrollYProgress}
        fadeInStart={0.25}
        fadeInEnd={0.3}
        fadeOutStart={0.35}
        fadeOutEnd={0.4}
        alignment="left"
        title="Active Noise Cancellation"
        description="Adaptive 6-mic array isolates your world. 48dB of silence, engineered to perfection."
      />

      {/* -------- Feature 2: 50 % – 65 % -------- */}
      <OverlayBlock
        scrollYProgress={scrollYProgress}
        fadeInStart={0.5}
        fadeInEnd={0.55}
        fadeOutStart={0.6}
        fadeOutEnd={0.65}
        alignment="right"
        title="60-Hour Battery"
        description="Three days of continuous playback. Quick charge: 10 minutes for 5 hours."
      />

      {/* -------- Feature 3: 75 % – 90 % -------- */}
      <OverlayBlock
        scrollYProgress={scrollYProgress}
        fadeInStart={0.75}
        fadeInEnd={0.8}
        fadeOutStart={0.85}
        fadeOutEnd={0.9}
        alignment="center"
        title="Spatial Audio"
        description="Head-tracked 360° soundstage. Feel every instrument, every whisper, every beat."
      />
    </div>
  );
}
