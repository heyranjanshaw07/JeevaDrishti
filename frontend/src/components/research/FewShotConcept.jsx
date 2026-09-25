import { motion } from 'framer-motion'
import { Layers, Sparkles } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const SHOT_LEVELS = [
  {
    shot: '0 Shot',
    spec: 'No visual examples',
    desc: 'Pure language conditioning based on phenotypic text descriptions.',
    dots: 0,
  },
  {
    shot: '6 Shot',
    spec: '6 visual examples',
    desc: 'Standardized reference bank for comprehensive visual guidance.',
    dots: 6,
  },
]

/**
 * FewShotConcept — Conceptual progression card explaining how visual exemplars guide morphological inference
 */
export default function FewShotConcept() {
  return (
    <GlassCard className="p-6 sm:p-8 border-white/[0.08] relative overflow-hidden space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-crimson" />
          <h3 className="text-xl font-heading font-bold text-white tracking-tight">
            From Zero-Shot to Few-Shot
          </h3>
        </div>
        <p className="text-sm text-text-secondary font-sans">
          How contextual prompt images provide an inductive bias for morphological cellular inference.
        </p>
      </div>

      {/* Shot Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SHOT_LEVELS.map((item, idx) => (
          <motion.div
            key={item.shot}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            className="p-4 sm:p-5 rounded-xl bg-black/50 border border-white/[0.06] flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono font-extrabold text-white">
                  {item.shot}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
              </div>

              {/* Dot Visualization */}
              <div className="h-7 rounded-lg bg-black/50 border border-white/[0.04] flex items-center gap-1.5 px-2.5 mb-2.5">
                {item.dots === 0 ? (
                  <span className="text-[10px] font-mono text-text-muted italic">
                    No visual examples
                  </span>
                ) : (
                  Array.from({ length: item.dots }).map((_, dIdx) => (
                    <span
                      key={dIdx}
                      className="w-2 h-2 rounded-full bg-crimson shadow-[0_0_4px_#FF2A55]"
                    />
                  ))
                )}
              </div>

              <div className="text-xs font-mono font-bold text-crimson mb-1">
                {item.spec}
              </div>

              <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
                {item.desc}
              </p>
            </div>

            <div className="pt-2 border-t border-white/[0.04] text-[9px] font-mono text-text-muted">
              CONFIGURATION: IN-CONTEXT PROMPT
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}
