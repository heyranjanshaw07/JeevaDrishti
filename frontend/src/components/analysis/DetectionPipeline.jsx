import { motion } from 'framer-motion'
import { Layers, ArrowDown } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const PIPELINE_STEPS = [
  { step: '01', title: 'Image Input', desc: 'Preprocessed microscopy ingestion' },
  { step: '02', title: 'SAM / Object Proposals', desc: 'Zero-shot promptable segmentation' },
  { step: '03', title: 'Candidate Regions', desc: 'BBox proposal filtering' },
  { step: '04', title: 'VLM Classification', desc: 'Few-shot vision-language alignment' },
  { step: '05', title: 'Cell Detection', desc: 'Phenotype confidence scoring' },
]

/**
 * DetectionPipeline — Compact Analysis Status & Pipeline Visualizer
 */
export default function DetectionPipeline({ activeStep = 0 }) {
  return (
    <GlassCard className="p-4 sm:p-5 border-white/[0.08]" hover>
      <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-crimson" />
          <h4 className="text-xs font-heading font-bold text-white tracking-wider uppercase">
            INFERENCE PIPELINE STATUS
          </h4>
        </div>
        <span className="text-[10px] font-mono text-crimson bg-crimson/10 px-2 py-0.5 rounded border border-crimson/25">
          STANDBY READY
        </span>
      </div>

      {/* Subtle Sequential Pipeline List */}
      <div className="relative pl-5 space-y-3 my-1">
        {/* Vertical Track Line */}
        <div className="absolute left-[8px] top-2 bottom-2 w-[1.5px] bg-gradient-to-b from-crimson via-ruby/60 to-white/20" />

        {PIPELINE_STEPS.map((step, idx) => (
          <div key={step.step} className="relative flex items-center justify-between group">
            {/* Crimson Node Indicator */}
            <div className="absolute -left-[18px] w-3.5 h-3.5 rounded-full bg-[#060205] border border-crimson flex items-center justify-center shadow-[0_0_6px_rgba(255,42,85,0.4)]">
              <span className="w-1 h-1 rounded-full bg-white" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-crimson font-bold">
                {step.step}
              </span>
              <span className="text-xs font-mono font-medium text-white/90 group-hover:text-white transition-colors">
                {step.title}
              </span>
            </div>

            <span className="text-[10px] font-mono text-white/40 hidden sm:inline">
              {step.desc}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
