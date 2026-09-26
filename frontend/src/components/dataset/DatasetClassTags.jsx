import { motion } from 'framer-motion'
import { Tag, Sparkles, Filter } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import { KNOWN_CELL_CATEGORIES } from '@/data/datasets'

/**
 * DatasetClassTags — Scientific display of cell morphology and blood cell categories,
 * cleanly grouped by domain and dataset association.
 */
export default function DatasetClassTags({ activeDatasetId = 'All' }) {
  // Group categories by domain
  const groups = [
    {
      title: 'Hematology Categories',
      desc: 'Blood smear cytology classes',
      tags: KNOWN_CELL_CATEGORIES.filter((c) => c.group === 'Hematology'),
    },
    {
      title: 'Parasitology Stages',
      desc: 'Malaria infection developmental morphology',
      tags: KNOWN_CELL_CATEGORIES.filter((c) => c.group === 'Parasitology'),
    },
    {
      title: 'Phase Morphology',
      desc: 'Label-free optical phenotyping',
      tags: KNOWN_CELL_CATEGORIES.filter((c) => c.group === 'Morphology'),
    },
  ]

  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-crimson" />
            <h3 className="text-lg font-heading font-bold text-white tracking-tight">
              Cell Categories
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            10 known cell classes evaluated across the Micro-OD multimodal benchmark datasets.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] font-mono text-text-muted self-start sm:self-auto">
          <span>10 TOTAL PHENOTYPES</span>
        </div>
      </div>

      {/* Grouped tags display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {groups.map((grp, idx) => (
          <div
            key={grp.title}
            className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  {grp.title}
                </h4>
                <span className="text-[10px] font-mono text-crimson font-bold">
                  {grp.tags.length}
                </span>
              </div>
              <p className="text-[10px] font-mono text-text-muted mt-0.5">
                {grp.desc}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 border-t border-white/[0.04]">
              {grp.tags.map((item) => {
                const isRelevant =
                  activeDatasetId === 'All' || item.datasets.includes(activeDatasetId)

                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-200 flex items-center gap-2 ${
                      isRelevant
                        ? 'bg-crimson/10 border-crimson/30 text-white'
                        : 'bg-white/[0.02] border-white/[0.05] text-text-muted opacity-50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
                    <span>{item.name}</span>
                    <span className="text-[9px] font-mono text-text-muted">
                      ({item.datasets.join(', ')})
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
