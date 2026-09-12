import { motion } from 'framer-motion'
import { Info, Tag } from 'lucide-react'

/**
 * AnnotationOverlay — Bounding box overlay layer for microscopy viewer.
 * Renders verified bounding boxes if present; displays an honest notice if not.
 * Expected annotation shape:
 * [
 *   { x: 50, y: 80, width: 40, height: 40, label: "Red Blood Cell" }
 * ]
 */
export default function AnnotationOverlay({
  annotations = [],
  showAnnotations = false,
  imageDimensions = { width: 0, height: 0 },
}) {
  if (!showAnnotations) return null

  const hasAnnotations = Array.isArray(annotations) && annotations.length > 0

  if (!hasAnnotations) {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-xs font-mono text-text-secondary flex items-center gap-2 shadow-lg"
        >
          <Info size={13} className="text-crimson" />
          <span>Annotations unavailable for this image.</span>
        </motion.div>
      </div>
    )
  }

  // When real annotations are passed, render bounding boxes
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {annotations.map((box, idx) => (
        <div
          key={idx}
          style={{
            left: `${box.x}px`,
            top: `${box.y}px`,
            width: `${box.width}px`,
            height: `${box.height}px`,
          }}
          className="absolute border-2 border-crimson bg-crimson/10 rounded-sm pointer-events-auto group"
        >
          {box.label && (
            <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-crimson text-white text-[9px] font-mono font-bold whitespace-nowrap shadow-sm">
              {box.label}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
