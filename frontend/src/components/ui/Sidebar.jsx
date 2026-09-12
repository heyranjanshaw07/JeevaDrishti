import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ScanLine, BarChart2, Database, FlaskConical,
  BookOpen, Settings, LogOut, Microscope, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: ScanLine, label: 'Analyze', path: '/analyze' },
  { icon: BarChart2, label: 'Benchmark', path: '/benchmark' },
  { icon: Database, label: 'Datasets', path: '/datasets' },
  { icon: FlaskConical, label: 'Experiments', path: '/dashboard' },
  { icon: BookOpen, label: 'Research', path: '/research' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, openLogoutModal } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    openLogoutModal()
  }

  return (
    <motion.aside
      className="h-screen flex flex-col glass border-r border-white/5 shrink-0 relative z-10"
      animate={{ width: sidebarCollapsed ? 64 : 220 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Logo area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-7 h-7 rounded-lg bg-crimson/15 border border-crimson/30 flex items-center justify-center shrink-0">
                <Microscope size={14} className="text-crimson" />
              </div>
              <div>
                <p className="text-xs font-bold text-white font-display">JeevaDrishti</p>
                <p className="text-[9px] text-text-muted font-mono">v1.0 ALPHA</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {sidebarCollapsed && (
          <div className="w-7 h-7 rounded-lg bg-crimson/15 border border-crimson/30 flex items-center justify-center mx-auto">
            <Microscope size={14} className="text-crimson" />
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full glass border border-crimson/25 flex items-center justify-center text-crimson hover:border-crimson/50 transition-colors z-20"
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-hidden">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <NavLink key={label} to={path} end={path === '/dashboard'}>
            {({ isActive }) => (
              <motion.div
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                whileHover={{ x: sidebarCollapsed ? 0 : 3 }}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon size={16} className="shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* System status */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-3 mb-3 p-3 rounded-xl bg-void/80 border border-crimson/15"
          >
            <p className="sci-label text-[9px] mb-2">System Status</p>
            {[
              { label: 'AI Engine', status: 'READY' },
              { label: 'VLM Module', status: 'READY' },
              { label: 'SAM Pipeline', status: 'READY' },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-text-muted font-mono">{label}</span>
                <span className="text-[9px] text-bio font-mono flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-bio" />
                  {status}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout */}
      <div className="px-2 pb-4">
        <button
          onClick={handleLogout}
          className="sidebar-item w-full"
          title={sidebarCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
