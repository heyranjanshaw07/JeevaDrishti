import { motion } from 'framer-motion'
import { Target, CheckCircle2, Award, Activity } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * DetectionSummary — Four KPI metric cards for inference outputs
 * 
 * Empty state: shows "—" without fabricated values.
 * Supports dynamic real values when real inference is connected.
 */
export default function DetectionSummary({ metrics = null }) {
  const detectedCount = metrics?.detectedCount ?? metrics?.detected_count
  const meanConf = metrics?.meanConfidence ?? metrics?.avg_confidence
  const prec = metrics?.precision
  const rec = metrics?.recall

  const cards = [
    {
      label: 'Detected Cells',
      value: detectedCount != null ? detectedCount.toLocaleString() : '—',
      unit: detectedCount != null ? 'cells' : null,
      desc: 'Total segmented cellular instances',
      icon: Target,
    },
    {
      label: 'Precision',
      value: prec != null ? `${(prec * 100).toFixed(1)}%` : '—',
      desc: 'Positive predictive value on Micro-OD',
      icon: CheckCircle2,
    },
    {
      label: 'Recall',
      value: rec != null ? `${(rec * 100).toFixed(1)}%` : '—',
      desc: 'True positive detection rate',
      icon: Award,
    },
    {
      label: 'Mean Confidence',
      value: meanConf != null ? `${(meanConf * 100).toFixed(1)}%` : '—',
      desc: 'VLM semantic classification certainty',
      icon: Activity,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon
        const isPopulated = card.value !== '—'

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.06 }}
          >
            <GlassCard
              className="p-5 sm:p-6 border-white/[0.08] hover:border-crimson/30 transition-all duration-200 flex flex-col justify-between min-h-[120px]"
              glow
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-text-secondary uppercase tracking-wider">
                  {card.label}
                </span>
                <div className="w-7 h-7 rounded-lg bg-crimson/10 border border-crimson/25 flex items-center justify-center text-crimson">
                  <Icon size={14} />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className={`text-3xl sm:text-4xl font-mono font-extrabold tracking-tight ${
                    isPopulated ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {card.value}
                </span>
                {card.unit && isPopulated && (
                  <span className="text-sm font-mono text-text-muted font-medium">{card.unit}</span>
                )}
              </div>

              <p className="text-xs font-mono text-white/50 mt-1.5 truncate">
                {card.desc}
              </p>
            </GlassCard>
          </motion.div>
        )
      })}
    </div>
  )
}
