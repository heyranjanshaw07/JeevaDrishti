import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Microscope, Bell, Settings, ChevronRight, Activity } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

/**
 * Top navigation bar for dashboard pages
 */
export default function Navbar() {
  const location = useLocation()
  const { user } = useAppStore()

  const getPageTitle = () => {
    const map = {
      '/dashboard': 'Overview',
      '/analyze': 'Analyze',
      '/benchmark': 'Benchmark',
      '/datasets': 'Datasets',
      '/research': 'Research',
      '/settings': 'Settings',
    }
    return map[location.pathname] || 'JeevaDrishti'
  }

  return (
    <header className="h-16 glass border-b border-white/5 flex items-center justify-between px-6 shrink-0">
      {/* Left — Logo + breadcrumb */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-crimson/15 border border-crimson/30 flex items-center justify-center">
            <Microscope size={16} className="text-crimson" />
          </div>
          <span className="font-display font-bold text-sm text-white hidden md:block">JeevaDrishti</span>
        </Link>
        <ChevronRight size={14} className="text-text-muted" />
        <span className="text-sm font-medium text-text-secondary">{getPageTitle()}</span>
      </div>

      {/* Center — Status */}
      <div className="hidden md:flex items-center gap-2 glass px-4 py-1.5 rounded-full">
        <span className="status-dot" />
        <span className="sci-label text-[10px]">AI Engine Ready</span>
        <Activity size={12} className="text-crimson ml-1 animate-pulse" />
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-crimson transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-crimson rounded-full" />
        </button>

        <Link to="/settings">
          <button className="w-9 h-9 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-crimson transition-colors">
            <Settings size={16} />
          </button>
        </Link>

        <motion.div
          className="flex items-center gap-2.5 glass px-3 py-1.5 rounded-xl cursor-pointer"
          whileHover={{ borderColor: 'rgba(255,42,85,0.3)' }}
        >
          <div className="w-7 h-7 rounded-lg bg-crimson/15 border border-crimson/30 flex items-center justify-center">
            <span className="text-crimson text-xs font-bold">
              {user?.name?.charAt(0) || 'R'}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-medium text-text-primary leading-none">{user?.name || 'Researcher'}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{user?.institution || 'Research Lab'}</p>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
