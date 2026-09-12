import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Database, Box, Tag, Images } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const DATASETS = [
  {
    name: 'BBBC',
    fullName: 'Broad Bioimage Benchmark Collection',
    testImages: '53',
    testBoxes: '4,000',
    classes: '6',
    modality: 'Fluorescence Microscopy',
  },
  {
    name: 'BCCD',
    fullName: 'Blood Cell Count and Detection',
    testImages: '53',
    testBoxes: '952',
    classes: '3',
    modality: 'Peripheral Blood Smears',
  },
  {
    name: 'LIVECell',
    fullName: 'Large-scale Phase Contrast Cell Dataset',
    testImages: '53',
    testBoxes: '223',
    classes: '3',
    modality: 'Phase-Contrast Label-Free',
  },
  {
    name: 'NIH-3T3',
    fullName: 'Mouse Embryonic Fibroblast Cell Line',
    testImages: '53',
    testBoxes: '376',
    classes: '3',
    modality: 'Brightfield / Phase Cells',
  },
]

/**
 * BenchmarkDatasetCards — Verified benchmark dataset summary cards
 */
export default function BenchmarkDatasetCards() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Database size={18} className="text-crimson" />
            <h3 className="text-xl font-heading font-bold text-white tracking-tight">
              Benchmark Datasets
            </h3>
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            Four specialized cellular microscopy domains evaluated under identical few-shot conditions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DATASETS.map((ds, idx) => (
          <motion.div
            key={ds.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.08 }}
          >
            <GlassCard
              hover
              className="p-5 border-white/[0.08] hover:border-crimson/50 transition-all duration-300 flex flex-col justify-between h-full group relative overflow-hidden"
            >
              {/* Subtle crimson accent flare on card */}
              <div className="absolute top-0 right-0 w-28 h-28 bg-crimson/[0.03] group-hover:bg-crimson/[0.08] rounded-full blur-2xl transition-colors pointer-events-none" />

              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-2xl font-heading font-extrabold text-white tracking-tight group-hover:text-crimson transition-colors">
                      {ds.name}
                    </h4>
                    <p className="text-xs font-mono text-text-muted line-clamp-1 mt-0.5">
                      {ds.fullName}
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70">
                    BENCHMARK
                  </span>
                </div>

                {/* Modality tag */}
                <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.05] text-xs font-mono text-text-secondary">
                  {ds.modality}
                </div>

                {/* Key Metrics: Test Images, Test Boxes, Classes */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/[0.06]">
                  <div>
                    <div className="flex items-center gap-1 text-xs font-mono text-text-muted mb-0.5">
                      <Images size={13} className="text-text-muted" />
                      <span>Images</span>
                    </div>
                    <span className="text-base font-mono font-bold text-white">
                      {ds.testImages}
                    </span>
                    <span className="block text-[11px] font-mono text-text-muted">Test</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-xs font-mono text-text-muted mb-0.5">
                      <Box size={13} className="text-crimson" />
                      <span>Boxes</span>
                    </div>
                    <span className="text-base font-mono font-bold text-white">
                      {ds.testBoxes}
                    </span>
                    <span className="block text-[11px] font-mono text-text-muted">Test</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-xs font-mono text-text-muted mb-0.5">
                      <Tag size={13} className="text-text-muted" />
                      <span>Classes</span>
                    </div>
                    <span className="text-base font-mono font-bold text-white">
                      {ds.classes}
                    </span>
                    <span className="block text-[11px] font-mono text-text-muted">Types</span>
                  </div>
                </div>
              </div>

              {/* View Dataset Link Button */}
              <div className="mt-5 pt-3 border-t border-white/[0.05]">
                <Link
                  to="/datasets"
                  className="w-full py-2.5 px-3 rounded-lg bg-white/[0.03] hover:bg-crimson/15 border border-white/[0.08] hover:border-crimson/40 text-sm font-mono text-white/80 hover:text-white flex items-center justify-between transition-all duration-200 group/btn"
                >
                  <span className="font-semibold tracking-wide">View Dataset</span>
                  <ArrowUpRight size={14} className="text-crimson group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
