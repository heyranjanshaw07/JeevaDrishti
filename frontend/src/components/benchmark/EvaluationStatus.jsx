import { motion } from 'framer-motion'
import { Play, ShieldAlert, Terminal, Lock } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * EvaluationStatus — Evaluation control and backend readiness card
 */
export default function EvaluationStatus({ selectedShot, selectedDataset }) {
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-crimson/15 border border-crimson/35 text-xs font-mono text-crimson font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
              <span>READY FOR BACKEND</span>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-heading font-extrabold text-white tracking-tight">
              Evaluation Status
            </h3>
            <p className="text-sm sm:text-base text-text-secondary mt-1 leading-relaxed">
              Experiment execution will become available after the AI inference pipeline is connected.
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
              Engine: <strong className="text-white">Vision-Language Model</strong>
            </span>
          </div>
        </div>

        {/* Intentionally disabled "Run Evaluation" button */}
        <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
          <button
            type="button"
            disabled
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.12] text-white/40 font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-not-allowed select-none shadow-none opacity-60"
            title="Experiment execution will become available after the AI inference pipeline is connected."
          >
            <Lock size={15} className="text-white/40" />
            <span>Run Evaluation</span>
          </button>
          <span className="text-xs font-mono text-text-muted">
            Awaiting Backend Pipeline Connection
          </span>
        </div>
      </div>
    </GlassCard>
  )
}
