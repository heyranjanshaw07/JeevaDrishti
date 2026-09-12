import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
  Search,
} from 'lucide-react'

import { DATASETS } from '@/data/datasets'
import DatasetOverview from '@/components/dataset/DatasetOverview'
import DatasetFilters from '@/components/dataset/DatasetFilters'
import DatasetCard from '@/components/dataset/DatasetCard'
import DatasetGallery from '@/components/dataset/DatasetGallery'
import DatasetClassTags from '@/components/dataset/DatasetClassTags'
import DatasetTree from '@/components/dataset/DatasetTree'
import DatasetPurpose from '@/components/dataset/DatasetPurpose'
import DatasetDetail from '@/components/dataset/DatasetDetail'
import AppSidebar from '@/components/navigation/AppSidebar'

export default function Dataset() {
  const location = useLocation()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Filtering & Viewing State
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [viewMode, setViewMode] = useState('grid')

  // Selected Dataset Detail Modal State
  const [selectedDatasetForDetail, setSelectedDatasetForDetail] = useState(null)



  // Filtered datasets based on search and tab filter
  const filteredDatasets = useMemo(() => {
    return DATASETS.filter((ds) => {
      const matchesFilter = activeFilter === 'All' || ds.id === activeFilter
      if (!matchesFilter) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        ds.name.toLowerCase().includes(q) ||
        ds.fullName.toLowerCase().includes(q) ||
        ds.modality.toLowerCase().includes(q) ||
        ds.description.toLowerCase().includes(q) ||
        ds.classes.some((c) => c.toLowerCase().includes(q))
      )
    })
  }, [searchQuery, activeFilter])



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
        statusText="DATASET REGISTRY ONLINE"
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
              <span className="text-white font-semibold">Datasets</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.08] text-[11px] font-mono text-text-secondary">
              <Shield size={12} className="text-crimson" />
              <span>Micro-OD Corpus</span>
            </div>
          </div>
        </header>

        {/* Dataset Explorer Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-9">
          {/* ─── 1. PAGE HEADER ────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/[0.06]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-crimson/10 border border-crimson/25 flex items-center justify-center text-crimson">
                  <Database size={16} />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-crimson/15 border border-crimson/30 text-[10px] font-mono font-bold text-crimson">
                  <Layers size={11} />
                  <span>RESEARCH DATASETS</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-white">
                Dataset Explorer
              </h1>

              <p className="text-xs sm:text-sm text-text-secondary max-w-2xl font-sans">
                Explore microscopy datasets used for cell detection and few-shot evaluation.
              </p>
            </div>

            {/* Scientific Indicator */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
              <Sparkles size={13} className="text-crimson" />
              <span>Standardized Bio-Imaging Corpus</span>
            </div>
          </div>

          {/* ─── 2. DATASET OVERVIEW (252 / 40 / 212 / 4) ──────────────── */}
          <DatasetOverview />

          {/* ─── 3. DATASET FILTER BAR (Search, Filters, Grid/List) ───── */}
          <DatasetFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* ─── 4. DATASET COLLECTION (BBBC, BCCD, LIVECell, NIH-3T3) ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-bold text-white tracking-tight">
                  Micro-OD Dataset Collection
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Showing {filteredDatasets.length} of {DATASETS.length} benchmark datasets.
                </p>
              </div>
            </div>

            {filteredDatasets.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
                    : 'space-y-3'
                }
              >
                {filteredDatasets.map((ds, idx) => (
                  <DatasetCard
                    key={ds.id}
                    dataset={ds}
                    index={idx}
                    viewMode={viewMode}
                    onExplore={setSelectedDatasetForDetail}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
                <Search size={24} className="mx-auto text-text-muted" />
                <h3 className="text-sm font-heading font-bold text-white">
                  No matching datasets found
                </h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  No datasets matched your query &ldquo;{searchQuery}&rdquo;. Try clearing filters or searching for terms like &ldquo;blood&rdquo;, &ldquo;phase&rdquo;, or &ldquo;fluorescence&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setActiveFilter('All')
                  }}
                  className="px-3 py-1.5 rounded-lg bg-crimson/15 text-crimson border border-crimson/30 text-xs font-mono"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* ─── 5. DATASET IMAGE PREVIEW AREA ─────────────────────────── */}
          <DatasetGallery
            datasets={DATASETS}
            activeDatasetId={activeFilter}
          />

          {/* ─── 6. DATASET CLASS INFORMATION ──────────────────────────── */}
          <DatasetClassTags activeDatasetId={activeFilter} />

          {/* ─── 7. DATASET STRUCTURE (Directory Hierarchy) ─────────────── */}
          <DatasetTree />

          {/* ─── 8. DATASET PURPOSE ("Why These Datasets?") ────────────── */}
          <DatasetPurpose />
        </main>
      </div>

      {/* ─── 9. DATASET DETAIL MODAL ────────────────────────────────────── */}
      <DatasetDetail
        dataset={selectedDatasetForDetail}
        onClose={() => setSelectedDatasetForDetail(null)}
      />
    </div>
  )
}
