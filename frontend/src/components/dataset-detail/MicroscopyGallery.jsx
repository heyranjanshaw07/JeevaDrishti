import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import MicroscopyImageCard from './MicroscopyImageCard'
import MicroscopyViewerModal from './MicroscopyViewerModal'

/**
 * MicroscopyGallery — Searchable, filterable image browser for a dataset's samples
 */
export default function MicroscopyGallery({
  dataset,
  images = [],
  activeSplit = 'ALL',
  onSelectSplit,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [splitFilter, setSplitFilter] = useState(activeSplit)
  const [annotatedOnly, setAnnotatedOnly] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [activeModalImage, setActiveModalImage] = useState(null)

  // Filter images based on search, split, and annotated filter
  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      const matchSplit = splitFilter === 'ALL' || img.split === splitFilter
      if (!matchSplit) return false

      if (annotatedOnly && !img.hasAnnotations) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        img.fileName.toLowerCase().includes(q) ||
        img.dataset.toLowerCase().includes(q) ||
        img.split.toLowerCase().includes(q) ||
        (img.caption && img.caption.toLowerCase().includes(q))
      )
    })
  }, [images, splitFilter, annotatedOnly, searchQuery])

  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-crimson" />
            <h3 className="text-lg font-heading font-bold text-white tracking-tight">
              Microscopy Samples
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Browse verified high-resolution optical fields and few-shot calibration exemplars.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
          <span>{filteredImages.length} SPECIMENS DISPLAYED</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3.5 rounded-xl bg-black/60 border border-white/[0.06] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search samples by filename, split..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] focus:border-crimson/50 text-xs font-mono text-white placeholder:text-text-muted focus:outline-none transition-colors"
          />
        </div>

        {/* Split Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {['ALL', 'EXAMPLE', 'TEST'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSplitFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                splitFilter === s
                  ? 'bg-crimson text-white font-bold shadow-[0_0_8px_rgba(255,42,85,0.4)]'
                  : 'bg-white/[0.02] text-text-secondary hover:text-white border border-transparent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Annotated Only Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none px-2 py-1 rounded bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-text-secondary hover:text-white">
          <input
            type="checkbox"
            checked={annotatedOnly}
            onChange={(e) => setAnnotatedOnly(e.target.checked)}
            className="accent-crimson rounded"
          />
          <span>Annotated Only</span>
        </label>

        {/* View Switcher (Grid / Compact) */}
        <div className="flex items-center gap-1 pl-2 border-t md:border-t-0 md:border-l border-white/[0.08] pt-2 md:pt-0 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="Grid View"
            aria-label="Grid View"
            className={`p-1.5 rounded-lg border text-xs ${
              viewMode === 'grid'
                ? 'bg-crimson/15 border-crimson/40 text-crimson'
                : 'bg-white/[0.02] border-white/[0.06] text-text-muted hover:text-white'
            }`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('compact')}
            title="Compact View"
            aria-label="Compact View"
            className={`p-1.5 rounded-lg border text-xs ${
              viewMode === 'compact'
                ? 'bg-crimson/15 border-crimson/40 text-crimson'
                : 'bg-white/[0.02] border-white/[0.06] text-text-muted hover:text-white'
            }`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Image Grid / List or Clean Empty State */}
      {filteredImages.length > 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-2'
          }
        >
          {filteredImages.map((img) => (
            <MicroscopyImageCard
              key={img.id}
              image={img}
              viewMode={viewMode}
              onInspect={setActiveModalImage}
            />
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
              LOCAL DATASET REPOSITORY
            </span>
            <h4 className="text-base font-heading font-extrabold text-white tracking-tight">
              No microscopy samples connected
            </h4>
            <p className="text-xs font-sans text-text-secondary leading-relaxed">
              Dataset images will appear here when the local dataset assets are connected.
            </p>
          </div>

          <div className="pt-2 text-[10px] font-mono text-text-muted">
            TARGET DATASET: <span className="text-white font-bold">{dataset?.name}</span> &bull;
            AWAITING LOCAL REPOSITORY INGESTION
          </div>
        </motion.div>
      )}

      {/* Microscopy Viewer Modal */}
      {activeModalImage && (
        <MicroscopyViewerModal
          image={activeModalImage}
          imagesList={filteredImages}
          onClose={() => setActiveModalImage(null)}
          onSelectImage={setActiveModalImage}
        />
      )}
    </GlassCard>
  )
}
