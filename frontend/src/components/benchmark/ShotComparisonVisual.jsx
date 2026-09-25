import { motion } from 'framer-motion'
import { ArrowRight, Layers, Sparkles } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const SHOT_STAGES = [
  {
    shot: 0,
    title: '0 SHOT',
    label: 'Zero-Shot Baseline',
    dots: 0,
    text: 'No examples',
    sub: 'Biomedical text prompt only',
  },
  {
    shot: 6,
    title: '6 SHOT',
    label: 'Few-Shot Bank',
    dots: 6,
    text: '6 visual exemplars',
    sub: 'Standard Micro-OD prompt bank',
  },
]

/**
 * ShotComparisonVisual — Conceptual visual diagram representing 0 vs 6 progression
 */
export default function ShotComparisonVisual({ selectedShot = 0 }) {
  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden space-y-6">
      {/* Ambient crimson highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-crimson/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-crimson" />
            <h3 className="text-lg font-heading font-bold text-white tracking-tight">
              From Zero-Shot to Few-Shot
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Visual progression of contextual exemplars provided to guide cellular detection.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
          <Sparkles size={13} className="text-crimson" />
          <span>Prompt In-Context Scaling</span>
        </div>
      </div>

      {/* Pipeline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        {SHOT_STAGES.map((st, idx) => {
          const isSelected = selectedShot === st.shot
          const isLast = idx === SHOT_STAGES.length - 1

          return (
            <motion.div
              key={st.shot}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              className={`p-5 rounded-xl transition-all duration-200 flex flex-col justify-between h-full relative ${
                isSelected
                  ? 'bg-crimson/15 border-2 border-crimson shadow-[0_0_20px_rgba(255,42,85,0.2)]'
                  : 'bg-black/50 border border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-mono font-extrabold text-white tracking-wider">
                    {st.title}
                  </span>
                  <span className="text-[10px] font-mono text-crimson font-semibold uppercase">
                    {st.label}
                  </span>
                </div>

                {/* Dot constellation indicator */}
                <div className="h-10 rounded-lg bg-black/60 border border-white/[0.06] flex items-center justify-center gap-1.5 px-3 mb-3">
                  {st.dots === 0 ? (
                    <span className="text-[10px] font-mono text-text-muted italic">
                      No examples
                    </span>
                  ) : (
                    Array.from({ length: st.dots }).map((_, dIdx) => (
                      <span
                        key={dIdx}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          isSelected
                            ? 'bg-crimson shadow-[0_0_8px_#FF2A55]'
                            : 'bg-white/80'
                        }`}
                      />
                    ))
                  )}
                </div>

                <div className="text-xs font-mono font-bold text-white mb-0.5">
                  {st.text}
                </div>
                <p className="text-[11px] font-sans text-text-secondary">
                  {st.sub}
                </p>
              </div>

              {/* Bottom active marker */}
              <div className="mt-4 pt-2.5 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono">
                <span className={isSelected ? 'text-white font-bold' : 'text-text-muted'}>
                  {isSelected ? 'ACTIVE SELECTION' : `CONFIG ${idx + 1}`}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}
