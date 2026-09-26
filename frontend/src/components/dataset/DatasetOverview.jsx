import { motion } from 'framer-motion'
import { Microscope, Images, TestTube, Layers } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import { MICRO_OD_OVERVIEW } from '@/data/datasets'

const OVERVIEW_CARDS = [
  {
    value: (MICRO_OD_OVERVIEW?.totalImages ?? 0).toLocaleString(),
    label: 'Microscopy Images',
    sub: 'Total benchmark repository',
    icon: Microscope,
  },
  {
    value: MICRO_OD_OVERVIEW.exampleImages.toString(),
    label: 'Example Images',
    sub: 'Few-shot exemplar bank',
    icon: Images,
  },
  {
    value: MICRO_OD_OVERVIEW.testImages.toString(),
    label: 'Test Images',
    sub: 'Standard evaluation partition',
    icon: TestTube,
  },
  {
    value: MICRO_OD_OVERVIEW.datasetCount.toString(),
    label: 'Datasets',
    sub: 'Verified imaging domains',
    icon: Layers,
  },
]

/**
 * DatasetOverview — 4 Verified Micro-OD statistics overview cards
 */
export default function DatasetOverview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_8px_#FF2A55]" />
          <span className="text-xs font-mono font-bold tracking-wider text-text-muted uppercase">
            Micro-OD Repository Metrics
          </span>
        </div>
        <span className="text-[10px] font-mono text-text-muted">Verified 40 / 212 Split</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {OVERVIEW_CARDS.map((card, idx) => {
          const Icon = card.icon

          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
            >
              <GlassCard
                hover
                className="p-5 border-white/[0.08] hover:border-crimson/40 transition-all duration-200 relative overflow-hidden group"
              >
                {/* Subtle crimson radiance */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-crimson/[0.03] group-hover:bg-crimson/[0.08] rounded-full blur-2xl transition-colors pointer-events-none" />

                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono font-medium text-text-secondary">
                    {card.label}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-text-muted group-hover:text-crimson group-hover:border-crimson/30 transition-colors">
                    <Icon size={16} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
                    {card.value}
                  </div>
                  <p className="text-[11px] font-mono text-text-muted">
                    {card.sub}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-text-muted">
                  <span>PARTITION VERIFIED</span>
                  <span className="text-crimson">●</span>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
