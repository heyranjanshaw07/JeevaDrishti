import { motion } from 'framer-motion'
import { Tag, Sparkles } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * CellCategoryTags — Dataset-specific cell category taxonomy tags
 */
export default function CellCategoryTags({ dataset }) {
  if (!dataset || !dataset.classes) return null

  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-crimson" />
            <h3 className="text-base font-heading font-bold text-white tracking-tight">
              Cell Categories
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Phenotype classes verified and annotated for {dataset.name}.
          </p>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-text-muted self-start sm:self-auto">
          {dataset.classes.length} TARGET CLASSES
        </span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {dataset.classes.map((cls, idx) => (
          <motion.div
            key={cls}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: idx * 0.04 }}
            className="px-3.5 py-2 rounded-xl bg-black/50 border border-white/[0.08] hover:border-crimson/40 text-xs font-mono text-white flex items-center gap-2 transition-colors group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
            <span className="font-medium group-hover:text-crimson transition-colors">
              {cls}
            </span>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}
