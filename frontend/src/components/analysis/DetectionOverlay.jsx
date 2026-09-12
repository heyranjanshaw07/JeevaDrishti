import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Microscope, Scan, Layers, Info, ShieldAlert, Sparkles } from 'lucide-react'
import ResultControls from './ResultControls'

// Scientific cell classes strictly styled in Crimson variations, Pure White, and neutral hematology tones
export const SCIENTIFIC_CLASSES = [
  { id: 'rbc', name: 'Red Blood Cell', color: '#FF2A55', border: 'border-[#FF2A55]', bg: 'bg-[#FF2A55]' },
  { id: 'wbc', name: 'White Blood Cell', color: '#FFFFFF', border: 'border-white', bg: 'bg-white' },
  { id: 'platelet', name: 'Platelet', color: '#FF6B8B', border: 'border-[#FF6B8B]', bg: 'bg-[#FF6B8B]' },
  { id: 'ring_cell', name: 'Ring Cell', color: '#DC2626', border: 'border-[#DC2626]', bg: 'bg-[#DC2626]' },
  { id: 'trophozoite', name: 'Trophozoite', color: '#E11D48', border: 'border-[#E11D48]', bg: 'bg-[#E11D48]' },
  { id: 'schizont', name: 'Schizont', color: '#FDA4AF', border: 'border-[#FDA4AF]', bg: 'bg-[#FDA4AF]' },
  { id: 'gametocyte', name: 'Gametocyte', color: '#E2E8F0', border: 'border-slate-200', bg: 'bg-slate-200' },
]

/**
 * DetectionOverlay — High-Precision Optical Stage for Predicted Bounding Boxes
 * 
 * Supports:
 * - State A (No Results): Uploaded image with "Detection overlay will appear here"
 * - State B (Results Available): SVG/HTML scalable bounding boxes, class labels & confidence
 * - Zero fabricated boxes in empty state
 * - Strict White + Crimson aesthetic
 */
export default function DetectionOverlay({
  image = null,
  results = null, // { detections: [], overlay: null }
  className = '',
}) {
  const [viewMode, setViewMode] = useState('overlay') // 'overlay' | 'original'
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [naturalDims, setNaturalDims] = useState({ w: 1000, h: 1000 })
  const [overlayLoadFailed, setOverlayLoadFailed] = useState(false)
  const containerRef = useRef(null)

  const hasResults = Boolean(results?.detections && results.detections.length > 0)
  const detections = results?.detections || []

  // Reset overlay failed state when overlay url changes
  useEffect(() => {
    setOverlayLoadFailed(false)
  }, [results?.overlay])

  // Mouse-wheel zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el || !image) return

    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.15 : -0.15
      setZoom((prev) => {
        const next = parseFloat((prev + delta).toFixed(2))
        return Math.min(3.0, Math.max(0.5, next))
      })
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [image])

  // Panning handlers
  const handleMouseDown = (e) => {
    if (zoom <= 1.0) return
    setIsPanning(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isPanning || zoom <= 1.0) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => setIsPanning(false)

  const handleZoomIn = () => setZoom((z) => Math.min(3.0, parseFloat((z + 0.25).toFixed(2))))
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))
  const handleReset = () => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
  }

  // Calculate normalized percentage bounding box style regardless of input coordinates
  const getBoxStyle = (bbox) => {
    if (!bbox || bbox.length < 4) return { left: '0%', top: '0%', width: '0%', height: '0%' }
    const [x1, y1, x2, y2] = bbox
    const metaDims = results?.metadata?.image_dimensions
    const refW = naturalDims.w || metaDims?.[0] || 1000
    const refH = naturalDims.h || metaDims?.[1] || 1000

    // Check if normalized 0..1
    if (x2 <= 1.05 && y2 <= 1.05 && (x1 > 0 || x2 > 0 || y1 > 0 || y2 > 0)) {
      return {
        left: `${Math.max(0, x1 * 100)}%`,
        top: `${Math.max(0, y1 * 100)}%`,
        width: `${Math.min(100, (x2 - x1) * 100)}%`,
        height: `${Math.min(100, (y2 - y1) * 100)}%`,
      }
    }

    // Check if pixel coordinates (> 100 or ref dimensions match)
    if (x2 > 100 || y2 > 100) {
      return {
        left: `${Math.max(0, (x1 / refW) * 100)}%`,
        top: `${Math.max(0, (y1 / refH) * 100)}%`,
        width: `${Math.min(100, ((x2 - x1) / refW) * 100)}%`,
        height: `${Math.min(100, ((y2 - y1) / refH) * 100)}%`,
      }
    }

    // Already 0..100 percentage
    return {
      left: `${Math.max(0, x1)}%`,
      top: `${Math.max(0, y1)}%`,
      width: `${Math.min(100, x2 - x1)}%`,
      height: `${Math.min(100, y2 - y1)}%`,
    }
  }

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* 8. RESULT CONTROLS */}
      <ResultControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasResults={hasResults}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleReset}
        onReset={handleReset}
        hasImage={Boolean(image)}
      />

      {/* 2. MAIN DETECTION VIEWER */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-[380px] sm:h-[460px] lg:h-[520px] rounded-2xl bg-[#060205] border border-white/[0.08] overflow-hidden flex items-center justify-center select-none shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] ${
          zoom > 1.0 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        {/* Top-Left: DETECTION OVERLAY Badge */}
        <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-black/85 border border-white/15 text-white text-[10px] font-mono tracking-wider font-semibold backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.8)]">
          <Scan size={12} className="text-crimson" />
          <span>DETECTION OVERLAY</span>
        </div>

        {/* Top-Right: Prediction Status Badge */}
        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-black/85 border border-white/15 text-[10px] font-mono tracking-wider backdrop-blur-md">
          {hasResults ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
              <span className="text-white font-semibold">{detections.length} CELLS DETECTED</span>
            </>
          ) : results?.status === 'rejected' ? (
            <span className="text-ruby font-semibold">REJECTED (NON-MICROSCOPY)</span>
          ) : results?.status === 'failed' ? (
            <span className="text-ruby font-semibold">OVERLAY UNAVAILABLE</span>
          ) : (
            <span className="text-white/50">OVERLAY INACTIVE</span>
          )}
        </div>

        {/* Reticle Crosshair & Corner Marks */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-crimson to-transparent" />
          <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-crimson to-transparent" />
        </div>
        <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-crimson/50 pointer-events-none" />
        <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-crimson/50 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-crimson/50 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-crimson/50 pointer-events-none" />

        {/* Specimen Surface */}
        {image ? (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-4">
            {/* Pannable & Scalable Stage */}
            <div
              className="relative flex items-center justify-center transition-transform duration-75 ease-out max-w-full max-h-full"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <div className="relative inline-flex items-center justify-center max-w-full max-h-full">
                <img
                  src={viewMode === 'overlay' && results?.overlay && !overlayLoadFailed ? results.overlay : image}
                  alt="Detection Field"
                  className="max-w-full max-h-[350px] sm:max-h-[420px] lg:max-h-[480px] object-contain pointer-events-none block rounded-lg shadow-2xl"
                  onLoad={(e) => {
                    if (e.target.naturalWidth && e.target.naturalHeight) {
                      setNaturalDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })
                    }
                  }}
                  onError={() => {
                    if (viewMode === 'overlay' && results?.overlay) {
                      setOverlayLoadFailed(true)
                    }
                  }}
                  draggable={false}
                />

                {/* STATE B — Bounding Boxes Overlay Architecture (Rendered when real detections exist and not using static server overlay) */}
                {hasResults && viewMode === 'overlay' && (!results?.overlay || overlayLoadFailed) && (
                  <div className="absolute inset-0 pointer-events-none">
                    {detections.map((box, idx) => {
                      const classConfig =
                        SCIENTIFIC_CLASSES.find((c) => c.name.toLowerCase() === box.label?.toLowerCase()) ||
                        SCIENTIFIC_CLASSES[0]
                      const boxStyle = getBoxStyle(box.bbox)

                      return (
                        <div
                          key={idx}
                          className={`absolute border-2 ${classConfig.border} bg-crimson/[0.08] transition-all`}
                          style={boxStyle}
                        >
                          <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-black/95 border border-white/30 text-[11px] font-mono font-bold text-white flex items-center gap-1.5 shadow-md whitespace-nowrap">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: classConfig.color }}
                            />
                            <span>{box.label}</span>
                            <span className="text-crimson font-extrabold">
                              {(box.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* STATE A — No Results Overlay Notice */}
            {!hasResults && (
              <div className="absolute bottom-6 inset-x-6 z-20 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto px-5 py-2.5 rounded-xl bg-black/90 border border-white/20 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-2.5 text-sm font-mono text-white/90">
                  <Info size={16} className={results?.status === 'rejected' || results?.status === 'failed' ? 'text-ruby' : 'text-crimson'} />
                  <span>
                    {results?.status === 'rejected'
                      ? 'Detection overlay unavailable: Non-microscopy image rejected'
                      : results?.status === 'failed'
                      ? 'Detection overlay unavailable due to pipeline error'
                      : 'Detection overlay will appear here'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty Stage without uploaded image */
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-white/40 mb-3 shadow-inner">
              <Microscope size={30} className="text-crimson/70" />
            </div>
            <h4 className="text-base font-heading font-bold text-white mb-1">
              Optical Field Offline
            </h4>
            <p className="text-sm text-text-secondary leading-relaxed font-mono">
              Upload a microscopy specimen in the workbench above to calibrate the detection overlay.
            </p>
          </div>
        )}
      </div>

      {/* 3. OVERLAY LEGEND */}
      <div className="p-4 rounded-xl bg-black/50 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono uppercase tracking-wider text-text-muted font-semibold">
            Detection Classes
          </span>
          <span className="text-xs font-mono text-white/60 px-2 py-0.5 rounded bg-white/[0.06] font-semibold">
            {SCIENTIFIC_CLASSES.length} PROFILES
          </span>
        </div>

        {/* Legend Chips (Crimson, pure white & neutral variations) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {SCIENTIFIC_CLASSES.map((cls) => (
            <div
              key={cls.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-white/90 hover:border-white/20 transition-colors"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: cls.color }}
              />
              <span className="text-xs font-medium">{cls.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
