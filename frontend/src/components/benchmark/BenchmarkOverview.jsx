import { motion } from 'framer-motion'
import { Microscope, Image as ImageIcon, Target, Layers } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import AnimatedNumber from '@/components/ui/AnimatedNumber'

const OVERVIEW_METRICS = [
  {
    value: '252',
    label: 'Microscopy Images',
    icon: Microscope,
    detail: 'Curated bio-imaging corpus',
  },
  {
    value: '212',
    label: 'Test Images',
    icon: ImageIcon,
    detail: 'Benchmarking test evaluation',
  },
  {
    value: '5,551',
    label: 'Annotated Test Cells',
    icon: Target,
    detail: 'Verified bounding ground truths',
  },
  {
    value: '4',
    label: 'Supported Datasets',
    icon: Layers,
    detail: 'Cell morphology domains',
  },
]

/**
 * BenchmarkOverview — 4 Verified Micro-OD KPI summary cards
 */
export default function BenchmarkOverview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-crimson shadow-[0_0_8px_#FF2A55]" />
          <span className="text-sm font-mono font-bold tracking-wider text-text-muted uppercase">
            Verified Dataset Statistics
          </span>
        </div>
        <span className="text-xs font-mono text-text-muted">Micro-OD Standard Suite</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {OVERVIEW_METRICS.map((item, idx) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.07 }}
            >
              <GlassCard
                hover
                className="p-5 border-white/[0.08] hover:border-crimson/40 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Subtle crimson accent gradient in the card */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-crimson/[0.04] rounded-full blur-2xl group-hover:bg-crimson/[0.08] transition-colors pointer-events-none" />

                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-mono font-medium text-text-secondary">
                    {item.label}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-text-muted group-hover:text-crimson group-hover:border-crimson/30 transition-colors">
                    <Icon size={17} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-4xl sm:text-5xl font-heading font-extrabold text-white tracking-tight group-hover:text-white transition-colors">
                    <AnimatedNumber value={item.value} />
                  </div>
                  <p className="text-xs sm:text-sm font-mono text-text-muted leading-tight">
                    {item.detail}
                  </p>
                </div>

                {/* Bottom subtle indicator line */}
                <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs font-mono text-text-muted">
                  <span>VERIFIED</span>
                  <span className="text-crimson font-bold">●</span>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
