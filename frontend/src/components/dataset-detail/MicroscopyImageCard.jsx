import { motion } from 'framer-motion'
import { Eye, Box, FileText, CheckCircle2 } from 'lucide-react'

/**
 * MicroscopyImageCard — Individual card for a local microscopy image asset
 */
export default function MicroscopyImageCard({
  image,
  onInspect,
  viewMode = 'grid',
}) {
  if (viewMode === 'compact') {
    return (
      <div
        onClick={() => onInspect(image)}
        className="p-3 rounded-xl bg-black/60 border border-white/[0.08] hover:border-crimson/50 hover:bg-white/[0.02] transition-all flex items-center justify-between gap-4 cursor-pointer group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-black border border-white/[0.08] shrink-0">
            <img
              src={image.url}
              alt={image.fileName}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-mono font-bold text-white truncate group-hover:text-crimson transition-colors">
              {image.fileName}
            </h4>
            <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted mt-0.5">
              <span>{image.dataset}</span>
              <span>&bull;</span>
              <span className="text-crimson font-medium">{image.split}</span>
              <span>&bull;</span>
              <span>{image.format}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              image.hasAnnotations
                ? 'bg-crimson/15 text-crimson border-crimson/30 font-bold'
                : 'bg-white/[0.02] text-text-muted border-white/[0.06]'
            }`}
          >
            {image.hasAnnotations ? 'Boxes Available' : 'No Annotations'}
          </span>
          <button
            type="button"
            className="p-2 rounded-lg bg-white/[0.04] group-hover:bg-crimson group-hover:text-white text-text-muted transition-colors"
          >
            <Eye size={13} />
          </button>
        </div>
      </div>
    )
  }

  // Grid View (Default)
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onClick={() => onInspect(image)}
      className="group rounded-xl overflow-hidden bg-black/60 border border-white/[0.08] hover:border-crimson/50 transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
    >
      {/* Image Preview Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black flex items-center justify-center">
        <img
          src={image.url}
          alt={image.fileName}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
        />

        {/* Gradient shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Split & Format badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white">
            {image.split}
          </span>
          <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono text-text-muted">
            {image.format}
          </span>
        </div>

        {/* Hover View Button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="px-3 py-1.5 rounded-lg bg-crimson text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_12px_#FF2A55]">
            <Eye size={13} />
            <span>View Image</span>
          </span>
        </div>
      </div>

      {/* Caption & Metadata Footer */}
      <div className="p-3.5 space-y-2 border-t border-white/[0.06]">
        <div>
          <h4 className="text-xs font-mono font-bold text-white truncate group-hover:text-crimson transition-colors">
            {image.fileName}
          </h4>
          <p className="text-[10px] font-mono text-text-muted truncate mt-0.5">
            {image.caption || image.dataset}
          </p>
        </div>

        <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono">
          <span className="text-text-muted">{image.dataset}</span>
          <span
            className={
              image.hasAnnotations
                ? 'text-crimson font-bold'
                : 'text-text-muted'
            }
          >
            {image.hasAnnotations ? 'Boxes Available' : 'No Annotations'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
