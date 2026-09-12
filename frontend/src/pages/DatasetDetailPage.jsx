import { useState, useMemo } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ScanLine,
  BarChart3,
  Database,
  BookOpen,
  FlaskConical,
  Microscope,
  Settings,
  Menu,
  X,
  ChevronRight,
  Shield,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react'

import { DATASETS } from '@/data/datasets'
import { getDatasetImages } from '@/data/datasetImages'

import DatasetHeader from '@/components/dataset-detail/DatasetHeader'
import DatasetInfo from '@/components/dataset-detail/DatasetInfo'
import DatasetSplitSelector from '@/components/dataset-detail/DatasetSplitSelector'
import MicroscopyGallery from '@/components/dataset-detail/MicroscopyGallery'
import CellCategoryTags from '@/components/dataset-detail/CellCategoryTags'
import DatasetNavigation from '@/components/dataset-detail/DatasetNavigation'
import DatasetResearchContext from '@/components/dataset-detail/DatasetResearchContext'
import DatasetStructureMini from '@/components/dataset-detail/DatasetStructureMini'
import AppSidebar from '@/components/navigation/AppSidebar'

export default function DatasetDetailPage() {
  const { datasetName } = useParams()
  const location = useLocation()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [activeSplit, setActiveSplit] = useState('TEST')

  // Find dataset matching the URL param
  const dataset = useMemo(() => {
    if (!datasetName) return null
    return DATASETS.find(
      (d) => d.id.toUpperCase() === datasetName.toUpperCase()
    )
  }, [datasetName])

  // Get microscopy images from centralized registry for this dataset and split
  const datasetImages = useMemo(() => {
    if (!dataset) return []
    return getDatasetImages(dataset.id, 'ALL')
  }, [dataset])



  // Dataset Not Found State
  if (!dataset) {
    return (
      <div className="min-h-screen w-full bg-[#060205] text-[#FFFFFF] flex relative">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-crimson/15 border border-crimson/30 flex items-center justify-center text-crimson">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-2xl font-heading font-bold text-white">
            Dataset Not Found
          </h2>
          <p className="text-xs font-mono text-text-secondary">
            The dataset &ldquo;{datasetName}&rdquo; is not part of the standardized Micro-OD benchmark suite.
          </p>
          <Link
            to="/dataset"
            className="px-4 py-2 rounded-xl bg-crimson text-white text-xs font-mono font-semibold hover:bg-crimson-600 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Return to Dataset Explorer</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#060205] text-[#FFFFFF] flex relative selection:bg-crimson/30 selection:text-white overflow-x-hidden">
      {/* ─── Ambient Scientific Grid Background ─────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.018) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      >
        <div className="absolute -top-40 right-10 w-[600px] h-[600px] bg-crimson/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-10 left-60 w-[550px] h-[550px] bg-crimson/[0.05] rounded-full blur-[180px]" />
      </div>

      {/* App Sidebar (Desktop + Mobile Drawer) */}
      <AppSidebar
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
        statusText="SPECIMEN REPOSITORY ACTIVE"
      />

      {/* ───────────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA
      ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 relative z-10">
        {/* Top Command Bar */}
        <header className="sticky top-0 z-20 h-16 bg-[#060205]/85 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/80 hover:text-white"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <Link to="/dashboard" className="text-text-muted hover:text-white transition-colors">
                JeevaDrishti
              </Link>
              <ChevronRight size={13} className="text-white/20" />
              <Link to="/dataset" className="text-text-muted hover:text-white transition-colors">
                Datasets
              </Link>
              <ChevronRight size={13} className="text-white/20" />
              <span className="text-white font-semibold">{dataset.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.08] text-[11px] font-mono text-text-secondary">
              <Shield size={12} className="text-crimson" />
              <span>Verified Micro-OD</span>
            </div>
          </div>
        </header>

        {/* Dataset Detail Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* 1 & 2. HEADER */}
          <DatasetHeader dataset={dataset} />

          {/* 4. SPLIT SELECTOR */}
          <DatasetSplitSelector
            selectedSplit={activeSplit}
            onSelectSplit={setActiveSplit}
            dataset={dataset}
          />

          {/* 3. DATASET INFORMATION PANEL */}
          <DatasetInfo dataset={dataset} />

          {/* 5, 6, 7, 8, 9, 11, 12. MICROSCOPY SAMPLES BROWSER & MODAL */}
          <MicroscopyGallery
            dataset={dataset}
            images={datasetImages}
            activeSplit={activeSplit}
            onSelectSplit={setActiveSplit}
          />

          {/* 10. CLASS DISTRIBUTION TAGS */}
          <CellCategoryTags dataset={dataset} />

          {/* 14. RESEARCH CONTEXT */}
          <DatasetResearchContext dataset={dataset} />

          {/* 15. MICRO-OD STRUCTURE EXPANDABLE TREE */}
          <DatasetStructureMini currentDatasetId={dataset.id} />

          {/* 13. NEXT / PREVIOUS DATASET NAVIGATION */}
          <DatasetNavigation currentDatasetId={dataset.id} />
        </main>
      </div>
    </div>
  )
}
