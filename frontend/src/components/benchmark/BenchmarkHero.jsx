import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Layers, Compass } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const SHOT_MODES = [
  { label: '0 SHOT', desc: 'Zero-shot foundation prompt' },
  { label: '6 SHOT', desc: 'Standardized Micro-OD bank' },
]

const PIPELINE_FLOW = [
  { step: '01', title: 'IMAGE' },
  { step: '02', title: 'PROPOSALS' },
  { step: '03', title: 'VLM' },
  { step: '04', title: 'DETECTION' },
  { step: '05', title: 'EVALUATION' },
]

/**
 * BenchmarkHero — Primary research hero card for Micro-OD Benchmark
 */
export default function BenchmarkHero() {
  return (
    <GlassCard className="p-6 sm:p-8 border-white/[0.08] relative overflow-hidden" glow>
      {/* Background ambient crimson highlight */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-crimson/[0.07] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top Tag & Title */}
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-crimson/10 border border-crimson/30 text-xs font-mono text-crimson font-semibold">
            <Sparkles size={13} />
            <span>FEW-SHOT CELLULAR INTELLIGENCE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight leading-tight">
            Measuring Vision-Language Cell Detection
          </h2>

          <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans">
            JeevaDrishti evaluates how visual examples influence cell detection across microscopy datasets.
          </p>
        </div>

        {/* Experiment Configurations: 0 and 6 SHOT */}
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2.5 block">
            Experiment Configurations
          </span>
          <div className="grid grid-cols-2 gap-3">
            {SHOT_MODES.map((shot, idx) => (
              <motion.div
                key={shot.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="p-3.5 rounded-xl bg-black/60 border border-white/[0.08] hover:border-crimson/40 transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-mono font-extrabold text-white tracking-wider">
                    {shot.label}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
                </div>
                <p className="text-xs font-mono text-white/60">
                  {shot.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Visual representation: IMAGE → PROPOSALS → VLM → DETECTION → EVALUATION */}
        <div className="pt-2 border-t border-white/[0.06]">
          <span className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2 block">
            Inference Architecture
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {PIPELINE_FLOW.map((node, i) => (
              <div key={node.step} className="flex items-center gap-2 sm:gap-3">
                <div className="px-3.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center gap-2 text-sm font-mono font-semibold text-white/90">
                  <span className="text-xs text-crimson font-bold">{node.step}</span>
                  <span>{node.title}</span>
                </div>
                {i < PIPELINE_FLOW.length - 1 && (
                  <ArrowRight size={14} className="text-crimson/70 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
