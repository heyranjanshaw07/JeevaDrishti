import { motion } from 'framer-motion'
import { Layers, ArrowRight, ArrowDown, Activity, CheckCircle2, AlertCircle } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const PIPELINE_NODES = [
  { id: 'image', label: 'IMAGE', sub: 'Specimen Ingestion' },
  { id: 'sam', label: 'SAM / PROPOSALS', sub: 'Zero-Shot Masks' },
  { id: 'regions', label: 'CANDIDATE REGIONS', sub: 'Morphology Filter' },
  { id: 'vlm', label: 'VLM CLASSIFICATION', sub: 'Few-Shot Semantics' },
  { id: 'detection', label: 'CELL DETECTION', sub: 'Final Predictions' },
]

/**
 * PipelineStatus — Visual execution flow for the AI Microscopy inference pipeline
 * 
 * Supported states:
 * - 'Idle'
 * - 'Ready' (Default)
 * - 'Processing'
 * - 'Complete'
 * - 'Error'
 */
export default function PipelineStatus({
  status = 'Ready', // 'Idle' | 'Ready' | 'Processing' | 'Complete' | 'Error'
  activeStep = 0,
}) {
  const getStatusBadge = () => {
    switch (status) {
      case 'Processing':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-crimson/15 text-crimson border border-crimson/30 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
            PROCESSING
          </span>
        )
      case 'Complete':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/10 text-white border border-white/20 font-mono text-[10px]">
            <CheckCircle2 size={11} className="text-white" />
            COMPLETE
          </span>
        )
      case 'Error':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-ruby/20 text-ruby border border-ruby/40 font-mono text-[10px]">
            <AlertCircle size={11} />
            ERROR
          </span>
        )
      case 'Idle':
        return (
          <span className="px-2.5 py-0.5 rounded bg-white/[0.04] text-text-muted border border-white/[0.08] font-mono text-[10px]">
            IDLE
          </span>
        )
      case 'Ready':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-crimson/10 text-white border border-crimson/30 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
            READY
          </span>
        )
    }
  }

  return (
    <GlassCard className="p-4 sm:p-5 border-white/[0.08]" glow>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-crimson" />
          <h4 className="text-xs font-heading font-bold text-white tracking-wider uppercase">
            ANALYSIS PIPELINE STATUS
          </h4>
        </div>
        {getStatusBadge()}
      </div>

      {/* Responsive Step Flow: Horizontal on md/lg, Vertical on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 items-center relative">
        {PIPELINE_NODES.map((node, idx) => {
          const isCurrent = status === 'Processing' && activeStep === idx
          const isCompleted = status === 'Complete' || (status === 'Processing' && idx < activeStep)

          return (
            <div key={node.id} className="relative flex flex-col items-center text-center">
              {/* Node Card */}
              <div
                className={`w-full p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center min-h-[72px] ${
                  isCurrent
                    ? 'bg-crimson/15 border-crimson shadow-[0_0_15px_rgba(255,42,85,0.3)]'
                    : isCompleted
                    ? 'bg-white/[0.06] border-white/30'
                    : 'bg-black/50 border-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-mono font-bold text-crimson">
                    0{idx + 1}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-white tracking-tight">
                    {node.label}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-white/50 truncate max-w-full">
                  {node.sub}
                </span>
              </div>

              {/* Connecting Chevron on Desktop (hidden after last item) */}
              {idx < PIPELINE_NODES.length - 1 && (
                <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-white/20">
                  <ArrowRight size={14} className="text-white/30" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
