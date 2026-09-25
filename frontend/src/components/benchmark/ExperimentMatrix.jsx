import { motion } from 'framer-motion'
import { Grid, Sparkles, AlertCircle } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const SHOT_ROWS = [
  { shot: 0, label: '0 Shot', desc: 'Zero-shot prompt' },
  { shot: 6, label: '6 Shot', desc: '6 exemplars' },
]

const DATASET_COLS = [
  { id: 'micro_od', legacyId: 'Micro-OD', label: 'Micro-OD', sub: 'Detection', taskType: 'object_detection' },
  { id: 'nih_nlm_malaria', legacyId: 'nih_nlm_malaria', label: 'Malaria', sub: 'Detection', taskType: 'object_detection' },
  { id: 'c_nmc_2019', legacyId: 'c_nmc_2019', label: 'C-NMC 2019', sub: 'Classification', taskType: 'cell_classification' },
  { id: 'redtell_anemia', legacyId: 'redtell_anemia', label: 'RedTell', sub: 'Classification', taskType: 'cell_classification' },
  { id: 'sipakmed', legacyId: 'sipakmed', label: 'SIPaKMeD', sub: 'Classification', taskType: 'cell_classification' },
]

/**
 * ExperimentMatrix — Research evaluation matrix grid showing 'Not evaluated' states
 */
export default function ExperimentMatrix({
  selectedShot = 0,
  selectedDataset = 'micro_od',
  matrixCells = [],
  onSelectCell,
}) {
  const getCell = (datasetId, shot) => {
    return matrixCells.find(
      (c) =>
        (c.dataset.toLowerCase() === datasetId.toLowerCase() ||
          (datasetId === 'micro_od' && c.dataset.toLowerCase() === 'micro-od')) &&
        c.shots === shot
    )
  }

  const evaluatedCount = matrixCells.filter((c) => c.status === 'evaluated' || c.status === 'completed').length

  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Grid size={18} className="text-crimson" />
            <h3 className="text-xl font-heading font-bold text-white tracking-tight">
              Experiment Matrix
            </h3>
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            Cross-dataset 5×2 evaluation matrix tracking real inference results across 0-shot and 6-shot configurations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
          <span className="w-2 h-2 rounded-full bg-crimson" />
          <span>Active Config Highlighted</span>
        </div>
      </div>

      {/* Table / Matrix Container (Horizontally Scrollable on small viewports) */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 pb-2">
        <table className="w-full min-w-[620px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="py-3 px-4 text-xs font-mono font-bold text-text-muted uppercase tracking-wider w-44">
                Shot Mode
              </th>
              {DATASET_COLS.map((col) => {
                const isCurrentDataset =
                  (selectedDataset || '').toLowerCase() === col.id.toLowerCase() ||
                  (selectedDataset || '').toLowerCase() === col.legacyId.toLowerCase()
                return (
                  <th
                    key={col.id}
                    className={`py-3 px-4 text-center transition-colors ${
                      isCurrentDataset ? 'text-crimson' : 'text-white'
                    }`}
                  >
                    <span className="block text-sm font-mono font-bold tracking-wide">
                      {col.label}
                    </span>
                    <span className="block text-xs font-mono text-text-muted font-normal">
                      {col.sub}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {SHOT_ROWS.map((row) => {
              const isSelectedRow = selectedShot === row.shot

              return (
                <tr
                  key={row.shot}
                  className={`transition-colors ${
                    isSelectedRow ? 'bg-crimson/[0.04]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Row Header */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      {isSelectedRow && (
                        <span className="w-2 h-2 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
                      )}
                      <div>
                        <span
                          className={`text-sm font-mono font-bold ${
                            isSelectedRow ? 'text-white' : 'text-white/80'
                          }`}
                        >
                          {row.label}
                        </span>
                        <span className="block text-xs font-mono text-text-muted">
                          {row.desc}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Dataset Cells */}
                  {DATASET_COLS.map((col) => {
                    const isCellTargeted =
                      isSelectedRow && (
                        (selectedDataset || '').toLowerCase() === col.id.toLowerCase() ||
                        (selectedDataset || '').toLowerCase() === col.legacyId.toLowerCase()
                      )

                    const cell = getCell(col.id, row.shot)
                    const isEvaluated = cell && (cell.status === 'evaluated' || cell.status === 'completed')
                    const isUnavailable = cell && cell.status === 'not_available'

                    let label = 'Not evaluated'
                    let badgeClass = 'bg-black/30 border-white/[0.05] text-text-muted'

                    if (isEvaluated) {
                      if (cell.accuracy !== null && cell.accuracy !== undefined) {
                        label = `${(cell.accuracy * 100).toFixed(1)}% Acc`
                      } else if (cell.mf1 !== null && cell.mf1 !== undefined) {
                        label = `${(cell.mf1 * 100).toFixed(1)}% mF1`
                      } else {
                        label = 'Complete'
                      }
                      badgeClass = 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 font-bold'
                    } else if (isUnavailable) {
                      label = 'Unavailable'
                      badgeClass = 'bg-amber-500/10 border-amber-500/25 text-amber-400 font-medium'
                    }

                    if (isCellTargeted) {
                      badgeClass += ' ring-2 ring-crimson shadow-[0_0_12px_rgba(255,42,85,0.25)]'
                    }

                    return (
                      <td key={col.id} className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectCell && onSelectCell(col.id, row.shot)}
                          className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg border font-mono text-xs transition-all cursor-pointer ${badgeClass}`}
                          title={cell?.error_message || `${col.label} ${row.label}: ${label}`}
                        >
                          <span>{label}</span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-xs font-mono text-text-muted">
        <span>STATUS: {evaluatedCount > 0 ? `${evaluatedCount} OF 10 CELLS EVALUATED` : 'PENDING EXECUTION'}</span>
        <span>10 EXPERIMENT SLOTS (5 DATASETS × 2 SHOTS)</span>
      </div>
    </GlassCard>
  )
}
