import { motion } from 'framer-motion'
import {
  Microscope,
  Focus,
  Crop,
  Cpu,
  Target,
  BarChart3,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const APPROACH_STAGES = [
  {
    step: '01',
    title: 'Microscopy Image',
    desc: 'Ingestion of raw optical or fluorescence cytology specimen fields.',
    icon: Microscope,
  },
  {
    step: '02',
    title: 'Object Proposals',
    desc: 'Class-agnostic boundary localization generating spatial proposal seeds.',
    icon: Focus,
  },
  {
    step: '03',
    title: 'Candidate Regions',
    desc: 'High-probability cellular regions of interest (RoI) extracted as patches.',
    icon: Crop,
  },
  {
    step: '04',
    title: 'Vision-Language Classification',
    desc: 'Few-shot multimodal verification using exemplar-conditioned prompts.',
    icon: Cpu,
  },
  {
    step: '05',
    title: 'Cell Detection',
    desc: 'Calibrated bounding coordinates and phenotype class assignment.',
    icon: Target,
  },
  {
    step: '06',
    title: 'Evaluation',
    desc: 'Standardized evaluation against ground-truth benchmark partitions.',
    icon: BarChart3,
  },
]

/**
 * ResearchApproach — 6-step high-level architecture cards
 */
export default function ResearchApproach() {
  return (
    <GlassCard className="p-6 sm:p-8 border-white/[0.08] relative overflow-hidden space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_8px_#FF2A55]" />
            <h3 className="text-xl font-heading font-bold text-white tracking-tight">
              Our Approach
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Decoupled hybrid pipeline separating candidate localization from semantic vision-language reasoning.
          </p>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.08] text-text-muted self-start sm:self-auto">
          6-STAGE PIPELINE
        </span>
      </div>

      {/* Pipeline Grid (Horizontal on large, 2-col tablet, vertical mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 relative">
        {APPROACH_STAGES.map((stage, idx) => {
          const Icon = stage.icon
          const isLast = idx === APPROACH_STAGES.length - 1

          return (
            <motion.div
              key={stage.step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="p-4 rounded-xl bg-black/60 border border-white/[0.08] hover:border-crimson/40 transition-colors flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-extrabold text-crimson">
                    {stage.step}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-crimson/10 border border-crimson/25 flex items-center justify-center text-crimson group-hover:scale-110 transition-transform">
                    <Icon size={15} />
                  </div>
                </div>

                <h4 className="text-xs font-mono font-bold text-white mb-1 leading-snug">
                  {stage.title}
                </h4>

                <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
                  {stage.desc}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[9px] font-mono text-text-muted">
                <span>PHASE {stage.step}</span>
                <span className="w-1 h-1 rounded-full bg-crimson" />
              </div>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}
