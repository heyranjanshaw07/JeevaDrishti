import { motion } from 'framer-motion'
import { Database, Check } from 'lucide-react'

const DATASET_OPTIONS = [
  { id: 'Micro-OD', label: 'Micro-OD', tag: 'Standard Suite', count: '4 Domains' },
  { id: 'BBBC', label: 'BBBC', tag: 'Fluorescence', count: '6 Classes' },
  { id: 'BCCD', label: 'BCCD', tag: 'Blood Smear', count: '3 Classes' },
  { id: 'LIVECell', label: 'LIVECell', tag: 'Phase Contrast', count: '3 Classes' },
  { id: 'NIH-3T3', label: 'NIH-3T3', tag: 'Fibroblast Line', count: '3 Classes' },
]

/**
 * EvaluationDatasetSelector — Clean segmented dataset chooser
 */
export default function EvaluationDatasetSelector({ selectedDataset, onSelectDataset }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-crimson" />
          <span className="text-sm font-mono font-semibold tracking-wider text-text-muted uppercase">
            Evaluation Dataset
          </span>
        </div>
        <span className="text-xs sm:text-sm font-mono text-text-muted">
          Active: <span className="text-white font-bold">{selectedDataset}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {DATASET_OPTIONS.map((ds) => {
          const isSelected = selectedDataset === ds.id

          return (
            <motion.button
              key={ds.id}
              type="button"
              onClick={() => onSelectDataset(ds.id)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`p-3.5 rounded-xl text-left transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-crimson/15 border-2 border-crimson shadow-[0_0_18px_rgba(255,42,85,0.2)]'
                  : 'bg-black/50 border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-base font-heading font-extrabold tracking-tight ${
                    isSelected ? 'text-white' : 'text-white/80'
                  }`}
                >
                  {ds.label}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
                )}
              </div>

              <div className="space-y-0.5">
                <span className="block text-xs font-mono text-crimson font-medium">
                  {ds.tag}
                </span>
                <span className="block text-[11px] font-mono text-text-muted">
                  {ds.count}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
