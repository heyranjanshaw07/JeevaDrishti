import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Image as ImageIcon, Sparkles, X, ZoomIn, Layers } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * DatasetGallery — Microscopy samples area displaying real local assets when connected,
 * or an elegant laboratory empty state.
 */
export default function DatasetGallery({ datasets = [], activeDatasetId = 'All' }) {
  const [activeImageModal, setActiveImageModal] = useState(null)

  // Collect all sample images from datasets
  const allSamples = datasets.flatMap((d) =>
    (d.sampleImages || []).map((img) => ({
      ...img,
      datasetName: d.name,
      modality: d.modality,
    }))
  )

  // Filter based on active selection if not 'All'
  const filteredSamples =
    activeDatasetId === 'All'
      ? allSamples
      : allSamples.filter((s) => s.datasetName === activeDatasetId)

  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-crimson" />
            <h3 className="text-lg font-heading font-bold text-white tracking-tight">
              Microscopy Samples
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Verified high-resolution optical fields and few-shot calibration exemplars.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
          <span>{filteredSamples.length} CONNECTED ASSET{filteredSamples.length !== 1 ? 'S' : ''}</span>
        </div>
      </div>

      {/* Samples Grid or Honest Empty State */}
      {filteredSamples.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSamples.map((sample, idx) => (
            <motion.div
              key={sample.url}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="group relative rounded-xl overflow-hidden bg-black/60 border border-white/[0.08] hover:border-crimson/50 transition-all duration-300"
            >
              {/* Image Container */}
              <div className="relative aspect-video sm:aspect-[16/9] w-full overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={sample.url}
                  alt={sample.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                />

                {/* Overlay vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20 pointer-events-none" />

                {/* Dataset pill */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
                  <span>{sample.datasetName}</span>
                </div>

                {/* Inspect button */}
                <button
                  type="button"
                  onClick={() => setActiveImageModal(sample)}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-white hover:text-crimson hover:border-crimson/40 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Zoom sample"
                >
                  <ZoomIn size={15} />
                </button>
              </div>

              {/* Caption Bar */}
              <div className="p-3.5 flex items-center justify-between border-t border-white/[0.06]">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-mono font-bold text-white">
                    {sample.caption}
                  </h4>
                  <p className="text-[10px] font-mono text-text-muted">
                    {sample.modality}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-crimson font-semibold px-2 py-0.5 rounded bg-crimson/10 border border-crimson/25">
                  {sample.tag}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Honest Scientific Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 sm:p-12 rounded-xl bg-black/40 border border-white/[0.06] text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] mx-auto flex items-center justify-center text-text-muted">
            <ImageIcon size={22} className="text-crimson/70" />
          </div>

          <div className="space-y-1 max-w-sm mx-auto">
            <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-text-muted px-2 py-0.5 rounded bg-white/[0.02] border border-white/[0.06] mb-1">
              DATASET PARTITION
            </span>
            <h4 className="text-base font-heading font-extrabold text-white tracking-tight">
              Microscopy samples unavailable
            </h4>
            <p className="text-xs font-sans text-text-secondary leading-relaxed">
              Connect the dataset image source to begin browsing samples.
            </p>
          </div>

          <div className="pt-2 text-[10px] font-mono text-text-muted">
            STORAGE ARCHIVE: <span className="text-white/70">AWAITING LOCAL REPOSITORY INGESTION</span>
          </div>
        </motion.div>
      )}

      {/* Modal Zoom Viewer */}
      <AnimatePresence>
        {activeImageModal && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full bg-[#060205] border border-white/15 rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {activeImageModal.caption}
                  </span>
                  <span className="text-[10px] font-mono text-crimson px-2 py-0.5 rounded bg-crimson/10 border border-crimson/25">
                    {activeImageModal.datasetName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveImageModal(null)}
                  className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-text-muted hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="rounded-xl overflow-hidden max-h-[70vh] flex items-center justify-center bg-black">
                <img
                  src={activeImageModal.url}
                  alt={activeImageModal.caption}
                  className="w-full h-full object-contain max-h-[70vh]"
                />
              </div>

              <div className="text-[11px] font-mono text-text-muted flex items-center justify-between pt-1">
                <span>Modality: {activeImageModal.modality}</span>
                <span>Micro-OD Exemplar Repository</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
