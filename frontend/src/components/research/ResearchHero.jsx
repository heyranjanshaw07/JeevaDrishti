import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Eye, Layers } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const SHOT_CONCEPTS = [
  {
    tag: 'ZERO-SHOT',
    label: 'Semantic Text Prompt',
    desc: 'Unconditioned foundation inference without prior optical exemplars.',
    dots: 0,
  },
  {
    tag: '6-SHOT',
    label: 'Standard Micro-OD Bank',
    desc: 'Comprehensive exemplar reference set maximizing in-context transfer.',
    dots: 6,
  },
]

/**
 * ResearchHero — Large premium research hero section
 */
export default function ResearchHero() {
  return (
    <GlassCard className="p-6 sm:p-10 border-white/[0.08] relative overflow-hidden" glow>
      {/* Background ambient crimson glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-crimson/[0.07] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-8">
        {/* Top Tag & Main Heading */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson/15 border border-crimson/35 text-[11px] font-mono text-crimson font-bold">
            <Sparkles size={12} />
            <span>AI MICROSCOPY RESEARCH LABORATORY</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight leading-tight">
            See Deeper. Understand Life.
          </h2>

          <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans max-w-2xl">
            JeevaDrishti explores how vision-language models can adapt to microscopy tasks using visual examples.
          </p>
        </div>

        {/* 2 Shot Concepts Progression */}
        <div className="space-y-3 pt-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block">
            Visual In-Context Adaptation Progression
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SHOT_CONCEPTS.map((concept, idx) => (
              <motion.div
                key={concept.tag}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                className="p-5 rounded-xl bg-black/60 border border-white/[0.08] hover:border-crimson/40 transition-colors flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-extrabold text-white tracking-wider">
                      {concept.tag}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
                  </div>

                  {/* Dot visualization */}
                  <div className="h-8 rounded-lg bg-black/40 border border-white/[0.05] flex items-center gap-1.5 px-3 mb-3">
                    {concept.dots === 0 ? (
                      <span className="text-[10px] font-mono text-text-muted italic">
                        0 visual examples
                      </span>
                    ) : (
                      Array.from({ length: concept.dots }).map((_, dIdx) => (
                        <span
                          key={dIdx}
                          className="w-2 h-2 rounded-full bg-crimson shadow-[0_0_4px_#FF2A55]"
                        />
                      ))
                    )}
                  </div>

                  <h3 className="text-xs font-mono font-bold text-white mb-1">
                    {concept.label}
                  </h3>

                  <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
                    {concept.desc}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-white/[0.05] flex items-center justify-between text-[9px] font-mono text-text-muted">
                  <span>STAGE {idx + 1}</span>
                  <span className="text-white/60">CONCEPTUAL</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
