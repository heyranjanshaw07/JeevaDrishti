import { motion } from 'framer-motion'
import { Focus, Cpu, ArrowRight, ShieldAlert, CheckCircle2, Layers } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const FLOW_STEPS = [
  { step: 'SAM', label: 'Proposal Engine' },
  { step: 'Region Proposals', label: 'Spatial Boundaries' },
  { step: 'VLM', label: 'Multimodal Transformer' },
  { step: 'Semantic Classification', label: 'Phenotype Labels' },
]

/**
 * HybridArchitecture — Comparison between Pure VLM and the JeevaDrishti Hybrid Pipeline
 */
export default function HybridArchitecture() {
  return (
    <GlassCard className="p-6 sm:p-8 border-white/[0.08] relative overflow-hidden space-y-7">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-crimson" />
          <h2 className="text-xl font-heading font-extrabold text-white tracking-tight">
            Why Hybrid Vision?
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-text-secondary font-sans max-w-2xl">
          Cellular microscopy demands both sub-pixel boundary acuity and high-level biomedical taxonomy reasoning.
        </p>
      </div>

      {/* Visual Sequence: SAM -> Region Proposals -> VLM -> Semantic Classification */}
      <div className="p-4 rounded-xl bg-black/50 border border-white/[0.06] overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-between gap-3 min-w-[580px]">
          {FLOW_STEPS.map((s, idx) => (
            <div key={s.step} className="flex items-center gap-3 flex-1">
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] flex-1 text-center space-y-0.5">
                <span className="text-xs font-mono font-bold text-white block">
                  {s.step}
                </span>
                <span className="text-[10px] font-mono text-crimson block">
                  {s.label}
                </span>
              </div>
              {idx < FLOW_STEPS.length - 1 && (
                <ArrowRight size={14} className="text-crimson shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CARD 1: Pure Vision-Language Detection */}
        <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-text-muted">
              <ShieldAlert size={16} />
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                Single-Model Baseline
              </span>
            </div>

            <h3 className="text-base font-heading font-extrabold text-white tracking-tight">
              Pure Vision-Language Detection
            </h3>

            <p className="text-xs font-sans text-text-secondary leading-relaxed">
              Directly asking a VLM to locate and classify cells can struggle with fine-grained microscopy boundaries and domain-specific visual patterns.
            </p>
          </div>

          <div className="pt-3 border-t border-white/[0.04] text-[10px] font-mono text-text-muted">
            LIMITATION: HIGH SPATIAL JITTER ON SUB-MICRON CELL BORDERS
          </div>
        </div>

        {/* CARD 2: JeevaDrishti Hybrid Pipeline */}
        <div className="p-5 sm:p-6 rounded-2xl bg-crimson/[0.06] border border-crimson/30 shadow-[0_0_20px_rgba(255,42,85,0.1)] space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-crimson">
              <CheckCircle2 size={16} />
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                JeevaDrishti Architecture
              </span>
            </div>

            <h3 className="text-base font-heading font-extrabold text-white tracking-tight">
              JeevaDrishti Hybrid Pipeline
            </h3>

            <p className="text-xs font-sans text-white/90 leading-relaxed">
              Object proposals first narrow the visual search space, while the VLM provides semantic reasoning over candidate regions.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-crimson/20 border border-crimson/40 text-xs font-mono font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-crimson shadow-[0_0_8px_#FF2A55]" />
              <span>Proposal + Reasoning</span>
            </div>
          </div>

          <div className="pt-3 border-t border-crimson/20 text-[10px] font-mono text-crimson font-semibold">
            ADVANTAGE: DECOUPLED SPATIAL LOCALIZATION &amp; FEW-SHOT TAXONOMY
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
