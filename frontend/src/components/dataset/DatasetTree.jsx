import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, FolderOpen, FileText, ChevronDown, ChevronRight, HardDrive, CornerDownRight } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const TREE_DATA = [
  {
    id: 'example',
    name: 'example',
    label: 'Exemplar Prompt Set',
    images: 40,
    desc: 'Few-shot calibration exemplars',
    subfolders: [
      { name: 'BBBC', images: 10, format: '.png / .jpg', classes: '6 classes' },
      { name: 'BCCD', images: 10, format: '.png / .jpg', classes: '3 classes' },
      { name: 'LIVECell', images: 10, format: '.png / .jpg', classes: '3 classes' },
      { name: 'NIH-3T3', images: 10, format: '.png / .jpg', classes: '3 classes' },
    ],
  },
  {
    id: 'test',
    name: 'test',
    label: 'Standard Evaluation Partition',
    images: 212,
    desc: 'Unseen evaluation images with bounding truth boxes',
    subfolders: [
      { name: 'BBBC', images: 53, format: '.png / .jpg', classes: '4,000 boxes' },
      { name: 'BCCD', images: 53, format: '.png / .jpg', classes: '952 boxes' },
      { name: 'LIVECell', images: 53, format: '.png / .jpg', classes: '223 boxes' },
      { name: 'NIH-3T3', images: 53, format: '.png / .jpg', classes: '376 boxes' },
    ],
  },
]

/**
 * DatasetTree — Interactive directory hierarchy visualizing Micro-OD file structure
 */
export default function DatasetTree() {
  const [openNodes, setOpenNodes] = useState({
    'Micro-OD': true,
    'example': true,
    'test': true,
  })

  const [activeDatasetDetail, setActiveDatasetDetail] = useState(null)

  const toggleNode = (id) => {
    setOpenNodes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive size={16} className="text-crimson" />
            <h3 className="text-lg font-heading font-bold text-white tracking-tight">
              Dataset Hierarchy Structure
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Hierarchical directory organization of the standardized Micro-OD benchmark partitions.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 text-[10px] font-mono text-text-muted">
          <span>CLICK FOLDERS TO EXPAND / COLLAPSE</span>
        </div>
      </div>

      {/* Tree View Container */}
      <div className="p-4 sm:p-5 rounded-xl bg-black/60 border border-white/[0.06] font-mono text-xs space-y-3">
        {/* Root Node: Micro-OD */}
        <div>
          <button
            type="button"
            onClick={() => toggleNode('Micro-OD')}
            className="flex items-center gap-2.5 text-white hover:text-crimson transition-colors group select-none"
          >
            {openNodes['Micro-OD'] ? (
              <ChevronDown size={14} className="text-crimson" />
            ) : (
              <ChevronRight size={14} className="text-text-muted" />
            )}
            <FolderOpen size={16} className="text-crimson" />
            <span className="font-bold text-sm">Micro-OD</span>
            <span className="text-[10px] text-text-muted px-2 py-0.5 rounded bg-white/[0.04]">
              root (252 total images)
            </span>
          </button>

          {/* Root Children (example & test) */}
          <AnimatePresence>
            {openNodes['Micro-OD'] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pl-6 pt-2 border-l border-white/[0.08] ml-2 space-y-3"
              >
                {TREE_DATA.map((branch) => {
                  const isOpen = openNodes[branch.id]

                  return (
                    <div key={branch.id} className="space-y-2">
                      {/* Branch folder: example / test */}
                      <button
                        type="button"
                        onClick={() => toggleNode(branch.id)}
                        className="flex items-center gap-2 text-white/90 hover:text-crimson transition-colors group select-none"
                      >
                        {isOpen ? (
                          <ChevronDown size={13} className="text-crimson/80" />
                        ) : (
                          <ChevronRight size={13} className="text-text-muted" />
                        )}
                        {isOpen ? (
                          <FolderOpen size={15} className="text-crimson" />
                        ) : (
                          <Folder size={15} className="text-text-muted" />
                        )}
                        <span className="font-semibold text-xs">{branch.name}</span>
                        <span className="text-[10px] text-text-muted">
                          ({branch.images} images)
                        </span>
                      </button>

                      {/* Sub-items (BBBC, BCCD, LIVECell, NIH-3T3) */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-6 border-l border-white/[0.08] ml-2 space-y-1.5 pt-1"
                          >
                            {branch.subfolders.map((sub) => (
                              <div
                                key={sub.name}
                                onClick={() => setActiveDatasetDetail(sub.name)}
                                className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center gap-2">
                                  <CornerDownRight size={12} className="text-crimson/60 group-hover:text-crimson" />
                                  <FileText size={13} className="text-text-muted group-hover:text-white" />
                                  <span className="text-white font-medium group-hover:text-crimson transition-colors">
                                    {sub.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-text-muted">
                                  <span>{sub.images} images</span>
                                  <span className="text-crimson/80">{sub.classes}</span>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  )
}
