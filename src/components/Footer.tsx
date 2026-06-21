export default function Footer() {
  return (
    <footer className="relative" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Copper gradient top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#c87941] to-transparent" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand column */}
          <div className="md:col-span-2">
            <span
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: '#c87941' }}
            >
              AETHER
            </span>
            <p className="mt-4 text-white/40 text-sm leading-relaxed max-w-xs">
              Sound, Redefined.
            </p>
            <p className="mt-2 text-white/25 text-xs leading-relaxed max-w-sm">
              Precision-engineered audio for those who hear the difference.
              Every detail, every frequency, every silence — intentional.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-5">
              Product
            </h4>
            <ul className="space-y-3">
              {['Features', 'Specs', 'Order'].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-sm text-white/40 hover:text-white/70 transition-colors duration-300"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-5">
              Company
            </h4>
            <ul className="space-y-3">
              {['About', 'Careers', 'Press'].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-sm text-white/40 hover:text-white/70 transition-colors duration-300"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} AETHER Audio. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Twitter', 'Instagram', 'LinkedIn'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs text-white/30 hover:text-white/60 transition-colors duration-300"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
