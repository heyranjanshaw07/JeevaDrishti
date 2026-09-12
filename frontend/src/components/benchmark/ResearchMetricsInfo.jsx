import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronDown, Sparkles } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const METRICS_INFO = [
  {
    name: 'mF1',
    label: 'Macro F1 Score',
    desc: 'Macro-averaged F1 score across evaluated cell classes.',
  },
  {
    name: 'Precision',
    label: 'Positive Predictive Value',
    desc: 'Measures how many predicted detections are correct.',
  },
  {
    name: 'Recall',
    label: 'True Positive Rate',
    desc: 'Measures how many reference cells are detected.',
  },
  {
    name: 'IoU',
    label: 'Intersection over Union',
    desc: 'Measures bounding-box overlap between prediction and reference.',
  },
  {
    name: 'Latency',
    label: 'Execution Duration',
    desc: 'Measures inference time.',
  },
  {
    name: 'VLM Calls',
    label: 'Model Invocations',
    desc: 'Tracks vision-language model usage during inference.',
  },
]

/**
 * ResearchMetricsInfo — Scientific methodology info card with collapsible details
 */
export default function ResearchMetricsInfo() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <GlassCard className="p-5 sm:p-6 border-white/[0.08] relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-crimson/10 border border-crimson/25 flex items-center justify-center text-crimson">
            <BookOpen size={16} />
          </div>
          <div>
            <h4 className="text-sm font-heading font-bold text-white tracking-tight">
              How JeevaDrishti is Evaluated
            </h4>
            <p className="text-[11px] font-sans text-text-secondary">
              Standardized evaluation criteria and metric definitions used across Micro-OD benchmarks.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-text-muted hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono"
        >
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-5 mt-4 border-t border-white/[0.06]">
              {METRICS_INFO.map((item) => (
                <div
                  key={item.name}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-crimson uppercase">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
