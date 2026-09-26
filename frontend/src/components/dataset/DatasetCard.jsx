import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Database, Box, Tag, Images, Layers, Microscope } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import AnimatedNumber from '@/components/ui/AnimatedNumber'

/**
 * DatasetCard — Individual dataset representation in grid or list layout
 */
export default function DatasetCard({ dataset, onExplore, viewMode = 'grid', index = 0 }) {
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: index * 0.04 }}
      >
        <GlassCard
          hover
          className="p-4 sm:p-5 border-white/[0.08] hover:border-crimson/40 transition-all duration-200 group"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-2xl">
              <div className="w-10 h-10 rounded-xl bg-crimson/15 border border-crimson/30 flex items-center justify-center text-crimson shrink-0 mt-0.5">
                <Microscope size={18} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-heading font-extrabold text-white tracking-tight group-hover:text-crimson transition-colors">
                    {dataset.name}
                  </h3>
                  <span className="text-[10px] font-mono text-text-muted">
                    ({dataset.fullName})
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70">
                    {dataset.modality}
                  </span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-1 font-sans">
                  {dataset.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 shrink-0 pl-13 md:pl-0 border-t md:border-t-0 pt-2 md:pt-0 border-white/[0.05]">
              <div className="flex items-center gap-5 text-center">
                <div>
                  <span className="block text-sm font-mono font-bold text-white">
                    {dataset.testImages}
                  </span>
                  <span className="block text-[9px] font-mono text-text-muted uppercase">
                    Test Images
                  </span>
                </div>

                <div>
                  <span className="block text-sm font-mono font-bold text-crimson">
                    {dataset.testBoxes != null
                      ? dataset.testBoxes.toLocaleString()
                      : (dataset.taskType === 'cell_classification' ? 'N/A' : 'Not available')}
                  </span>
                  <span className="block text-[9px] font-mono text-text-muted uppercase">
                    {dataset.taskType === 'cell_classification' ? 'Task Type' : 'Test Boxes'}
                  </span>
                </div>

                <div>
                  <span className="block text-sm font-mono font-bold text-white">
                    {dataset.classesCount}
                  </span>
                  <span className="block text-[9px] font-mono text-text-muted uppercase">
                    Classes
                  </span>
                </div>
              </div>

              <Link
                to={`/dataset/${dataset.id}`}
                className="px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-crimson/20 border border-white/[0.08] hover:border-crimson/40 text-xs font-mono text-white flex items-center gap-1.5 transition-all group/btn"
              >
                <span>Explore Dataset</span>
                <ArrowRight size={13} className="text-crimson group-hover/btn:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    )
  }

  // Grid Mode (Default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="h-full"
    >
      <GlassCard
        hover
        className="p-6 border-white/[0.08] hover:border-crimson/50 transition-all duration-300 flex flex-col justify-between h-full group relative overflow-hidden"
      >
        {/* Ambient card highlight */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-crimson/[0.03] group-hover:bg-crimson/[0.08] rounded-full blur-2xl transition-colors pointer-events-none" />

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-heading font-extrabold text-white tracking-tight group-hover:text-crimson transition-colors">
                  {dataset.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/70">
                  {dataset.modality}
                </span>
              </div>
              <p className="text-[11px] font-mono text-text-muted mt-0.5 line-clamp-1">
                {dataset.fullName}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-crimson/10 border border-crimson/25 flex items-center justify-center text-crimson shrink-0">
              <Microscope size={15} />
            </div>
          </div>

          {/* Description */}
          <p className="text-xs font-sans text-text-secondary leading-relaxed line-clamp-3">
            {dataset.description}
          </p>

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/[0.06] bg-black/30 rounded-xl px-3">
            <div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted mb-0.5">
                <Images size={11} className="text-text-muted" />
                <span>Test</span>
              </div>
              <span className="text-sm font-mono font-bold text-white">
                <AnimatedNumber value={dataset.testImages} />
              </span>
              <span className="block text-[9px] font-mono text-text-muted">Images</span>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted mb-0.5">
                <Box size={11} className="text-crimson" />
                <span>{dataset.taskType === 'cell_classification' ? 'Task' : 'Boxes'}</span>
              </div>
              <span className="text-sm font-mono font-bold text-white">
                {dataset.testBoxes != null ? (
                  <AnimatedNumber value={dataset.testBoxes} />
                ) : (
                  <span className="text-text-muted text-xs">
                    {dataset.taskType === 'cell_classification' ? 'Classify' : 'Not available'}
                  </span>
                )}
              </span>
              <span className="block text-[9px] font-mono text-text-muted">
                {dataset.taskType === 'cell_classification' ? 'Single Cell' : 'Test Boxes'}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted mb-0.5">
                <Tag size={11} className="text-text-muted" />
                <span>Classes</span>
              </div>
              <span className="text-sm font-mono font-bold text-white">
                <AnimatedNumber value={dataset.classesCount} />
              </span>
              <span className="block text-[9px] font-mono text-text-muted">Categories</span>
            </div>
          </div>

          {/* Class tags previews */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-text-muted tracking-wider block">
              Sample Categories
            </span>
            <div className="flex flex-wrap gap-1.5">
              {dataset.classes.slice(0, 3).map((cls) => (
                <span
                  key={cls}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-white/80"
                >
                  {cls}
                </span>
              ))}
              {dataset.classes.length > 3 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-crimson/10 border border-crimson/25 text-crimson font-semibold">
                  +{dataset.classes.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Explore Button */}
        <div className="mt-5 pt-3 border-t border-white/[0.05]">
          <Link
            to={`/dataset/${dataset.id}`}
            className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] hover:bg-crimson/15 border border-white/[0.08] hover:border-crimson/40 text-xs font-mono text-white flex items-center justify-between transition-all group/btn"
          >
            <span className="font-semibold tracking-wide">Explore Dataset</span>
            <ArrowRight size={13} className="text-crimson group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </GlassCard>
    </motion.div>
  )
}
