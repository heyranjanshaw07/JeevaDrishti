import { Play } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'

/**
 * AnalysisConfig — Simplified, User-Focused Analysis Action Panel
 * Contains ONLY the primary Run Analysis action button.
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
    <GlassCard className="p-4 sm:p-5 border-white/[0.08]" glow>
      <Button
        variant="primary"
        size="lg"
        className={`w-full justify-center text-base sm:text-lg font-heading font-extrabold tracking-wide transition-all py-4 ${
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
    </GlassCard>
  )
}
