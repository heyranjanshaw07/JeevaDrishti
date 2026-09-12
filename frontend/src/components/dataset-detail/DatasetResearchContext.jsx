import { BookOpen, Sparkles, Target } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * DatasetResearchContext — Scientific context card detailing the dataset's role in few-shot benchmarks
 */
export default function DatasetResearchContext({ dataset }) {
  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
        <BookOpen size={16} className="text-crimson" />
        <h3 className="text-base font-heading font-bold text-white tracking-tight">
          Research Context
        </h3>
      </div>

      <div className="space-y-3">
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
          This dataset is part of the microscopy benchmark used to study zero-shot and few-shot cell detection.
        </p>

        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
              BENCHMARK PROTOCOL
            </span>
            <div className="text-xs font-mono font-bold text-white">
              Evaluation configurations: 0 / 1 / 3 / 6 shots
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['0 SHOT', '1 SHOT', '3 SHOT', '6 SHOT'].map((shot) => (
              <span
                key={shot}
                className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-white/80"
              >
                {shot}
              </span>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
