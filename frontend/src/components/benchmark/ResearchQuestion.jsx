import { motion } from 'framer-motion'
import { HelpCircle, Sparkles, BookOpen, ChevronRight } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * ResearchQuestion — Core scientific premise highlight card
 */
export default function ResearchQuestion() {
  return (
    <GlassCard className="p-6 sm:p-8 border-white/[0.1] relative overflow-hidden group">
      {/* Background crimson radiance */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-crimson/[0.08] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-l from-crimson/[0.06] to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-crimson/15 border border-crimson/40 text-xs font-mono text-crimson font-bold">
              <Sparkles size={13} />
              <span>CORE HYPOTHESIS</span>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 font-semibold tracking-wider">
              0 / 1 / 3 / 6 SHOT EVALUATION
            </span>
          </div>

          <h3 className="text-base font-mono uppercase tracking-widest text-text-muted font-bold flex items-center gap-2">
            <HelpCircle size={17} className="text-crimson" />
            <span>Research Question</span>
          </h3>

          <p className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-white tracking-tight leading-snug">
            &ldquo;Can a Vision-Language Model detect previously unseen cell types from only a few visual examples?&rdquo;
          </p>

          <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans max-w-2xl">
            Traditional biomedical models require thousands of task-specific annotations. The Micro-OD benchmark investigates whether multimodal cross-attention enables robust few-shot cell localization without continuous retraining.
          </p>
        </div>

        {/* Right side graphical badge */}
        <div className="shrink-0 flex md:flex-col items-center justify-center p-6 rounded-2xl bg-black/60 border border-white/[0.08] text-center space-y-2 min-w-[170px]">
          <span className="text-xs font-mono uppercase text-text-muted tracking-wider">
            EVALUATION PARADIGM
          </span>
          <div className="text-xl font-heading font-black text-white">
            Few-Shot VLM
          </div>
          <div className="text-xs font-mono text-crimson font-semibold">
            In-Context Transfer
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
