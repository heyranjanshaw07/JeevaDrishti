import { motion } from 'framer-motion'
import { Sparkles, Check } from 'lucide-react'

const SHOT_OPTIONS = [
  {
    shot: 0,
    label: '0 SHOT',
    sublabel: 'Zero-shot baseline',
    desc: 'No visual examples',
    detail: 'Evaluates zero-shot biomedical text prompting without prior image exemplars.',
  },
  {
    shot: 1,
    label: '1 SHOT',
    sublabel: 'Single visual exemplar',
    desc: '1 visual example',
    detail: 'Supplies a single reference cell exemplar per class to calibrate cross-attention.',
  },
  {
    shot: 3,
    label: '3 SHOT',
    sublabel: 'Triad visual calibration',
    desc: '3 visual examples',
    detail: 'Three representative exemplars capturing morphological variance within classes.',
  },
  {
    shot: 6,
    label: '6 SHOT',
    sublabel: 'Standardized Micro-OD bank',
    desc: '6 visual examples',
    detail: 'Full 6-exemplar reference set per class for maximum in-context transfer.',
  },
]

/**
 * ShotExperimentSelector — 4 selectable shot configuration cards
 */
export default function ShotExperimentSelector({ selectedShot, onSelectShot }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono font-semibold tracking-wider text-text-muted uppercase">
          Shot Configuration
        </span>
        <span className="text-xs sm:text-sm font-mono text-crimson font-medium">
          Selected: {selectedShot} Shot
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SHOT_OPTIONS.map((opt) => {
          const isSelected = selectedShot === opt.shot

          return (
            <motion.button
              key={opt.shot}
              type="button"
              onClick={() => onSelectShot(opt.shot)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-crimson/15 border-2 border-crimson shadow-[0_0_24px_rgba(255,42,85,0.25)]'
                  : 'bg-black/50 border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]'
              }`}
            >
              {/* Subtle top corner gradient */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-crimson/20 rounded-full blur-xl pointer-events-none" />
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-base font-mono font-extrabold tracking-wider ${
                      isSelected ? 'text-white' : 'text-white/80'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors ${
                      isSelected
                        ? 'bg-crimson text-white shadow-[0_0_8px_#FF2A55]'
                        : 'border border-white/20 text-transparent'
                    }`}
                  >
                    <Check size={12} strokeWidth={3} />
                  </div>
                </div>

                <div className="text-sm font-mono font-semibold text-crimson mb-1">
                  {opt.desc}
                </div>

                <p className="text-xs sm:text-sm font-sans text-text-secondary leading-relaxed">
                  {opt.detail}
                </p>
              </div>

              {/* Status indicator */}
              <div className="mt-4 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className={isSelected ? 'text-white font-medium' : 'text-text-muted'}>
                  {opt.sublabel}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
