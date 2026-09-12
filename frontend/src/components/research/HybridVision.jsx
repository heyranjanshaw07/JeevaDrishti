import { motion } from 'framer-motion'
import { Cpu, Focus, ShieldCheck, Layers } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * HybridVision — Explains the hybrid proposal generation + VLM reasoning concept
 */
export default function HybridVision() {
  return (
    <GlassCard className="p-6 sm:p-8 border-white/[0.08] relative overflow-hidden space-y-5">
      {/* Subtle crimson radiance */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-crimson/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-crimson" />
            <h3 className="text-xl font-heading font-bold text-white tracking-tight">
              Hybrid Vision Intelligence
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
            JeevaDrishti combines object proposal generation with vision-language classification to transform a microscopy image into candidate cellular regions and classify those regions.
          </p>

          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-text-muted pt-1">
            <span className="px-2.5 py-1 rounded bg-black/40 border border-white/[0.06]">
              Sub-pixel Boundary Proposals
            </span>
            <span className="px-2.5 py-1 rounded bg-black/40 border border-white/[0.06]">
              In-Context VLM Prompting
            </span>
            <span className="px-2.5 py-1 rounded bg-black/40 border border-white/[0.06]">
              Decoupled Architecture
            </span>
          </div>
        </div>

        {/* Conceptual Dual-Core Graphic */}
        <div className="grid grid-cols-2 gap-3 shrink-0 sm:min-w-[280px]">
          <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06] text-center space-y-1">
            <Focus size={16} className="text-crimson mx-auto mb-1" />
            <span className="text-xs font-mono font-bold text-white block">
              Proposals
            </span>
            <span className="text-[10px] font-mono text-text-muted">
              Spatial Localization
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06] text-center space-y-1">
            <Cpu size={16} className="text-white mx-auto mb-1" />
            <span className="text-xs font-mono font-bold text-white block">
              VLM
            </span>
            <span className="text-[10px] font-mono text-text-muted">
              Semantic Verification
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
