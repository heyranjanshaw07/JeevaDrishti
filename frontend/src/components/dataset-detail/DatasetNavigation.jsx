import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Layers } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import { DATASETS } from '@/data/datasets'

/**
 * DatasetNavigation — Previous / Next dataset switcher adhering to canonical benchmark order:
 * BBBC ↔ BCCD ↔ LIVECell ↔ NIH-3T3
 */
export default function DatasetNavigation({ currentDatasetId }) {
  const currentIndex = DATASETS.findIndex((d) => d.id.toUpperCase() === currentDatasetId?.toUpperCase())
  if (currentIndex === -1) return null

  const prevDataset = currentIndex > 0 ? DATASETS[currentIndex - 1] : null
  const nextDataset = currentIndex < DATASETS.length - 1 ? DATASETS[currentIndex + 1] : null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
      {prevDataset ? (
        <Link
          to={`/dataset/${prevDataset.id}`}
          className="w-full sm:w-auto p-4 rounded-xl bg-black/60 border border-white/[0.08] hover:border-crimson/40 hover:bg-white/[0.02] flex items-center gap-3 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-text-muted group-hover:text-crimson transition-colors shrink-0">
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
              Previous Dataset
            </span>
            <span className="text-xs font-mono font-bold text-white group-hover:text-crimson transition-colors">
              {prevDataset.name} &bull; {prevDataset.modality}
            </span>
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {nextDataset ? (
        <Link
          to={`/dataset/${nextDataset.id}`}
          className="w-full sm:w-auto p-4 rounded-xl bg-black/60 border border-white/[0.08] hover:border-crimson/40 hover:bg-white/[0.02] flex items-center justify-end gap-3 text-right transition-all group ml-auto"
        >
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
              Next Dataset
            </span>
            <span className="text-xs font-mono font-bold text-white group-hover:text-crimson transition-colors">
              {nextDataset.name} &bull; {nextDataset.modality}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-text-muted group-hover:text-crimson transition-colors shrink-0">
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
    </div>
  )
}
