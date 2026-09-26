import { motion } from 'framer-motion'
import { HelpCircle, CheckCircle2, Microscope, Layers } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import { DATASET_PURPOSES } from '@/data/datasets'

/**
 * DatasetPurpose — Scientific rationale explaining why these 4 datasets were selected
 */
export default function DatasetPurpose() {
  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden space-y-6">
      {/* Background ambient crimson highlight */}
      <div className="absolute bottom-0 right-0 w-80 h-40 bg-crimson/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="space-y-1 relative z-10">
        <div className="flex items-center gap-2">
          <HelpCircle size={16} className="text-crimson" />
          <h3 className="text-lg font-heading font-bold text-white tracking-tight">
            Why These Datasets?
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-text-secondary font-sans">
          Rationale for assembling BBBC, BCCD, LIVECell, and NIH-3T3 into the Micro-OD benchmark suite.
        </p>
      </div>

      {/* 4 Purpose Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {DATASET_PURPOSES.map((dp, idx) => (
          <motion.div
            key={dp.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            className="p-4 rounded-xl bg-black/50 border border-white/[0.06] flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-heading font-extrabold text-white">
                  {dp.name}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
              </div>

              <p className="text-xs font-mono font-medium text-crimson mb-1">
                {dp.summary}
              </p>

              <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
                {dp.domain}
              </p>
            </div>

            <div className="pt-2 border-t border-white/[0.04] text-[9px] font-mono text-text-muted">
              OBJECTIVE: DOMAIN GENERALIZATION
            </div>
          </motion.div>
        ))}
      </div>

      {/* Conservative summary synthesis */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center max-w-3xl mx-auto relative z-10">
        <p className="text-xs sm:text-sm font-sans font-medium text-white/90 leading-relaxed">
          &ldquo;Together, these datasets provide diverse microscopy conditions for evaluating cell detection.&rdquo;
        </p>
      </div>
    </GlassCard>
  )
}
