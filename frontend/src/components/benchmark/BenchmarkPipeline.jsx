import { motion } from 'framer-motion'
import {
  Microscope,
  Focus,
  Crop,
  Cpu,
  Target,
  BarChart3,
  ArrowRight,
  ChevronDown,
} from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const PIPELINE_NODES = [
  {
    step: '01',
    title: 'MICROSCOPY IMAGE',
    desc: 'High-res biological specimen input',
    icon: Microscope,
  },
  {
    step: '02',
    title: 'OBJECT PROPOSALS',
    desc: 'Morphology-aware bounding seeds',
    icon: Focus,
  },
  {
    step: '03',
    title: 'CANDIDATE REGIONS',
    desc: 'Cropped RoI cellular patches',
    icon: Crop,
  },
  {
    step: '04',
    title: 'VLM CLASSIFICATION',
    desc: 'Multimodal visual prompting',
    icon: Cpu,
  },
  {
    step: '05',
    title: 'CELL DETECTION',
    desc: 'Filtered bounding localization',
    icon: Target,
  },
  {
    step: '06',
    title: 'METRICS',
    desc: 'mF1 & precision verification',
    icon: BarChart3,
  },
]

/**
 * BenchmarkPipeline — Visual horizontal/vertical scientific pipeline
 */
export default function BenchmarkPipeline() {
  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-crimson shadow-[0_0_8px_#FF2A55]" />
            <h3 className="text-xl font-heading font-bold text-white tracking-tight">
              Benchmark Inference Pipeline
            </h3>
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            End-to-end evaluation flow from raw microscopy acquisition to benchmark metric scoring.
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] text-text-muted self-start sm:self-auto">
          6-STAGE EXECUTION
        </span>
      </div>

      {/* Desktop Horizontal Layout / Mobile Vertical Layout */}
      <div className="relative">
        {/* Connection line for desktop */}
        <div className="hidden xl:block absolute top-[44px] left-[5%] right-[5%] h-[2px] bg-gradient-to-r from-crimson/20 via-crimson/50 to-crimson/20 pointer-events-none z-0" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 relative z-10">
          {PIPELINE_NODES.map((node, index) => {
            const Icon = node.icon
            const isLast = index === PIPELINE_NODES.length - 1

            return (
              <div key={node.step} className="flex flex-col relative">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  className="p-4 rounded-xl bg-black/60 border border-white/[0.08] hover:border-crimson/40 transition-colors flex flex-col justify-between h-full group"
                >
                  <div>
                    {/* Top step & icon */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-crimson">
                        {node.step}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-crimson/10 border border-crimson/20 flex items-center justify-center text-crimson group-hover:scale-110 transition-transform">
                        <Icon size={16} />
                      </div>
                    </div>

                    {/* Step Title */}
                    <h4 className="text-sm font-mono font-bold text-white tracking-wider uppercase mb-1">
                      {node.title}
                    </h4>

                    {/* Step description */}
                    <p className="text-xs font-sans text-text-secondary leading-normal">
                      {node.desc}
                    </p>
                  </div>

                  {/* Stage tag */}
                  <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[9px] font-mono text-text-muted">
                    <span>STAGE {node.step}</span>
                    <span className="w-1 h-1 rounded-full bg-crimson/60" />
                  </div>
                </motion.div>

                {/* Arrow indicator between cards on smaller screens */}
                {!isLast && (
                  <div className="xl:hidden flex justify-center py-1 text-crimson/50">
                    <ChevronDown size={14} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </GlassCard>
  )
}
