import { Link } from 'react-router-dom'
import { BarChart3, Database, ArrowRight } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * ResearchCTA — Dual CTA section navigating to Benchmark and Dataset Explorer
 */
export default function ResearchCTA() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Benchmark CTA */}
      <GlassCard hover className="p-6 sm:p-7 border-white/[0.08] hover:border-crimson/40 transition-all flex flex-col justify-between group">
        <div className="space-y-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-crimson/15 border border-crimson/30 flex items-center justify-center text-crimson">
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 className="text-xl font-heading font-extrabold text-white tracking-tight group-hover:text-crimson transition-colors">
              Explore the Benchmark
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed font-sans">
              Compare evaluation configurations across the Micro-OD microscopy benchmark.
            </p>
          </div>
        </div>

        <Link
          to="/benchmark"
          className="w-full py-2.5 px-4 rounded-xl bg-crimson/15 hover:bg-crimson text-white border border-crimson/35 hover:border-crimson text-xs font-mono font-bold tracking-wide flex items-center justify-between transition-all group/btn"
        >
          <span>Open Benchmark</span>
          <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </GlassCard>

      {/* Dataset Explorer CTA */}
      <GlassCard hover className="p-6 sm:p-7 border-white/[0.08] hover:border-crimson/40 transition-all flex flex-col justify-between group">
        <div className="space-y-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center text-white">
            <Database size={18} />
          </div>
          <div>
            <h3 className="text-xl font-heading font-extrabold text-white tracking-tight group-hover:text-crimson transition-colors">
              Explore the Datasets
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed font-sans">
              Browse the microscopy datasets used throughout the JeevaDrishti research workflow.
            </p>
          </div>
        </div>

        <Link
          to="/dataset"
          className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-crimson text-white border border-white/[0.12] hover:border-crimson text-xs font-mono font-bold tracking-wide flex items-center justify-between transition-all group/btn"
        >
          <span>Open Dataset Explorer</span>
          <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </GlassCard>
    </div>
  )
}
