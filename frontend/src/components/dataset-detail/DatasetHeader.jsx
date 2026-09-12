import { Link } from 'react-router-dom'
import { ArrowLeft, Database, Sparkles, Layers, Box, Tag, Images } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * DatasetHeader — Premium dataset detail banner with breadcrumb back link and verified KPIs
 */
export default function DatasetHeader({ dataset }) {
  if (!dataset) return null

  return (
    <div className="space-y-4">
      {/* Back to Explorer Link */}
      <Link
        to="/dataset"
        className="inline-flex items-center gap-2 text-xs font-mono text-text-muted hover:text-crimson transition-colors group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Dataset Explorer</span>
      </Link>

      {/* Main Header Card */}
      <GlassCard className="p-6 sm:p-8 border-white/[0.08] relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-crimson/[0.05] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-crimson/15 border border-crimson/30 flex items-center justify-center text-crimson">
                <Database size={16} />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-crimson/15 border border-crimson/35 text-crimson font-bold">
                MICRO-OD DATASET
              </span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-secondary">
                {dataset.modality}
              </span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight">
                {dataset.name}
              </h1>
              <p className="text-xs sm:text-sm font-mono text-text-muted mt-0.5">
                {dataset.fullName}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans max-w-2xl">
              {dataset.description}
            </p>
          </div>

          {/* Key Verified Stats Grid */}
          <div className="grid grid-cols-3 gap-3 shrink-0 lg:min-w-[340px]">
            <div className="p-4 rounded-xl bg-black/50 border border-white/[0.06] text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-text-muted">
                <Images size={11} className="text-text-muted" />
                <span>Test Images</span>
              </div>
              <div className="text-2xl font-mono font-extrabold text-white">
                {dataset.testImages}
              </div>
              <span className="block text-[9px] font-mono text-text-muted">Partition</span>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/[0.06] text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-text-muted">
                <Box size={11} className="text-crimson" />
                <span>Test Boxes</span>
              </div>
              <div className="text-2xl font-mono font-extrabold text-crimson">
                {(dataset.testBoxes ?? dataset.test_boxes ?? 0).toLocaleString()}
              </div>
              <span className="block text-[9px] font-mono text-text-muted">Annotations</span>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/[0.06] text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-text-muted">
                <Tag size={11} className="text-text-muted" />
                <span>Classes</span>
              </div>
              <div className="text-2xl font-mono font-extrabold text-white">
                {dataset.classesCount}
              </div>
              <span className="block text-[9px] font-mono text-text-muted">Categories</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
