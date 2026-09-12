import { FileText, Maximize2, Layers, Database, Box } from 'lucide-react'

/**
 * ImageMetadata — Information sidebar panel displayed inside the microscopy image viewer modal
 */
export default function ImageMetadata({ image, dimensions = { width: null, height: null } }) {
  if (!image) return null

  const items = [
    {
      label: 'IMAGE FILE',
      value: image.fileName,
      icon: FileText,
    },
    {
      label: 'DIMENSIONS',
      value:
        dimensions.width && dimensions.height
          ? `${dimensions.width} × ${dimensions.height} px`
          : 'Measuring optical field...',
      icon: Maximize2,
    },
    {
      label: 'FILE FORMAT',
      value: image.format || 'JPEG',
      icon: FileText,
    },
    {
      label: 'BENCHMARK DATASET',
      value: image.dataset,
      icon: Database,
    },
    {
      label: 'PARTITION SPLIT',
      value: image.split,
      icon: Layers,
    },
    {
      label: 'ANNOTATIONS',
      value: image.hasAnnotations ? 'Available' : 'Unavailable',
      icon: Box,
    },
  ]

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-black/60 border border-white/[0.08] space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <span className="text-[11px] font-bold text-white uppercase tracking-wider">
          Optical Metadata
        </span>
        <span className="text-[10px] text-crimson font-semibold">
          VERIFIED ASSET
        </span>
      </div>

      <div className="space-y-3">
        {items.map((it) => {
          const Icon = it.icon

          return (
            <div key={it.label} className="space-y-1">
              <span className="text-[10px] text-text-muted flex items-center gap-1.5">
                <Icon size={12} className="text-crimson/70" />
                <span>{it.label}</span>
              </span>
              <span className="text-xs font-bold text-white block truncate">
                {it.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
