import { motion } from 'framer-motion'
import {
  Activity,
  Target,
  BarChart2,
  Zap,
  Clock,
  Cpu,
  Info,
} from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const METRICS_DEF = [
  {
    key: 'mF1',
    label: 'mF1',
    name: 'Macro F1 Score',
    icon: Activity,
    explanation: 'Macro F1 across evaluated classes.',
    unit: '',
  },
  {
    key: 'precision',
    label: 'Precision',
    name: 'Positive Predictive Value',
    icon: Target,
    explanation: 'Correct positive detections among predicted detections.',
    unit: '',
  },
  {
    key: 'recall',
    label: 'Recall',
    name: 'Sensitivity / Detection Rate',
    icon: BarChart2,
    explanation: 'Detected ground-truth objects among all ground-truth objects.',
    unit: '',
  },
  {
    key: 'iou',
    label: 'IoU',
    name: 'Intersection over Union',
    icon: Zap,
    explanation: 'Overlap between predicted and reference bounding boxes.',
    unit: '',
  },
  {
    key: 'latency',
    label: 'Latency',
    name: 'Inference Latency',
    icon: Clock,
    explanation: 'Inference time per image.',
    unit: '',
  },
  {
    key: 'vlmCalls',
    label: 'VLM Calls',
    name: 'Model Invocations',
    icon: Cpu,
    explanation: 'Number of vision-language model calls.',
    unit: '',
  },
]

/**
 * MetricsPanel — 6 Evaluation metric cards showing initial '—' states
 */
export default function MetricsPanel({ metrics = {} }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-crimson" />
            <h3 className="text-xl font-heading font-bold text-white tracking-tight">
              Evaluation Metrics
            </h3>
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            Standard quantitative microscopy evaluation metrics for zero-shot and few-shot detection.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-text-muted self-start sm:self-auto">
          <Info size={13} />
          <span>AWAITING EVALUATION</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {METRICS_DEF.map((m, idx) => {
          const Icon = m.icon
          const rawValue = metrics[m.key]
          const displayValue = rawValue !== null && rawValue !== undefined ? rawValue : '—'

          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <GlassCard
                hover
                className="p-5 border-white/[0.08] hover:border-crimson/40 transition-all duration-200 flex flex-col justify-between h-full group relative overflow-hidden"
              >
                {/* Background subtle flare */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-crimson/[0.03] rounded-full blur-xl group-hover:bg-crimson/[0.07] transition-colors pointer-events-none" />

                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-mono font-bold text-crimson uppercase tracking-wider">
                        {m.label}
                      </span>
                      <p className="text-xs sm:text-sm font-mono text-text-muted">
                        {m.name}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-text-muted group-hover:text-crimson group-hover:border-crimson/30 transition-colors">
                      <Icon size={16} />
                    </div>
                  </div>

                  {/* Metric Value */}
                  <div className="py-2">
                    <div className="text-4xl sm:text-5xl font-mono font-extrabold text-white tracking-tight">
                      {displayValue}
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <p className="text-xs sm:text-sm font-sans text-text-secondary leading-relaxed">
                    {m.explanation}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
