import { motion } from 'framer-motion'
import { Target, CheckCircle2, AlertCircle } from 'lucide-react'

/**
 * Detection result card — shows one detected cell
 */
export default function DetectionCard({ detection, index }) {
  const confidence = detection.confidence
  const isHigh = confidence >= 0.85
  const isMed = confidence >= 0.70

  return (
    <motion.div
      className="glass-card p-3 flex items-center gap-3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Index */}
      <div className="w-8 h-8 rounded-lg bg-crimson/10 border border-crimson/25 flex items-center justify-center shrink-0">
        <Target size={14} className="text-crimson" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-text-primary truncate">{detection.cell_type}</p>
          <span className={`text-xs font-mono font-bold ${isHigh ? 'text-crimson' : isMed ? 'text-white' : 'text-ruby-400'}`}>
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-void rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isHigh ? 'bg-crimson' : isMed ? 'bg-white' : 'bg-ruby-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${confidence * 100}%` }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
            />
          </div>
          <span className="text-[10px] text-text-muted font-mono whitespace-nowrap">
            [{detection.bbox.x}, {detection.bbox.y}]
          </span>
        </div>
      </div>

      {/* Status icon */}
      {isHigh ? (
        <CheckCircle2 size={14} className="text-crimson shrink-0" />
      ) : (
        <AlertCircle size={14} className="text-ruby-400 shrink-0" />
      )}
    </motion.div>
  )
}
