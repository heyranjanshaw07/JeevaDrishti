import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Play, BookOpen, Layers } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * PipelineHero — Hero section for the Vision Pipeline architecture explanation
 */
export default function PipelineHero() {
  return (
    <GlassCard className="p-6 sm:p-10 border-white/[0.08] relative overflow-hidden" glow>
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-crimson/[0.07] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-4xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson/15 border border-crimson/35 text-[11px] font-mono text-crimson font-bold">
          <Layers size={12} />
          <span>VISION PIPELINE</span>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-white tracking-tight leading-tight">
            From Microscopy to Intelligence.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-text-secondary leading-relaxed font-sans max-w-3xl">
            An adaptive vision-language pipeline for detecting previously unseen cell types from optical microscopy images.
          </p>
        </div>

        {/* Supporting statement */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] max-w-2xl">
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans">
            &ldquo;JeevaDrishti combines object proposals with vision-language reasoning to transform microscopic visual evidence into interpretable cell detections.&rdquo;
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            to="/analyze"
            className="px-5 py-2.5 rounded-xl bg-crimson hover:bg-crimson-600 text-white text-xs font-mono font-bold tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgba(255,42,85,0.35)] transition-all group"
          >
            <Play size={13} fill="currentColor" />
            <span>Run Analysis</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/research"
            className="px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white text-xs font-mono font-medium tracking-wide flex items-center gap-2 transition-all"
          >
            <BookOpen size={14} />
            <span>Explore Research</span>
          </Link>
        </div>
      </div>
    </GlassCard>
  )
}
