import { motion } from 'framer-motion'
import {
  Activity,
  Target,
  BarChart2,
  Zap,
  Clock,
  Cpu,
  Info,
  CheckCircle2,
} from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const DETECTION_METRICS = [
  {
    key: 'mF1',
    label: 'mF1',
    name: 'Macro F1 Score',
    icon: Activity,
    explanation: 'Macro F1 across evaluated cell classes.',
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
    explanation: 'Inference time per image (ms).',
    unit: 'ms',
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

const CLASSIFICATION_METRICS = [
  {
    key: 'accuracy',
    label: 'Accuracy',
    name: 'Overall Accuracy',
    icon: CheckCircle2,
    explanation: 'Proportion of correctly classified cell images.',
    unit: '',
  },
  {
    key: 'precision',
    label: 'Precision',
    name: 'Macro Precision',
    icon: Target,
    explanation: 'Average positive predictive value across classes.',
    unit: '',
  },
  {
    key: 'recall',
    label: 'Recall',
    name: 'Macro Recall',
    icon: BarChart2,
    explanation: 'Average true positive rate across classes.',
    unit: '',
  },
  {
    key: 'mF1',
    label: 'F1 Score',
    name: 'Macro F1 Score',
    icon: Activity,
    explanation: 'Harmonic mean of precision and recall across classes.',
    unit: '',
  },
  {
    key: 'latency',
    label: 'Latency',
    name: 'Inference Latency',
    icon: Clock,
    explanation: 'Inference time per image (ms).',
    unit: 'ms',
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
 * MetricsPanel — Task-aware Evaluation metric cards
 */
export default function MetricsPanel({ metrics = {}, taskType = 'object_detection', status = 'not_evaluated' }) {
  const isClassification = taskType === 'cell_classification'
  const defs = isClassification ? CLASSIFICATION_METRICS : DETECTION_METRICS

  const statusBadge =
    status === 'completed' || status === 'evaluated'
      ? { text: 'EVALUATION COMPLETE', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' }
      : status === 'not_available'
      ? { text: 'NOT AVAILABLE', color: 'text-amber-400 bg-amber-500/10 border-amber-500/25' }
      : { text: 'AWAITING EVALUATION', color: 'text-text-muted bg-white/[0.03] border-white/[0.08]' }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-crimson" />
            <h3 className="text-xl font-heading font-bold text-white tracking-tight">
              Evaluation Metrics {isClassification ? '(Classification)' : '(Detection)'}
            </h3>
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            {isClassification
              ? 'Classification metrics (Accuracy, Precision, Recall, F1). IoU is not applicable to whole-cell classification.'
              : 'Detection metrics (mF1, Precision, Recall, IoU) computed with SAM proposals and VLM verification.'}
          </p>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono self-start sm:self-auto ${statusBadge.color}`}>
          <Info size={13} />
          <span>{statusBadge.text}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {defs.map((m, idx) => {
          const Icon = m.icon
          const rawValue = metrics[m.key] !== undefined ? metrics[m.key] : (m.key === 'mF1' && metrics.f1 !== undefined ? metrics.f1 : null)

          let displayValue = '—'
          if (status === 'not_available' && rawValue === null) {
            displayValue = 'Not available'
          } else if (rawValue !== null && rawValue !== undefined) {
            if (typeof rawValue === 'number') {
              if (m.unit === 'ms') {
                displayValue = `${Math.round(rawValue)} ms`
              } else if (rawValue <= 1.0 && (m.key === 'mF1' || m.key === 'precision' || m.key === 'recall' || m.key === 'iou' || m.key === 'accuracy')) {
                displayValue = (rawValue * 100).toFixed(1) + '%'
              } else {
                displayValue = String(rawValue)
              }
            } else {
              displayValue = String(rawValue)
            }
          }

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
                    <div className={`font-mono font-extrabold text-white tracking-tight ${displayValue === 'Not available' ? 'text-2xl text-amber-400' : 'text-3xl sm:text-4xl'}`}>
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
