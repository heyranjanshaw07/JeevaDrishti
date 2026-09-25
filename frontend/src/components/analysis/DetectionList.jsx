import { motion } from 'framer-motion'
import { ListFilter, Target, Layers } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import { SCIENTIFIC_CLASSES } from './DetectionOverlay'

/**
 * DetectionList — Cellular instance detection log table
 * 
 * Empty state: "No detected cells" with zero hardcoded fake detections
 * Prepared structure: #, Cell Type, Confidence, Bounding Box, Status
 */
export default function DetectionList({ detections = [] }) {
  const hasDetections = Boolean(detections && detections.length > 0)

  return (
    <GlassCard className="p-5 sm:p-6 border-white/[0.08]" glow>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ListFilter size={18} className="text-crimson" />
          <h3 className="text-base font-heading font-bold text-white tracking-wide">
            DETECTED CELLS
          </h3>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/[0.04] text-white/80 border border-white/[0.08] font-semibold">
          {hasDetections ? `${detections.length} INSTANCES` : '0 INSTANCES'}
        </span>
      </div>

      {hasDetections ? (
        /* Real Detections Table */
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-sm font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] text-xs uppercase text-text-muted font-bold tracking-wider">
                <th className="py-3 px-3.5">#</th>
                <th className="py-3 px-3.5">Cell Type</th>
                <th className="py-3 px-3.5">Region Priority</th>
                <th className="py-3 px-3.5">Confidence</th>
                <th className="py-3 px-3.5">Bounding Box</th>
                <th className="py-3 px-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {detections.map((cell, idx) => {
                const classConfig =
                  SCIENTIFIC_CLASSES.find((c) => c.name.toLowerCase() === cell.label?.toLowerCase()) ||
                  SCIENTIFIC_CLASSES[0]

                const formattedIndex = String(idx + 1).padStart(2, '0')
                const bboxStr = Array.isArray(cell.bbox)
                  ? `[${cell.bbox.map((v) => Math.round(v)).join(', ')}]`
                  : cell.bbox || '—'

                const labelLower = (cell.label || '').toLowerCase()
                const isHighPriority =
                  labelLower.includes('blast') ||
                  labelLower.includes('dyskeratotic') ||
                  labelLower.includes('koilocytotic') ||
                  labelLower.includes('sickle') ||
                  labelLower.includes('infect') ||
                  labelLower.includes('ring') ||
                  labelLower.includes('trophozoite') ||
                  labelLower.includes('schizont') ||
                  labelLower.includes('gametocyte')

                const isModerate =
                  labelLower.includes('metaplastic') ||
                  labelLower.includes('parabasal') ||
                  labelLower.includes('thalassemia') ||
                  labelLower.includes('white blood cell')

                return (
                  <tr
                    key={idx}
                    className="hover:bg-white/[0.02] transition-colors text-white/90"
                  >
                    <td className="py-3.5 px-3.5 text-text-muted font-bold">{formattedIndex}</td>
                    <td className="py-3.5 px-3.5 flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: classConfig.color }}
                      />
                      <span className="font-semibold text-white">{cell.label}</span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold uppercase ${
                        isHighPriority
                          ? 'bg-crimson/15 text-crimson border border-crimson/30'
                          : isModerate
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isHighPriority ? 'bg-crimson animate-pulse' : isModerate ? 'bg-amber-400' : 'bg-emerald-400'
                        }`} />
                        {isHighPriority ? 'High Priority' : isModerate ? 'Moderate' : 'Routine'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="text-crimson font-bold">
                        {typeof cell.confidence === 'number'
                          ? `${(cell.confidence * 100).toFixed(1)}%`
                          : cell.confidence || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-white/70 text-xs font-mono">
                      {bboxStr}
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-white/[0.05] text-white/90 border border-white/10 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
                        {cell.status || 'Detected'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
        <div className="py-10 sm:py-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-white/40 mb-3">
            <Target size={26} className="text-crimson/60" />
          </div>
          <h4 className="text-base font-heading font-bold text-white mb-1">
            No detected cells
          </h4>
          <p className="text-sm text-text-secondary font-mono max-w-sm leading-relaxed">
            Cell coordinates and confidence classifications will populate here upon running inference.
          </p>
        </div>
      )}
    </GlassCard>
  )
}
