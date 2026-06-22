import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BlurText from '@/components/BlurText';
import BlurIn from '@/components/BlurIn';
import RotatingText from '@/components/RotatingText';
import ScrollStack, { ScrollStackItem } from '@/components/ScrollStack';
import Prism from '@/components/Prism';

export default function SpecsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      <Navbar />

      {/* Prism WebGL Background */}
      <div className="absolute inset-0 z-0 opacity-60">
        <Prism
          animationType="rotate"
          timeScale={0.2}
          height={4.0}
          baseWidth={6.0}
          scale={3.6}
          hueShift={0}
          colorFrequency={1}
          noise={0.5}
          glow={1}
        />
      </div>

      <div className="relative z-10 pt-24 pb-8 px-6 max-w-7xl mx-auto flex flex-col items-center">

        {/* ── Copper label ── */}
        <BlurIn delay={0} direction="top" className="relative z-20">
          <p
            className="text-sm font-medium tracking-[0.4em] uppercase mb-6"
            style={{ color: '#c87941' }}
          >
            Technical Excellence
          </p>
        </BlurIn>

        {/* ── Main heading ── */}
        <BlurText
          text="FULL SPECS"
          animateBy="words"
          direction="top"
          delay={180}
          stepDuration={0.5}
          className="text-7xl md:text-9xl font-bold tracking-[-0.04em] text-white text-center justify-center mb-2"
        />

        {/* ── Promo rotating line ── */}
        <BlurIn delay={320} direction="bottom" className="relative z-20 mt-6 mb-2">
          <div className="flex items-center justify-center gap-3 text-lg md:text-xl font-light tracking-wide flex-wrap">
            <span className="text-white/60">Engineered for</span>
            <RotatingText
              texts={['Pure Silence', 'Perfect Sound', '60Hr Battery', 'Spatial Audio', 'Zero Distortion']}
              mainClassName="px-3 py-1 rounded-lg font-semibold overflow-hidden"
              style={{ backgroundColor: 'rgba(200,121,65,0.15)', color: '#e6a96e', border: '1px solid rgba(200,121,65,0.3)' }}
              splitBy="characters"
              staggerFrom="last"
              staggerDuration={0.03}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-120%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              rotationInterval={2200}
              splitLevelClassName="overflow-hidden pb-0.5"
            />
          </div>
        </BlurIn>

        {/* ── Subtitle ── */}
        <BlurIn delay={500} direction="bottom" className="relative z-20 mt-6 mb-16">
          <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed text-center">
            Every component chosen with obsessive precision. Every measurement validated under real-world conditions.
          </p>
        </BlurIn>

        {/* ── Spec Cards Grid ── */}
        <div className="w-full max-w-4xl relative z-20 mx-auto mt-8">
          <ScrollStack itemDistance={60} itemStackDistance={40} blurAmount={2} stackPosition="40%">
            {/* Spec Group 1 — Acoustics */}
            <ScrollStackItem>
              <div className="backdrop-blur-xl bg-[#111116]/80 border border-white/[0.08] rounded-3xl p-10 hover:border-[#c87941]/30 transition-colors duration-500 w-full shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                <h3 className="text-xl font-medium text-[#c87941] uppercase tracking-widest mb-6">Acoustics</h3>
                <ul className="space-y-5">
                  <li className="flex justify-between border-b border-white/10 pb-4">
                    <span className="text-white/50">Driver Type</span>
                    <span className="font-semibold text-right">50mm Custom Planar Magnetic</span>
                  </li>
                  <li className="flex justify-between border-b border-white/10 pb-4">
                    <span className="text-white/50">Frequency Response</span>
                    <span className="font-semibold text-right">5Hz – 50,000Hz</span>
                  </li>
                  <li className="flex justify-between border-b border-white/10 pb-4">
                    <span className="text-white/50">Impedance</span>
                    <span className="font-semibold text-right">32 Ohms</span>
                  </li>
                  <li className="flex justify-between pb-2">
                    <span className="text-white/50">THD</span>
                    <span className="font-semibold text-right">&lt; 0.1% @ 100dB</span>
                  </li>
                </ul>
              </div>
            </ScrollStackItem>

            {/* Spec Group 2 — Power & Connectivity */}
            <ScrollStackItem>
              <div className="backdrop-blur-xl bg-[#111116]/80 border border-white/[0.08] rounded-3xl p-10 hover:border-[#c87941]/30 transition-colors duration-500 w-full shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                <h3 className="text-xl font-medium text-[#c87941] uppercase tracking-widest mb-6">Power &amp; Connectivity</h3>
                <ul className="space-y-5">
                  <li className="flex justify-between border-b border-white/10 pb-4">
                    <span className="text-white/50">Battery Life</span>
                    <span className="font-semibold text-right">Up to 60 Hours (ANC On)</span>
                  </li>
                  <li className="flex justify-between border-b border-white/10 pb-4">
                    <span className="text-white/50">Fast Charge</span>
                    <span className="font-semibold text-right">10 Mins = 5 Hours Playback</span>
                  </li>
                  <li className="flex justify-between border-b border-white/10 pb-4">
                    <span className="text-white/50">Bluetooth</span>
                    <span className="font-semibold text-right">Version 5.3 (Multipoint)</span>
                  </li>
                  <li className="flex justify-between pb-2">
                    <span className="text-white/50">Supported Codecs</span>
                    <span className="font-semibold text-right">LDAC, aptX Adaptive, AAC, SBC</span>
                  </li>
                </ul>
              </div>
            </ScrollStackItem>

            {/* Spec Group 3 — Physical & Materials */}
            <ScrollStackItem>
              <div className="backdrop-blur-xl bg-[#111116]/80 border border-white/[0.08] rounded-3xl p-10 hover:border-[#c87941]/30 transition-colors duration-500 w-full shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                <h3 className="text-xl font-medium text-[#c87941] uppercase tracking-widest mb-6">Physical &amp; Materials</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div>
                    <p className="text-white/50 mb-2">Weight</p>
                    <p className="font-semibold text-2xl">310g</p>
                  </div>
                  <div>
                    <p className="text-white/50 mb-2">Frame Material</p>
                    <p className="font-semibold text-2xl">Aerospace Aluminum</p>
                  </div>
                  <div>
                    <p className="text-white/50 mb-2">Ear Cushions</p>
                    <p className="font-semibold text-2xl">Hand-stitched Italian Leather</p>
                  </div>
                </div>
              </div>
            </ScrollStackItem>
          </ScrollStack>
        </div>
      </div>

      <Footer />
    </main>
  );
}
