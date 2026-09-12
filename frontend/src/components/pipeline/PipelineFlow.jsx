import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  Info,
  Terminal,
  Activity,
  Layers,
  ArrowDown,
  Sparkles,
} from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import PipelineStage, { PIPELINE_STAGES } from './PipelineStage'

/**
 * PipelineFlow — Large interactive pipeline visualization with animated connectors
 * and detailed stage inspection panel.
 */
export default function PipelineFlow() {
  const [selectedStep, setSelectedStep] = useState('01')

  const activeStage =
    PIPELINE_STAGES.find((s) => s.step === selectedStep) || PIPELINE_STAGES[0]

  return (
    <GlassCard className="p-6 sm:p-8 border-white/[0.08] relative overflow-hidden space-y-8">
      {/* Background ambient radiance */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-40 bg-crimson/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_8px_#FF2A55]" />
            <h2 className="text-xl font-heading font-extrabold text-white tracking-tight">
              Interactive Pipeline Architecture
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Click any stage to inspect its role, transformation contract, and algorithmic behavior.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] font-mono text-text-muted self-start sm:self-auto">
          <span>INSPECTING STAGE {selectedStep} OF 06</span>
        </div>
      </div>

      {/* Pipeline Grid with Connection Visuals */}
      <div className="relative z-10">
        {/* Desktop continuous connector line */}
        <div className="hidden xl:block absolute top-[52px] left-[5%] right-[5%] h-[2px] bg-gradient-to-r from-crimson/20 via-crimson/50 to-crimson/20 pointer-events-none z-0" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 relative z-10">
          {PIPELINE_STAGES.map((st, idx) => {
            const isSelected = selectedStep === st.step
            const isSubdued = Boolean(selectedStep && !isSelected)
            const isLast = idx === PIPELINE_STAGES.length - 1

            return (
              <div key={st.step} className="flex flex-col relative">
                <PipelineStage
                  stage={st}
                  isSelected={isSelected}
                  onSelect={setSelectedStep}
                  isSubdued={isSubdued}
                />

                {/* Mobile / Tablet arrow indicator */}
                {!isLast && (
                  <div className="xl:hidden flex justify-center py-1 text-crimson/50">
                    <ChevronDown size={14} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Stage Detail Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStage.step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="p-5 sm:p-6 rounded-2xl bg-black/70 border border-crimson/30 shadow-[0_0_25px_rgba(255,42,85,0.12)] relative z-10 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-crimson/15 border border-crimson/30 flex items-center justify-center text-crimson">
                <activeStage.icon size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-crimson">
                    STAGE {activeStage.step}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-white/70">
                    {activeStage.shortTitle}
                  </span>
                </div>
                <h3 className="text-lg font-heading font-extrabold text-white tracking-tight">
                  {activeStage.title}
                </h3>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-crimson/10 border border-crimson/25 text-crimson font-bold self-start sm:self-auto">
              ALGORITHMIC SPECIFICATION
            </span>
          </div>

          <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans">
            {activeStage.technicalDetails}
          </p>

          {/* Transformation Contract: Input -> Output */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[10px] font-mono uppercase text-text-muted flex items-center gap-1.5">
                <span>Input Contract</span>
              </span>
              <span className="text-xs font-mono font-bold text-white block">
                {activeStage.input}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-crimson/[0.04] border border-crimson/20 space-y-1">
              <span className="text-[10px] font-mono uppercase text-crimson flex items-center gap-1.5">
                <span>Output Contract</span>
              </span>
              <span className="text-xs font-mono font-bold text-white block">
                {activeStage.output}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </GlassCard>
  )
}
