'use client';

import { motion } from 'framer-motion';
import Grainient from './Grainient';
import TrueFocus from './TrueFocus';
import BorderGlow from './BorderGlow';

const features = [
  {
    title: 'Driver Technology',
    description:
      'Custom 50mm planar magnetic drivers deliver distortion-free audio across the full spectrum.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v18" />
        <path d="M8 7v10" />
        <path d="M4 10v4" />
        <path d="M16 5v14" />
        <path d="M20 9v6" />
      </svg>
    ),
  },
  {
    title: 'Premium Materials',
    description:
      'Aircraft-grade aluminum frame with hand-stitched Italian leather cushions.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    title: 'Adaptive EQ',
    description:
      'AI-powered sound profiles that adapt to your ear shape and environment.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="14" width="3" height="7" rx="1" />
        <rect x="7.5" y="10" width="3" height="11" rx="1" />
        <rect x="12" y="6" width="3" height="15" rx="1" />
        <rect x="16.5" y="12" width="3" height="9" rx="1" />
      </svg>
    ),
  },
  {
    title: 'Seamless Connect',
    description:
      'Multipoint Bluetooth 5.3 with lossless codec support. Switch devices instantly.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11" />
      </svg>
    ),
  },
  {
    title: 'Voice Engine',
    description:
      'Bone-conduction voice isolation for crystal-clear calls in any environment.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    title: 'Find My',
    description:
      'Built-in UWB chip for precision finding. Never lose your headphones again.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

function FeatureCard({ feature, index }: { feature: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.6,
        ease: 'easeOut',
        delay: index * 0.1,
      }}
      className="group h-full transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer"
    >
      <BorderGlow
        edgeSensitivity={30}
        glowColor="25 60 50"
        backgroundColor="rgba(0, 0, 0, 0.4)"
        borderRadius={16}
        glowRadius={30}
        glowIntensity={1.2}
        coneSpread={25}
        animated={true}
        colors={['#c87941', '#e09a5f', '#ffb875']}
        fillOpacity={0.4}
        className="h-full backdrop-blur-xl"
      >
        <div className="p-8 h-full">
          {/* Content */}
          <div className="relative z-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#c87941]/20 to-transparent border border-[#c87941]/30 text-[#c87941] shadow-[0_0_20px_rgba(200,121,65,0.1)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 transition-colors duration-300 group-hover:text-[#e09a5f]">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-white/60">
              {feature.description}
            </p>
          </div>
        </div>
      </BorderGlow>
    </motion.div>
  );
}

export default function Projects() {
  return (
    <section
      id="features"
      className="relative bg-[#0a0a0f] py-32 px-6 md:px-12 lg:px-20 overflow-hidden"
    >
      {/* Background Grainient */}
      <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen">
        <Grainient
          color1="#3B82F6"
          color2="#5227FF"
          color3="#B497CF"
          timeSpeed={0.15}
          colorBalance={0.1}
          warpStrength={1.5}
          warpFrequency={3.0}
          warpSpeed={1.5}
          warpAmplitude={60.0}
          blendSoftness={0.15}
          grainAmount={0.08}
          grainScale={1.5}
          contrast={1.3}
          saturation={1.1}
        />
      </div>

      {/* Section header */}
      <div className="relative z-10 mx-auto max-w-7xl mb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-[2px] bg-[#c87941] mb-8" />
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-gradient-copper">
            Crafted Details
          </h2>
          <div className="mt-10 mb-6">
            <TrueFocus 
              sentence="Absolute Audio Perfection"
              manualMode={false}
              blurAmount={4}
              borderColor="#c87941"
              glowColor="rgba(200, 121, 65, 0.6)"
              animationDuration={1}
              pauseBetweenAnimations={0.5}
            />
          </div>
        </motion.div>
      </div>

      {/* Feature grid */}
      <div className="relative z-10 mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <FeatureCard key={i} feature={feature} index={i} />
        ))}
      </div>
    </section>
  );
}
