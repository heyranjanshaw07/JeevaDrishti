import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Microscope, Upload, Image as ImageIcon, X, ZoomIn, ZoomOut,
  Maximize2, RotateCcw, RefreshCw, AlertCircle, Trash2,
  FileImage, Layers
} from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB
const SUPPORTED_EXTENSIONS = ['png', 'jpg', 'jpeg']

/**
 * MicroscopyViewer — Real Microscopy Image Upload & Interactive Viewport
 * 
 * Features:
 * - Frontend-only file upload & drag & drop with validation
 * - Native format (PNG, JPG, JPEG) and size (<50MB) checks
 * - Safe memory management (URL.revokeObjectURL)
 * - Interactive optical viewer: zoom (50%-300%), mouse-wheel zoom, pan
 * - HUD labels: "LIVE IMAGE" and "UNPROCESSED"
 * - Compact floating viewer controls: Zoom In/Out, Fit, Reset, Replace, Remove
 * - Real image metadata extraction: File name, Dimensions, Format, Size
 */
export default function MicroscopyViewer({
  file = null,
  preview = null,
  onFileSelect,
  onClear,
  currentDataset = 'Micro-OD',
}) {
  const fileInputRef = useRef(null)
  const viewerContainerRef = useRef(null)

  // Local state
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [imageMeta, setImageMeta] = useState({
    width: null,
    height: null,
    format: null,
    sizeFormatted: null,
    name: null,
  })

  // Viewport Zoom & Pan
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Extract real image metadata when file / preview changes
  useEffect(() => {
    if (!file || !preview) {
      setImageMeta({
        width: null,
        height: null,
        format: null,
        sizeFormatted: null,
        name: null,
      })
      setZoom(1.0)
      setPan({ x: 0, y: 0 })
      return
    }

    // Format size
    const bytes = file.size
    let formattedSize = '—'
    if (bytes < 1024) formattedSize = `${bytes} B`
    else if (bytes < 1024 * 1024) formattedSize = `${(bytes / 1024).toFixed(1)} KB`
    else formattedSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`

    // Format name & extension
    const name = file.name || 'microscopy_sample.png'
    const ext = name.split('.').pop().toUpperCase()

    // Real dimensions from Image element
    const img = new Image()
    img.onload = () => {
      setImageMeta({
        width: img.naturalWidth,
        height: img.naturalHeight,
        format: ext || 'PNG',
        sizeFormatted: formattedSize,
        name,
      })
    }
    img.src = preview
  }, [file, preview])

  // Mouse wheel zoom inside viewer
  useEffect(() => {
    const container = viewerContainerRef.current
    if (!container || !preview) return

    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.15 : -0.15
      setZoom((prev) => {
        const next = parseFloat((prev + delta).toFixed(2))
        return Math.min(3.0, Math.max(0.5, next))
      })
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [preview])

  // Validate selected file
  const validateAndProcessFile = (selected) => {
    setErrorMessage('')
    if (!selected) return

    const name = selected.name || ''
    const ext = name.split('.').pop().toLowerCase()
    const isImage = selected.type.startsWith('image/') || SUPPORTED_EXTENSIONS.includes(ext)

    if (!isImage || !SUPPORTED_EXTENSIONS.includes(ext)) {
      setErrorMessage('Unsupported file format. Please upload a PNG, JPG, or JPEG image.')
      return
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File exceeds the 50MB limit. Please select a smaller microscopy image.')
      return
    }

    if (onFileSelect) {
      onFileSelect(selected)
    }
  }

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0])
    }
  }

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0])
    }
    // reset input so the same file can be re-selected if desired
    e.target.value = ''
  }

  // Viewport pan handling
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

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  // Viewport control actions
  const handleZoomIn = () => {
    setZoom((z) => Math.min(3.0, parseFloat((z + 0.25).toFixed(2))))
  }

  const handleZoomOut = () => {
    setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))
  }

  const handleResetView = () => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
  }

  const handleReplaceClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = () => {
    setErrorMessage('')
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
    if (onClear) onClear()
  }

  return (
    <div className="space-y-4">
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* ─── Main Optical Viewport Card ───────────────────────────────── */}
      <GlassCard className="p-4 sm:p-5 border-white/[0.08] relative overflow-hidden" glow>
        {/* Header HUD Bar */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-xs font-mono">
          <div className="flex items-center gap-2">
            <Microscope size={15} className="text-crimson" />
            <span className="text-white font-bold tracking-wider uppercase text-[11px]">
              MICROSCOPY VIEWPORT
            </span>
          </div>

          <div className="flex items-center gap-3">
            {preview && (
              <span className="text-[10px] font-mono text-crimson bg-crimson/10 px-2 py-0.5 rounded border border-crimson/25 hidden sm:inline">
                MAG: {(zoom * 40).toFixed(0)}X
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                    preview ? 'bg-crimson opacity-75' : 'bg-white opacity-40'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    preview
                      ? 'bg-crimson shadow-[0_0_6px_#FF2A55]'
                      : 'bg-white/40'
                  }`}
                />
              </span>
              <span className="text-xs text-white/90 font-medium">
                {preview ? 'ACTIVE STAGE' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-3 p-3 rounded-xl bg-crimson/15 border border-crimson/40 flex items-center justify-between gap-2 text-xs font-mono text-white shadow-sm"
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-crimson shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage('')}
                className="text-white/60 hover:text-white p-0.5"
              >
                <X size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Viewport Frame Surface */}
        <div
          ref={viewerContainerRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative w-full h-[360px] sm:h-[420px] lg:h-[480px] rounded-2xl bg-[#060205] border transition-colors duration-200 overflow-hidden flex items-center justify-center select-none ${
            isDragging
              ? 'border-crimson bg-crimson/[0.04] shadow-[0_0_30px_rgba(255,42,85,0.25)]'
              : 'border-white/[0.08] hover:border-white/[0.15]'
          } ${zoom > 1.0 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
        >
          {preview ? (
            /* ─── 3. Loaded Microscopy Specimen Viewport ─────────────────── */
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              {/* Scalable & Pannable Specimen Image */}
              <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={preview}
                  alt="Mounted Microscopy Specimen"
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </div>

              {/* Optical Lens Center Reticle Crosshairs */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-crimson to-transparent" />
                <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-crimson to-transparent" />
                <div className="absolute w-44 h-44 rounded-full border border-crimson/50 border-dashed" />
              </div>

              {/* Subtle Optical Vignette Mask */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, transparent 65%, rgba(6, 2, 5, 0.4) 85%, #060205 100%)',
                }}
              />

              {/* 3. Top-Left: LIVE IMAGE Badge */}
              <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-black/85 border border-crimson/40 text-white text-xs font-mono tracking-wider font-semibold backdrop-blur-md shadow-[0_0_15px_rgba(255,42,85,0.3)]">
                <span className="w-2 h-2 rounded-full bg-crimson animate-pulse shadow-[0_0_6px_#FF2A55]" />
                <span>LIVE IMAGE</span>
              </div>

              {/* 3. Top-Right: UNPROCESSED Badge */}
              <div className="absolute top-3.5 right-3.5 z-20 px-3 py-1 rounded-full bg-black/85 border border-white/15 text-white/90 text-xs font-mono tracking-wider font-medium backdrop-blur-md">
                UNPROCESSED
              </div>

              {/* 4. Bottom Floating Compact Viewer Control Bar */}
              <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto flex flex-wrap items-center gap-1 sm:gap-1.5 px-3 py-2 rounded-2xl bg-black/90 border border-white/15 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.9)]">
                  {/* Zoom Out */}
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    title="Zoom Out"
                    className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <ZoomOut size={16} />
                  </button>

                  {/* Zoom Indicator */}
                  <span className="text-xs sm:text-sm font-mono font-bold text-white px-2 min-w-[46px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>

                  {/* Zoom In */}
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3.0}
                    title="Zoom In"
                    className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <ZoomIn size={16} />
                  </button>

                  <div className="w-[1px] h-4 bg-white/15 mx-0.5 sm:mx-1" />

                  {/* Fit to Screen */}
                  <button
                    type="button"
                    onClick={handleResetView}
                    title="Fit to Screen"
                    className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono font-semibold"
                  >
                    <Maximize2 size={14} />
                    <span className="hidden sm:inline">Fit</span>
                  </button>

                  {/* Reset View */}
                  <button
                    type="button"
                    onClick={handleResetView}
                    title="Reset View"
                    className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono font-semibold"
                  >
                    <RotateCcw size={14} />
                    <span className="hidden sm:inline">Reset</span>
                  </button>

                  <div className="w-[1px] h-4 bg-white/15 mx-0.5 sm:mx-1" />

                  {/* Replace Image */}
                  <button
                    type="button"
                    onClick={handleReplaceClick}
                    title="Replace Image"
                    className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono font-semibold"
                  >
                    <RefreshCw size={14} />
                    <span className="hidden md:inline">Replace</span>
                  </button>

                  {/* Remove Image */}
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    title="Remove Image"
                    className="p-1.5 rounded-lg text-crimson hover:text-white hover:bg-crimson/20 border border-crimson/30 hover:border-crimson/60 transition-all cursor-pointer flex items-center gap-1 text-xs font-mono font-semibold ml-0.5"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ─── 2. Premium Research-Oriented Empty State ───────────────── */
            <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 max-w-md">
              {/* Microphone/Camera Icon with soft crimson aura */}
              <div className="relative w-20 h-20 rounded-2xl bg-crimson/10 border border-crimson/30 flex items-center justify-center text-crimson mb-4 shadow-[0_0_30px_rgba(255,42,85,0.25)]">
                <Microscope size={36} />
                <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#060205] border border-crimson/50 flex items-center justify-center text-white">
                  <Upload size={14} className="text-crimson" />
                </span>
              </div>

              {/* Exact Required Empty State Text */}
              <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white mb-2 tracking-tight">
                Upload Microscopy Image
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
                Drag & drop your image here or browse from your device
              </p>
              <p className="text-xs font-mono text-white/50 mb-6">
                Supported formats: PNG, JPG, JPEG (Max 50MB)
              </p>

              {/* Browse Files Button */}
              <Button
                variant="secondary"
                size="md"
                icon={ImageIcon}
                onClick={() => fileInputRef.current?.click()}
                className="hover:border-crimson/40 text-sm px-6 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] cursor-pointer font-mono font-semibold"
              >
                Browse Files
              </Button>
            </div>
          )}

          {/* Optical Viewport Corner Marks (HUD) */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-crimson/60 rounded-tl pointer-events-none" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-crimson/60 rounded-tr pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-crimson/60 rounded-bl pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-crimson/60 rounded-br pointer-events-none" />
        </div>
      </GlassCard>

      {/* ─── 5. Real Image Information Area (Actual Uploaded File Metadata) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* File Name */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between">
          <span className="text-xs font-mono font-semibold text-text-muted uppercase tracking-wider">
            IMAGE
          </span>
          <span
            title={imageMeta.name || 'No image loaded'}
            className="text-sm sm:text-base font-mono font-bold text-white mt-1.5 truncate"
          >
            {imageMeta.name || '—'}
          </span>
        </div>

        {/* Real Dimensions */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between">
          <span className="text-xs font-mono font-semibold text-text-muted uppercase tracking-wider">
            DIMENSIONS
          </span>
          <span className="text-sm sm:text-base font-mono font-bold text-white mt-1.5">
            {imageMeta.width && imageMeta.height
              ? `${imageMeta.width} × ${imageMeta.height}`
              : '— × —'}
          </span>
        </div>

        {/* Real Format */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between">
          <span className="text-xs font-mono font-semibold text-text-muted uppercase tracking-wider">
            FORMAT
          </span>
          <span className="text-sm sm:text-base font-mono font-bold text-crimson mt-1.5">
            {imageMeta.format || '—'}
          </span>
        </div>

        {/* Real File Size */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between">
          <span className="text-xs font-mono font-semibold text-text-muted uppercase tracking-wider">
            SIZE
          </span>
          <span className="text-sm sm:text-base font-mono font-bold text-white mt-1.5">
            {imageMeta.sizeFormatted || '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
