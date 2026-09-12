import { Info, Database, Layers, Box, Tag, Images, Compass } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * DatasetInfo — Clean structured specification panel for the dataset
 */
export default function DatasetInfo({ dataset }) {
  if (!dataset) return null

  const infoRows = [
    {
      label: 'Dataset Identifier',
      value: dataset.name,
      sub: dataset.fullName,
      icon: Database,
    },
    {
      label: 'Partitions (Split)',
      value: 'Example / Test',
      sub: `${dataset.exampleImages} Example + ${dataset.testImages} Test`,
      icon: Layers,
    },
    {
      label: 'Dataset Image Count',
      value: `${dataset.imageCount} Images`,
      sub: 'Verified Micro-OD subset',
      icon: Images,
    },
    {
      label: 'Annotation Geometry',
      value: 'Bounding Boxes',
      sub: `${(dataset.testBoxes ?? dataset.test_boxes ?? 0).toLocaleString()} Ground Truth Annotations`,
      icon: Box,
    },
    {
      label: 'Imaging Modality',
      value: dataset.modality,
      sub: dataset.purpose,
      icon: Compass,
    },
    {
      label: 'Cell Categories',
      value: `${dataset.classesCount} Classes`,
      sub: dataset.classes.join(', '),
      icon: Tag,
    },
  ]

  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
        <Info size={16} className="text-crimson" />
        <h3 className="text-base font-heading font-bold text-white tracking-tight">
          Dataset Information
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {infoRows.map((row) => {
          const Icon = row.icon

          return (
            <div
              key={row.label}
              className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  {row.label}
                </span>
                <Icon size={14} className="text-crimson/70" />
              </div>

              <div>
                <span className="text-sm font-mono font-bold text-white block">
                  {row.value}
                </span>
                <p className="text-[11px] font-sans text-text-secondary line-clamp-2 mt-0.5">
                  {row.sub}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
