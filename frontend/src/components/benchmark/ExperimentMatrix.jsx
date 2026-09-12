import { motion } from 'framer-motion'
import { Grid, Sparkles, AlertCircle } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const SHOT_ROWS = [
  { shot: 0, label: '0 Shot', desc: 'Zero-shot prompt' },
  { shot: 1, label: '1 Shot', desc: '1 exemplar' },
  { shot: 3, label: '3 Shot', desc: '3 exemplars' },
  { shot: 6, label: '6 Shot', desc: '6 exemplars' },
]

const DATASET_COLS = [
  { id: 'BBBC', label: 'BBBC', sub: 'Fluorescence' },
  { id: 'BCCD', label: 'BCCD', sub: 'Blood Smear' },
  { id: 'LIVECell', label: 'LIVECell', sub: 'Phase-Contrast' },
  { id: 'NIH-3T3', label: 'NIH-3T3', sub: 'Fibroblast' },
]

/**
 * ExperimentMatrix — Research evaluation matrix grid showing 'Not evaluated' states
 */
export default function ExperimentMatrix({ selectedShot = 0, selectedDataset = 'Micro-OD' }) {
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
            Cross-dataset evaluation matrix tracking verification status across shot configurations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
          <span className="w-2 h-2 rounded-full bg-crimson" />
          <span>Active Config Highlighted</span>
        </div>
      </div>

      {/* Table / Matrix Container (Horizontally Scrollable on small viewports) */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 pb-2">
        <table className="w-full min-w-[560px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="py-3 px-4 text-xs font-mono font-bold text-text-muted uppercase tracking-wider w-44">
                Shot Mode
              </th>
              {DATASET_COLS.map((col) => {
                const isCurrentDataset = selectedDataset === col.id
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
                      isSelectedRow && (selectedDataset === col.id || selectedDataset === 'Micro-OD')

                    return (
                      <td key={col.id} className="py-3.5 px-4 text-center">
                        <div
                          className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg border font-mono transition-all ${
                            isCellTargeted
                              ? 'bg-crimson/10 border-crimson/35 text-white shadow-[0_0_12px_rgba(255,42,85,0.15)] font-semibold'
                              : 'bg-black/30 border-white/[0.05] text-text-muted'
                          }`}
                        >
                          <span className="text-xs">Not evaluated</span>
                        </div>
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
        <span>STATUS: PENDING EXECUTION</span>
        <span>16 EXPERIMENT SLOTS</span>
      </div>
    </GlassCard>
  )
}
