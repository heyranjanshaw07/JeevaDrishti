import { motion } from 'framer-motion'
import { Terminal, Radio, ShieldCheck, Clock } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * ResearchStatus — Small honest research environment standby indicator
 */
export default function ResearchStatus() {
  return (
    <GlassCard className="p-4 sm:p-5 border-white/[0.08] relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-text-muted shrink-0 mt-0.5 sm:mt-0">
            <Terminal size={17} className="text-crimson" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Research Environment
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-crimson/15 text-crimson border border-crimson/30 font-semibold inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
                FRONTEND READY
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Benchmark execution will be connected during the backend and AI integration phase.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono text-text-muted shrink-0 pl-12 sm:pl-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-white/60" />
            <span>Schemas Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-white/60" />
            <span>Awaiting Orchestration</span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
