import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image, X } from 'lucide-react'

/**
 * Drag-and-drop microscopy image upload box with smooth micro-interactions
 */
export default function UploadBox({ file, preview, onFileSelect, onClear }) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith('image/')) {
      onFileSelect(dropped)
    }
  }, [onFileSelect])

  const handleInput = (e) => {
    const selected = e.target.files[0]
    if (selected) onFileSelect(selected)
  }

  return (
    <AnimatePresence mode="wait">
      {preview ? (
        <motion.div
          key="preview-box"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full h-64 rounded-xl overflow-hidden border border-crimson/30 shadow-[0_0_25px_rgba(255,42,85,0.15)]"
        >
          <img src={preview} alt="Microscopy input" className="w-full h-full object-contain bg-void" />
          <div className="absolute inset-0 bg-gradient-to-t from-void/60 to-transparent" />
          {/* HUD overlay */}
          <div className="absolute top-3 left-3 sci-label text-[10px]">Input Image</div>
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A55] shadow-[0_0_8px_#FF2A55]" />
            <span className="text-[10px] font-mono text-crimson font-bold">READY</span>
          </div>
          {/* Corner markers */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-crimson/60 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-crimson/60 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-crimson/60 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-crimson/60 rounded-br-lg" />

          <button
            onClick={onClear}
            className="absolute bottom-3 right-3 w-7 h-7 rounded-lg bg-void/80 border border-crimson/30 flex items-center justify-center text-crimson hover:bg-crimson/20 transition-colors"
            aria-label="Clear image"
          >
            <X size={12} />
          </button>
        </motion.div>
      ) : (
        <motion.label
          key="upload-dropzone"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${
            isDragOver
              ? 'border-crimson bg-crimson/10 shadow-[0_0_25px_rgba(255,42,85,0.2)] scale-[1.01]'
              : 'border-white/15 hover:border-crimson/40 hover:bg-crimson/[0.03]'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          <input type="file" accept="image/*" onChange={handleInput} className="hidden" />
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            isDragOver ? 'bg-crimson/20 border border-crimson text-crimson' : 'bg-white/[0.04] border border-white/10 text-white/70'
          }`}>
            <Upload size={20} className={isDragOver ? 'text-crimson animate-bounce' : 'text-crimson'} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">Drop microscopy image here</p>
            <p className="text-xs text-text-muted mt-1">PNG, JPG, TIFF supported</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-crimson/70 font-mono">
            <Image size={10} />
            Click to browse
          </div>
        </motion.label>
      )}
    </AnimatePresence>
  )
}
