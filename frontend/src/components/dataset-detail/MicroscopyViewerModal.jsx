import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Tag,
  Maximize2,
  Minimize2,
  Layers,
} from 'lucide-react'
import AnnotationOverlay from './AnnotationOverlay'
import ImageMetadata from './ImageMetadata'

/**
 * MicroscopyViewerModal — Fullscreen/modal microscopy examination interface
 * Includes zoom, pan reset, annotation toggle, prev/next controls, and metadata panel.
 */
export default function MicroscopyViewerModal({
  image,
  imagesList = [],
  onClose,
  onSelectImage,
}) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showAnnotations, setShowAnnotations] = useState(false)
  const [dimensions, setDimensions] = useState({ width: null, height: null })
  const imgRef = useRef(null)

  // Current index in list
  const currentIndex = imagesList.findIndex((img) => img.id === image?.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < imagesList.length - 1

  // Keyboard navigation & ESC close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onSelectImage(imagesList[currentIndex - 1])
      } else if (e.key === 'ArrowRight' && hasNext) {
        onSelectImage(imagesList[currentIndex + 1])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, hasPrev, hasNext, onClose, onSelectImage, imagesList])

  // Reset zoom on image change
  useEffect(() => {
    setZoomLevel(1)
  }, [image?.id])

  const handleImageLoad = (e) => {
    if (e.target) {
      setDimensions({
        width: e.target.naturalWidth,
        height: e.target.naturalHeight,
      })
    }
  }

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 3))
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75))
  const handleResetZoom = () => setZoomLevel(1)

  if (!image) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none"
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-6xl h-[92vh] bg-[#060205] border border-white/15 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Top Bar */}
          <div className="h-14 px-4 sm:px-6 bg-[#060205] border-b border-white/[0.08] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-white truncate max-w-xs sm:max-w-md">
                {image.fileName}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crimson/15 text-crimson border border-crimson/30 font-bold">
                {image.dataset} &bull; {image.split}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Annotation Toggle */}
              <button
                type="button"
                onClick={() => setShowAnnotations(!showAnnotations)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 ${
                  showAnnotations
                    ? 'bg-crimson text-white border-crimson shadow-[0_0_10px_rgba(255,42,85,0.4)] font-bold'
                    : 'bg-white/[0.03] border-white/[0.08] text-text-muted hover:text-white'
                }`}
              >
                <Tag size={13} />
                <span>Annotations: {showAnnotations ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-text-muted hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body Area (Canvas + Metadata Sidebar) */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
            {/* Main Microscopy Canvas */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden p-4">
              {/* Navigation arrows (Previous / Next) */}
              {hasPrev && (
                <button
                  type="button"
                  onClick={() => onSelectImage(imagesList[currentIndex - 1])}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-xl bg-black/70 hover:bg-crimson text-white border border-white/10 hover:border-crimson transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} />
                </button>
              )}

              {hasNext && (
                <button
                  type="button"
                  onClick={() => onSelectImage(imagesList[currentIndex + 1])}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-xl bg-black/70 hover:bg-crimson text-white border border-white/10 hover:border-crimson transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight size={18} />
                </button>
              )}

              {/* Microscopy Image Frame */}
              <div className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden">
                <motion.div
                  style={{ scale: zoomLevel }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="relative flex items-center justify-center"
                >
                  <img
                    ref={imgRef}
                    src={image.url}
                    alt={image.fileName}
                    onLoad={handleImageLoad}
                    className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-none"
                  />
                  {/* Annotation Overlay */}
                  <AnnotationOverlay
                    annotations={image.annotations || []}
                    showAnnotations={showAnnotations}
                    imageDimensions={dimensions}
                  />
                </motion.div>
              </div>

              {/* Zoom & View Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  aria-label="Zoom Out"
                  className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <ZoomOut size={15} />
                </button>

                <span className="text-[11px] font-mono px-2 text-white font-bold min-w-[45px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  aria-label="Zoom In"
                  className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <ZoomIn size={15} />
                </button>

                <div className="w-[1px] h-4 bg-white/20 mx-1" />

                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                  aria-label="Reset Zoom"
                  className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            {/* Right Side: Metadata Panel */}
            <div className="w-full lg:w-72 bg-[#060205] border-t lg:border-t-0 lg:border-l border-white/[0.08] p-4 shrink-0 overflow-y-auto">
              <ImageMetadata image={image} dimensions={dimensions} />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
