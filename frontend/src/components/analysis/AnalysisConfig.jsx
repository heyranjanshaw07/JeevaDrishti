import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'

const SHOT_OPTIONS = ['0 Shot', '6 Shot']

/**
 * AnalysisConfig — Clean, User-Focused Analysis Action Panel
 * Includes 0-Shot / 6-Shot configuration and a centered Run Analysis button.
 */
export default function AnalysisConfig({
  dataset = 'auto',
  onDatasetChange,
  shotMode = '6 Shot',
  onShotModeChange,
  model = 'optical',
  onModelChange,
  isReady = false,
  onRun = null,
  isRunning = false,
}) {
  const handleRunClick = () => {
    if (!isReady || isRunning) return
    if (typeof onRun === 'function') {
      onRun()
    }
  }

  return (
    <GlassCard className="p-6 sm:p-8 border-white/[0.08] flex flex-col items-center justify-center gap-5 min-h-[180px]" glow>
      {/* 0 Shot / 6 Shot Segmented Option Selector */}
      <div className="w-full max-w-xs">
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/60 border border-white/[0.08]">
          {SHOT_OPTIONS.map((shot) => {
            const isSelected = shotMode === shot
            return (
              <button
                key={shot}
                type="button"
                onClick={() => onShotModeChange && onShotModeChange(shot)}
                className={`relative py-2.5 rounded-lg text-xs sm:text-sm font-mono font-bold transition-colors cursor-pointer text-center ${
                  isSelected ? 'text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="analysisConfigShotPill"
                    className="absolute inset-0 rounded-lg bg-crimson shadow-[0_0_15px_rgba(255,42,85,0.45)] border border-crimson"
                    transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                  />
                )}
                <span className="relative z-10">{shot}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Centered Primary Action Button: Run Analysis */}
      <div className="w-full max-w-xs flex justify-center">
        <Button
          variant="primary"
          size="lg"
          className={`w-full justify-center text-base sm:text-lg font-heading font-extrabold tracking-wide transition-all py-3.5 ${
            isReady && !isRunning
              ? 'shadow-[0_4px_25px_rgba(255,42,85,0.4)] hover:shadow-[0_6px_35px_rgba(255,42,85,0.6)] cursor-pointer'
              : 'opacity-40 cursor-not-allowed'
          }`}
          iconRight={isRunning ? null : Play}
          disabled={!isReady || isRunning}
          onClick={handleRunClick}
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Analyzing Specimen...
            </span>
          ) : (
            'Run Analysis'
          )}
        </Button>
      </div>
    </GlassCard>
  )
}
