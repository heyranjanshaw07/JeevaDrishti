import { motion } from 'framer-motion'
import { Play, ShieldAlert, Terminal, Lock } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * EvaluationStatus — Evaluation control and backend readiness card
 */
export default function EvaluationStatus({
  selectedShot,
  selectedDataset,
  onRunEvaluation,
  isRunning = false,
  activeCellStatus = 'not_evaluated',
  errorMessage = null,
}) {
  const isEvaluated = activeCellStatus === 'completed' || activeCellStatus === 'evaluated'
  const isUnavailable = activeCellStatus === 'not_available'

  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-crimson/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-crimson/15 border border-crimson/30 flex items-center justify-center text-crimson">
              <Terminal size={15} />
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold ${
              isEvaluated
                ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/35'
                : isUnavailable
                ? 'text-amber-400 bg-amber-500/15 border-amber-500/35'
                : 'text-crimson bg-crimson/15 border-crimson/35'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isEvaluated ? 'bg-emerald-400' : isUnavailable ? 'bg-amber-400' : 'bg-crimson animate-pulse'
              }`} />
              <span>
                {isEvaluated
                  ? 'RESULTS STORED & VERIFIED'
                  : isUnavailable
                  ? 'EVALUATION UNAVAILABLE (SAM REQ.)'
                  : 'READY FOR BENCHMARK'}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-heading font-extrabold text-white tracking-tight">
              Evaluation Status
            </h3>
            <p className="text-sm sm:text-base text-text-secondary mt-1 leading-relaxed">
              {errorMessage
                ? errorMessage
                : isEvaluated
                ? 'Evaluation successfully completed against real ground-truth annotations and stored in backend.'
                : isUnavailable
                ? 'Model weights for segmentation are unavailable. Results remain honestly marked Not Available.'
                : 'Execute actual vision model inference across test set images to compute real quantitative metrics.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-mono text-text-muted">
            <span className="px-3 py-1 rounded bg-black/40 border border-white/[0.06]">
              Target: <strong className="text-white">{selectedDataset}</strong>
            </span>
            <span className="px-3 py-1 rounded bg-black/40 border border-white/[0.06]">
              Shot Mode: <strong className="text-crimson">{selectedShot} Shot</strong>
            </span>
            <span className="px-3 py-1 rounded bg-black/40 border border-white/[0.06]">
              Engine: <strong className="text-white">Gemini 2.5 + SAM</strong>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
          <button
            type="button"
            onClick={() => onRunEvaluation && onRunEvaluation(selectedDataset, selectedShot)}
            disabled={isRunning}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer ${
              isRunning
                ? 'bg-crimson/50 text-white/70 cursor-wait'
                : 'bg-crimson hover:bg-crimson-600 text-white shadow-[0_0_20px_rgba(255,42,85,0.4)] active:scale-95'
            }`}
            title="Execute real benchmark evaluation on backend"
          >
            {isRunning ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Evaluation...</span>
              </>
            ) : (
              <>
                <Play size={15} className="fill-white" />
                <span>{isEvaluated ? 'Re-run Evaluation' : 'Run Evaluation'}</span>
              </>
            )}
          </button>
          <span className="text-xs font-mono text-text-muted">
            {isRunning ? 'Processing inference on test set...' : 'Direct FastAPI Benchmark Engine'}
          </span>
        </div>
      </div>
    </GlassCard>
  )
}
