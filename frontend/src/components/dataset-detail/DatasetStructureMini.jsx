import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HardDrive, ChevronDown, ChevronRight, Folder, FolderOpen, CornerDownRight, FileText } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import { DATASETS } from '@/data/datasets'

/**
 * DatasetStructureMini — Compact expandable Micro-OD hierarchy with links to dataset detail pages
 */
export default function DatasetStructureMini({ currentDatasetId }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <GlassCard className="p-5 sm:p-6 border-white/[0.08] relative overflow-hidden space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <HardDrive size={16} className="text-crimson" />
          <div>
            <h3 className="text-sm font-heading font-bold text-white tracking-tight">
              Micro-OD Structure
            </h3>
            <p className="text-[11px] font-mono text-text-muted">
              Standard repository partitioning schema
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-text-muted hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono"
        >
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-2 border-t border-white/[0.06] font-mono text-xs space-y-3"
          >
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/[0.06] space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <FolderOpen size={14} className="text-crimson" />
                <span>Micro-OD</span>
              </div>

              {/* example branch */}
              <div className="pl-5 border-l border-white/[0.08] ml-2 space-y-1">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Folder size={13} className="text-crimson/80" />
                  <span>example/ (40 images)</span>
                </div>
                <div className="pl-5 border-l border-white/[0.08] ml-1.5 space-y-1 pt-0.5">
                  {DATASETS.map((d) => (
                    <Link
                      key={`ex-${d.id}`}
                      to={`/dataset/${d.id}`}
                      className={`flex items-center gap-2 py-0.5 px-2 rounded transition-colors ${
                        d.id.toUpperCase() === currentDatasetId?.toUpperCase()
                          ? 'bg-crimson/15 text-crimson font-bold'
                          : 'text-text-muted hover:text-white'
                      }`}
                    >
                      <CornerDownRight size={11} className="text-crimson/60" />
                      <span>{d.name} (10 images)</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* test branch */}
              <div className="pl-5 border-l border-white/[0.08] ml-2 space-y-1 pt-1">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Folder size={13} className="text-crimson/80" />
                  <span>test/ (212 images)</span>
                </div>
                <div className="pl-5 border-l border-white/[0.08] ml-1.5 space-y-1 pt-0.5">
                  {DATASETS.map((d) => (
                    <Link
                      key={`ts-${d.id}`}
                      to={`/dataset/${d.id}`}
                      className={`flex items-center gap-2 py-0.5 px-2 rounded transition-colors ${
                        d.id.toUpperCase() === currentDatasetId?.toUpperCase()
                          ? 'bg-crimson/15 text-crimson font-bold'
                          : 'text-text-muted hover:text-white'
                      }`}
                    >
                      <CornerDownRight size={11} className="text-crimson/60" />
                      <span>{d.name} (53 images &bull; {d.testBoxes} boxes)</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
