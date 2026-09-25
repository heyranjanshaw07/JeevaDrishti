import { motion } from 'framer-motion'
import { Play, Sparkles, ShieldCheck, CheckCircle2, AlertCircle, Info, Microscope } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'

/**
 * AnalysisConfig — Simplified, User-Focused Analysis Control Panel
 * 
 * Technical dataset selection, model architectures, and few-shot configuration
 * are handled internally by the JeevaDrishti automated inference engine.
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
    <GlassCard className="p-5 sm:p-6 border-white/[0.08] flex flex-col justify-between" glow>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Microscope size={18} className="text-crimson" />
            <h3 className="text-base font-heading font-bold text-white tracking-wide">
              ANALYSIS CONTROL
            </h3>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-white/[0.05] text-white/90 border border-white/[0.08] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI READY
          </span>
        </div>

        {/* Automated Pipeline Intelligence */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-crimson" />
            <span className="text-sm font-heading font-bold text-white tracking-wide">
              Automated Analysis Pipeline
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
            JeevaDrishti automatically inspects your uploaded specimen, identifies the microscopy context, and selects the optimal detection and classification pipeline.
          </p>
        </div>

        {/* Specimen Status */}
        <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider font-semibold">
              Specimen Status
            </span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
              isReady
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/[0.05] text-white/50 border border-white/10'
            }`}>
              {isReady ? 'Mounted' : 'Awaiting Image'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/90 font-mono">
            {isReady ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm">Image ready for automated analysis</span>
              </>
            ) : (
              <>
                <AlertCircle size={16} className="text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm text-white/70">Upload or drop a microscopy image to begin</span>
              </>
            )}
          </div>
        </div>

        {/* Clinical Guidance Notice */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-2.5">
          <Info size={15} className="text-crimson shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            All AI inferences are calibrated for human-in-the-loop review. Pathologist validation is recommended for diagnostic confirmation.
          </p>
        </div>
      </div>

      {/* Primary Action: Run Analysis */}
      <div className="pt-6 mt-6 border-t border-white/[0.06] space-y-3">
        <Button
          variant="primary"
          size="lg"
          className={`w-full justify-center text-base font-heading font-bold tracking-wide transition-all ${
            isReady && !isRunning
              ? 'shadow-[0_4px_25px_rgba(255,42,85,0.35)] hover:shadow-[0_6px_35px_rgba(255,42,85,0.55)] cursor-pointer'
              : 'opacity-40 cursor-not-allowed'
          }`}
          iconRight={isRunning ? null : Play}
          disabled={!isReady || isRunning}
          onClick={handleRunClick}
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Analyzing Specimen...
            </span>
          ) : 'Run Analysis'}
        </Button>

        {!isReady && (
          <p className="text-xs font-mono text-text-muted text-center">
            Mount or upload a microscopy image to enable analysis
          </p>
        )}
      </div>
    </GlassCard>
  )
}
