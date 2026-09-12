import { Sliders, Sparkles } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import ShotExperimentSelector from './ShotExperimentSelector'
import EvaluationDatasetSelector from './EvaluationDatasetSelector'

/**
 * ExperimentConfiguration — Container card for shot & dataset selection
 */
export default function ExperimentConfiguration({
  selectedShot,
  onSelectShot,
  selectedDataset,
  onSelectDataset,
}) {
  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden space-y-6">
      {/* Background ambient crimson highlight */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-crimson/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="space-y-1 relative z-10">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-crimson" />
          <h3 className="text-lg font-heading font-bold text-white tracking-tight">
            Experiment Configuration
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-text-secondary font-sans">
          Select the number of visual examples provided to the vision-language model.
        </p>
      </div>

      {/* Shot Selector Component */}
      <div className="relative z-10">
        <ShotExperimentSelector
          selectedShot={selectedShot}
          onSelectShot={onSelectShot}
        />
      </div>

      <div className="h-[1px] w-full bg-white/[0.06] relative z-10" />

      {/* Dataset Selector Component */}
      <div className="relative z-10">
        <EvaluationDatasetSelector
          selectedDataset={selectedDataset}
          onSelectDataset={onSelectDataset}
        />
      </div>
    </GlassCard>
  )
}
