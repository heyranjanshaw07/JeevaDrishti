import { motion } from 'framer-motion'
import { HelpCircle, Sparkles, Compass } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * ResearchQuestion — Prominent core scientific hypothesis card
 */
export default function ResearchQuestion() {
  return (
    <GlassCard className="p-6 sm:p-9 border-white/[0.1] relative overflow-hidden group">
      {/* Background ambient crimson radiance */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-crimson/[0.08] rounded-full blur-3xl pointer-events-none" />

      {/* Subtle scientific grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-crimson/15 border border-crimson/40 text-[10px] font-mono text-crimson font-bold">
              <Sparkles size={11} />
              <span>PRIMARY INQUIRY</span>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 font-semibold tracking-wider">
              MULTIMODAL GENERALIZATION
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-crimson font-bold flex items-center gap-1.5">
              <HelpCircle size={14} />
              <span>Research Question</span>
            </span>

            <p className="text-2xl sm:text-3xl md:text-4xl font-heading font-black text-white tracking-tight leading-snug">
              &ldquo;Can a Vision-Language Model detect previously unseen cell types from only a few visual examples?&rdquo;
            </p>
          </div>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans max-w-2xl">
            Contemporary biomedical detection pipelines often require massive re-training whenever staining protocols or optical modalities shift. JeevaDrishti explores whether few-shot in-context multimodal conditioning can enable cross-domain localization without continuous gradient updates.
          </p>
        </div>

        {/* Right graphical highlight badge */}
        <div className="shrink-0 flex md:flex-col items-center justify-center p-6 rounded-2xl bg-black/70 border border-white/[0.08] text-center space-y-2 min-w-[170px]">
          <span className="text-[10px] font-mono uppercase text-text-muted tracking-wider">
            INVESTIGATION AXIS
          </span>
          <div className="text-xl font-heading font-black text-white">
            0 &rarr; 6 Shot
          </div>
          <div className="text-[10px] font-mono text-crimson font-bold">
            Morphology Transfer
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
