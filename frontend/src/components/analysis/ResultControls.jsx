import { Layers, Eye, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react'

/**
 * ResultControls — Compact toolbar for the Detection Viewer
 * 
 * Provides:
 * - View mode toggle: Overlay vs Original
 * - Zoom controls: In, Out, Fit to Screen, Reset
 */
export default function ResultControls({
  viewMode = 'overlay', // 'overlay' | 'original'
  onViewModeChange,
  hasResults = false,
  zoom = 1.0,
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  hasImage = false,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06] text-xs font-mono">
      {/* Left: View Mode Toggle (Overlay vs Original) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/[0.08]">
        {/* Overlay Mode */}
        <button
          type="button"
          onClick={() => hasResults && onViewModeChange && onViewModeChange('overlay')}
          disabled={!hasResults}
          title={hasResults ? 'Show detection overlay' : 'Overlay available after analysis'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-medium transition-all ${
            viewMode === 'overlay' && hasResults
              ? 'bg-crimson text-white shadow-[0_0_12px_rgba(255,42,85,0.35)]'
              : hasResults
              ? 'text-white/70 hover:text-white hover:bg-white/[0.05] cursor-pointer'
              : 'text-white/30 cursor-not-allowed opacity-50'
          }`}
        >
          <Layers size={13} className={viewMode === 'overlay' && hasResults ? 'text-white' : 'text-crimson/70'} />
          <span>Overlay</span>
        </button>

        {/* Original Mode */}
        <button
          type="button"
          onClick={() => onViewModeChange && onViewModeChange('original')}
          disabled={!hasImage}
          title="Show unprocessed original image"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-medium transition-all ${
            viewMode === 'original' || !hasResults
              ? 'bg-white/[0.1] text-white font-semibold'
              : 'text-white/70 hover:text-white hover:bg-white/[0.05] cursor-pointer'
          } ${!hasImage ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Eye size={13} className="text-white/80" />
          <span>Original</span>
        </button>
      </div>

      {/* Right: Zoom & Navigation Controls */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-white/[0.08]">
        {/* Zoom Out */}
        <button
          type="button"
          onClick={onZoomOut}
          disabled={!hasImage || zoom <= 0.5}
          title="Zoom Out"
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <ZoomOut size={14} />
        </button>

        {/* Zoom Level */}
        <span className="text-[11px] font-mono font-bold text-white px-2 min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        {/* Zoom In */}
        <button
          type="button"
          onClick={onZoomIn}
          disabled={!hasImage || zoom >= 3.0}
          title="Zoom In"
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <ZoomIn size={14} />
        </button>

        <div className="w-[1px] h-3.5 bg-white/15 mx-1" />

        {/* Fit */}
        <button
          type="button"
          onClick={onFit}
          disabled={!hasImage}
          title="Fit to viewport"
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
        >
          <Maximize2 size={13} />
          <span className="hidden sm:inline">Fit</span>
        </button>

        {/* Reset */}
        <button
          type="button"
          onClick={onReset}
          disabled={!hasImage}
          title="Reset Zoom & Pan"
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  )
}
