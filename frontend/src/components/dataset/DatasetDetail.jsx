import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Microscope, Tag, Box, Images, Layers, ShieldCheck, Sparkles, Database } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * DatasetDetail — Reusable modal/drawer component displaying comprehensive metadata
 * for an individual dataset: { name, description, imageCount, testImages, annotatedCells, classes, images }
 */
export default function DatasetDetail({ dataset, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!dataset) return null

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dataset-detail-title"
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25 }}
          className="relative max-w-2xl w-full bg-[#060205] border border-white/15 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 my-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-crimson/15 border border-crimson/30 flex items-center justify-center text-crimson">
                  <Database size={16} />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-crimson/15 border border-crimson/30 text-crimson font-bold">
                  MICRO-OD BENCHMARK
                </span>
              </div>
              <h3 id="dataset-detail-title" className="text-2xl font-heading font-extrabold text-white tracking-tight">
                {dataset.name}
              </h3>
              <p className="text-xs font-mono text-text-muted">
                {dataset.fullName} &bull; {dataset.modality}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-text-muted hover:text-white transition-colors"
              aria-label="Close details"
            >
              <X size={16} />
            </button>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Scientific Overview
            </span>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
              {dataset.description}
            </p>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06]">
              <span className="block text-[10px] font-mono text-text-muted uppercase mb-1">
                Total Images
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {dataset.imageCount || (dataset.testImages + dataset.exampleImages)}
              </span>
              <span className="block text-[9px] font-mono text-text-muted">Partitions</span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06]">
              <span className="block text-[10px] font-mono text-text-muted uppercase mb-1">
                Test Images
              </span>
              <span className="text-lg font-mono font-bold text-crimson">
                {dataset.testImages}
              </span>
              <span className="block text-[9px] font-mono text-text-muted">Evaluation</span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06]">
              <span className="block text-[10px] font-mono text-text-muted uppercase mb-1">
                Annotated Cells
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {dataset.annotatedCells || (dataset.testBoxes ?? dataset.test_boxes ?? 0).toLocaleString()}
              </span>
              <span className="block text-[9px] font-mono text-text-muted">Ground Truth</span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06]">
              <span className="block text-[10px] font-mono text-text-muted uppercase mb-1">
                Classes
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {dataset.classesCount || dataset.classes.length}
              </span>
              <span className="block text-[9px] font-mono text-text-muted">Categories</span>
            </div>
          </div>

          {/* Evaluated Phenotype Classes */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Annotated Cell Categories ({dataset.classes.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {dataset.classes.map((cls) => (
                <div
                  key={cls}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-white flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
                  <span>{cls}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Images preview if available */}
          {dataset.sampleImages && dataset.sampleImages.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                Available Exemplar Asset
              </span>
              <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black max-h-48 flex items-center justify-center">
                <img
                  src={dataset.sampleImages[0].url}
                  alt={dataset.name}
                  className="w-full h-full object-cover max-h-48"
                />
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-text-muted">
            <span>REPOSITORY VERIFIED: MICRO-OD</span>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:text-crimson transition-colors underline font-medium"
            >
              Close Details
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
