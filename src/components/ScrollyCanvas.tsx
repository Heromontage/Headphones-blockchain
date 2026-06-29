'use client';

import { useRef, useEffect, useState, useCallback, Children, cloneElement, isValidElement } from 'react';
import { useScroll, useTransform, useMotionValueEvent, motion, AnimatePresence } from 'framer-motion';
import FluidGlass from './FluidGlass';

const FRAME_COUNT = 151;
const IMAGE_PATH = '/sequence/frame_';
const IMAGE_SUFFIX = '_delay-0.066s.webp';

function getFrameSrc(index: number): string {
  return `${IMAGE_PATH}${index.toString().padStart(3, '0')}${IMAGE_SUFFIX}`;
}

/* ------------------------------------------------------------------ */
/*  Loading Screen                                                     */
/* ------------------------------------------------------------------ */

function LoadingScreen({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);

  return (
    <motion.div
      key="loader"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: '#0a0a0f' }}
    >
      {/* Brand */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-10 text-4xl font-light tracking-[0.35em] select-none md:text-5xl"
        style={{ color: '#c87941' }}
      >
        AETHER
      </motion.h1>

      {/* Progress bar track */}
      <div className="relative h-[2px] w-56 overflow-hidden rounded-full bg-white/10 md:w-72">
        {/* Fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #c87941, #e6a96e)',
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      </div>

      {/* Percentage */}
      <p
        className="mt-5 text-xs font-medium tracking-[0.2em] tabular-nums"
        style={{ color: '#c87941' }}
      >
        {pct}%
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ScrollyCanvas({ children }: { children?: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mutable refs that the render loop reads — no re‑renders needed.
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const rafIdRef = useRef(0);

  const [loadedCount, setLoadedCount] = useState(0);
  const [allLoaded, setAllLoaded] = useState(false);

  /* ---- Scroll mapping ---- */
  const { scrollYProgress } = useScroll({ target: sectionRef });
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, FRAME_COUNT - 1]);

  useMotionValueEvent(frameIndex, 'change', (latest) => {
    currentFrameRef.current = Math.round(latest);
  });

  /* ---- Cover‑fit draw helper ---- */
  const drawCover = useCallback(
    (ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (iw === 0 || ih === 0 || cw === 0 || ch === 0) return;

      const imgAspect = iw / ih;
      const canvasAspect = cw / ch;

      let sx: number, sy: number, sw: number, sh: number;

      if (imgAspect > canvasAspect) {
        // Image is wider → crop sides
        sh = ih;
        sw = ih * canvasAspect;
        sx = (iw - sw) / 2;
        sy = 0;
      } else {
        // Image is taller → crop top/bottom
        sw = iw;
        sh = iw / canvasAspect;
        sx = 0;
        sy = (ih - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    },
    [],
  );

  /* ---- Preload all frames ---- */
  useEffect(() => {
    let cancelled = false;
    const images: HTMLImageElement[] = new Array(FRAME_COUNT);
    let loaded = 0;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = getFrameSrc(i);

      img.onload = () => {
        if (cancelled) return;
        loaded += 1;
        setLoadedCount(loaded);
        if (loaded === FRAME_COUNT) {
          setAllLoaded(true);
        }
      };

      img.onerror = () => {
        if (cancelled) return;
        // Count errors as "loaded" so the bar still completes.
        loaded += 1;
        setLoadedCount(loaded);
        if (loaded === FRAME_COUNT) {
          setAllLoaded(true);
        }
      };

      images[i] = img;
    }

    imagesRef.current = images;

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- Canvas render loop + resize observer ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* Sizing helper — retina‑aware */
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();

    /* Render loop */
    let running = true;

    const render = () => {
      if (!running) return;

      const images = imagesRef.current;
      const idx = currentFrameRef.current;
      const img = images[idx];

      if (img && img.complete && img.naturalWidth > 0) {
        const rect = container.getBoundingClientRect();
        drawCover(ctx, img, rect.width, rect.height);
      }

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    /* Resize observer */
    const ro = new ResizeObserver(() => {
      updateSize();
    });
    ro.observe(container);

    return () => {
      running = false;
      cancelAnimationFrame(rafIdRef.current);
      ro.disconnect();
    };
  }, [drawCover]);

  /* ---- Render ---- */
  const progress = loadedCount / FRAME_COUNT;

  return (
    <>
      {/* Loading overlay */}
      <AnimatePresence>
        {!allLoaded && <LoadingScreen progress={progress} />}
      </AnimatePresence>

      <section ref={sectionRef} className="relative" style={{ height: '600vh' }}>
        <div
          ref={containerRef}
          className="sticky top-0 h-screen w-full overflow-hidden"
          style={{ willChange: 'transform' }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          />

          <FluidGlass 
            htmlCanvasRef={canvasRef}
            lensProps={{
              scale: 0.25,
              ior: 1.1,
              thickness: 2,
              chromaticAberration: 0.2,
            }}
          />

          {/* Overlay children sit on top of the canvas and the fluid glass */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {Children.map(children, (child) =>
              isValidElement(child)
                ? cloneElement(child as React.ReactElement<{ scrollYProgress: typeof scrollYProgress }>, { scrollYProgress })
                : child
            )}
          </div>
        </div>
      </section>
    </>
  );
}
