import { Search, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react'

const FILTER_TABS = [
  { id: 'All', label: 'All' },
  { id: 'micro_od', label: 'Micro-OD' },
  { id: 'nih_nlm_malaria', label: 'Malaria' },
  { id: 'c_nmc_2019', label: 'Leukemia' },
  { id: 'redtell_anemia', label: 'RedTell' },
  { id: 'sipakmed', label: 'SIPaKMeD' },
  { id: 'BBBC', label: 'BBBC' },
  { id: 'BCCD', label: 'BCCD' },
  { id: 'LIVECell', label: 'LIVECell' },
  { id: 'NIH-3T3', label: 'NIH-3T3' },
]

/**
 * DatasetFilters — Research-grade search, category filter & layout toggle
 */
export default function DatasetFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="p-3.5 rounded-2xl bg-black/60 border border-white/[0.08] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Left: Search input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search datasets, modalities, cell types..."
          className="w-full pl-10 pr-9 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-crimson/60 focus:ring-1 focus:ring-crimson/40 focus:bg-white/[0.05] text-xs font-mono text-white placeholder:text-text-muted focus:outline-none transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Center: Filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
        {FILTER_TABS.map((tab) => {
          const tabId = typeof tab === 'string' ? tab : tab.id
          const tabLabel = typeof tab === 'string' ? tab : tab.label
          const isActive = activeFilter === tabId

          return (
            <button
              key={tabId}
              type="button"
              onClick={() => onFilterChange(tabId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 shrink-0 ${
                isActive
                  ? 'bg-crimson text-white shadow-[0_0_12px_rgba(255,42,85,0.4)] font-bold'
                  : 'bg-white/[0.02] text-text-secondary hover:text-white hover:bg-white/[0.05] border border-transparent'
              }`}
            >
              {tabLabel}
            </button>
          )
        })}
      </div>

      {/* Right: View toggle (Grid / List) */}
      <div className="flex items-center gap-1 self-end md:self-auto pl-2 border-t md:border-t-0 md:border-l border-white/[0.08] pt-2 md:pt-0">
        <button
          type="button"
          onClick={() => onViewModeChange('grid')}
          aria-label="Grid view"
          className={`p-2 rounded-lg border text-xs transition-colors ${
            viewMode === 'grid'
              ? 'bg-crimson/15 border-crimson/40 text-crimson'
              : 'bg-white/[0.02] border-white/[0.06] text-text-muted hover:text-white'
          }`}
        >
          <LayoutGrid size={15} />
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange('list')}
          aria-label="List view"
          className={`p-2 rounded-lg border text-xs transition-colors ${
            viewMode === 'list'
              ? 'bg-crimson/15 border-crimson/40 text-crimson'
              : 'bg-white/[0.02] border-white/[0.06] text-text-muted hover:text-white'
          }`}
        >
          <List size={15} />
        </button>
      </div>
    </div>
  )
}
