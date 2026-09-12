import { motion } from 'framer-motion'
import { Layers, TestTube, Images } from 'lucide-react'

/**
 * DatasetSplitSelector — Tab selector for EXAMPLE and TEST partitions
 */
export default function DatasetSplitSelector({
  selectedSplit = 'TEST',
  onSelectSplit,
  dataset,
}) {
  const splits = [
    {
      id: 'EXAMPLE',
      label: 'EXAMPLE SPLIT',
      datasetCount: dataset?.exampleImages || 10,
      totalCount: 40,
      desc: 'Few-shot exemplar bank',
      icon: Images,
    },
    {
      id: 'TEST',
      label: 'TEST SPLIT',
      datasetCount: dataset?.testImages || 53,
      totalCount: 212,
      desc: 'Standard evaluation partition',
      icon: TestTube,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-crimson" />
          <span className="text-xs font-mono font-bold tracking-wider text-text-muted uppercase">
            Dataset Partition Split
          </span>
        </div>
        <span className="text-[10px] font-mono text-text-muted">
          Active: <strong className="text-crimson">{selectedSplit}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {splits.map((s) => {
          const isSelected = selectedSplit === s.id
          const Icon = s.icon

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSplit(s.id)}
              className={`p-4 rounded-xl text-left transition-all duration-200 flex items-center justify-between border ${
                isSelected
                  ? 'bg-crimson/15 border-crimson shadow-[0_0_20px_rgba(255,42,85,0.25)] text-white'
                  : 'bg-black/50 border-white/[0.08] hover:border-white/20 text-text-secondary hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-crimson text-white shadow-[0_0_10px_#FF2A55]'
                      : 'bg-white/[0.04] text-text-muted'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase block">
                    {s.label}
                  </span>
                  <p className="text-[11px] font-sans text-text-secondary">
                    {s.desc}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-mono font-extrabold text-white block">
                  {s.datasetCount} Images
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  ({s.totalCount} in Micro-OD)
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
