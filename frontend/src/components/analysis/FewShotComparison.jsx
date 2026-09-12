import { motion } from 'framer-motion'
import { Sparkles, Check, ChevronRight } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const SHOT_CONFIGS = [
  {
    id: '0-shot',
    label: '0 SHOT',
    name: 'Zero-Shot Foundation',
    desc: 'Unsupervised open-vocabulary visual-semantic discovery',
  },
  {
    id: '1-shot',
    label: '1 SHOT',
    name: '1-Shot Exemplar',
    desc: 'Single curated specimen prompt alignment',
  },
  {
    id: '3-shot',
    label: '3 SHOT',
    name: '3-Shot Bank',
    desc: 'Triad morphological reference calibration',
  },
  {
    id: '6-shot',
    label: '6 SHOT',
    name: '6-Shot Bank',
    desc: 'Standardized Micro-OD benchmark few-shot evaluation',
  },
]

/**
 * FewShotComparison — Dedicated Few-Shot Adaptation selection & comparative cards
 * 
 * Empty state: Displays "Not evaluated" without fake metrics
 * Synchronized with current shot selection
 */
export default function FewShotComparison({
  selectedShot = '6-shot',
  onSelectShot,
  shotMetrics = null, // { '0-shot': ..., '1-shot': ... }
}) {
  // Normalize selected string (e.g. '6 Shot' -> '6-shot')
  const normalizedSelected = selectedShot.toLowerCase().replace(' ', '-')

  return (
    <div className="space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-crimson" />
          <h3 className="text-sm font-heading font-bold text-white tracking-wide">
            FEW-SHOT ADAPTATION
          </h3>
        </div>
        <span className="text-[10px] font-mono text-white/50 px-2.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.08]">
          PROMPT BANK
        </span>
      </div>

      {/* 4 Selectable Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {SHOT_CONFIGS.map((config) => {
          const isSelected = normalizedSelected === config.id
          const metric = shotMetrics?.[config.id]
          const status = metric?.status || 'Not evaluated'

          return (
            <div
              key={config.id}
              onClick={() => onSelectShot && onSelectShot(config.id === '0-shot' ? '0 Shot' : config.id === '1-shot' ? '1 Shot' : config.id === '3-shot' ? '3 Shot' : '6 Shot')}
              className="cursor-pointer"
            >
              <GlassCard
                className={`p-4 border transition-all duration-200 flex flex-col justify-between min-h-[130px] relative overflow-hidden ${
                  isSelected
                    ? 'border-crimson/80 bg-crimson/[0.06] shadow-[0_0_20px_rgba(255,42,85,0.25)]'
                    : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                {/* Active Indicator Bar */}
                {isSelected && (
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-crimson shadow-[0_0_8px_#FF2A55]" />
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-extrabold text-white tracking-wider">
                      {config.label}
                    </span>
                    {isSelected ? (
                      <span className="w-4 h-4 rounded-full bg-crimson flex items-center justify-center text-white text-[10px] shadow-[0_0_8px_#FF2A55]">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-white/20" />
                    )}
                  </div>

                  <h5 className="text-xs font-heading font-semibold text-white/90">
                    {config.name}
                  </h5>
                  <p className="text-[10px] text-text-secondary line-clamp-2 mt-0.5 leading-snug">
                    {config.desc}
                  </p>
                </div>

                {/* Configuration Status (Empty State: 'Not evaluated') */}
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-text-muted">Status</span>
                  <span
                    className={`font-semibold ${
                      status !== 'Not evaluated' ? 'text-crimson' : 'text-white/40'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </GlassCard>
            </div>
          )
        })}
      </div>
    </div>
  )
}
