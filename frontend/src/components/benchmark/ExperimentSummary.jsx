import { Terminal, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * ExperimentSummary — Compact configuration summary card
 */
export default function ExperimentSummary({ selectedDataset = 'Micro-OD', selectedShot = 0 }) {
  return (
    <GlassCard className="p-5 border-white/[0.08] relative overflow-hidden">
      {/* Corner subtle radiance */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-crimson/[0.03] rounded-full blur-2xl pointer-events-none" />

      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Terminal size={17} className="text-crimson" />
            <span className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              Active Configuration Summary
            </span>
          </div>
          <span className="text-xs font-mono text-crimson font-semibold px-2.5 py-1 rounded bg-crimson/10 border border-crimson/25">
            CONFIG ONLY
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* DATASET */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
            <span className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1">
              Dataset
            </span>
            <span className="text-base font-heading font-extrabold text-white">
              {selectedDataset}
            </span>
          </div>

          {/* SHOT */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
            <span className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1">
              Shot Mode
            </span>
            <span className="text-base font-heading font-extrabold text-crimson">
              {selectedShot} Shot
            </span>
          </div>

          {/* MODEL */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
            <span className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1">
              Model
            </span>
            <span className="text-sm font-mono font-bold text-white leading-tight">
              Vision-Language Model
            </span>
          </div>

          {/* MODE */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
            <span className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1">
              {['c_nmc_2019', 'redtell_anemia', 'sipakmed'].includes((selectedDataset || '').toLowerCase())
                ? 'Task Mode'
                : 'Detection Mode'}
            </span>
            <span className="text-sm font-mono font-bold text-white leading-tight">
              {['c_nmc_2019', 'redtell_anemia', 'sipakmed'].includes((selectedDataset || '').toLowerCase())
                ? 'Cell Classification'
                : 'Hybrid Detection'}
            </span>
          </div>

          {/* STATUS */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] col-span-2 sm:col-span-1">
            <span className="block text-xs font-mono text-text-muted uppercase tracking-wider mb-1">
              Status
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-mono font-semibold text-white/90">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
              Ready for backend
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
