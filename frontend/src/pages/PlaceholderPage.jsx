import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Microscope, LayoutDashboard, ScanLine, BarChart3, 
  Database, BookOpen, FlaskConical, Settings, 
  LogIn, UserPlus, Compass, Menu
} from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import AppSidebar from '@/components/navigation/AppSidebar'
import { pageTransitionVariants } from '@/components/transitions/motionVariants'

const ALL_ROUTES = [
  { path: '/', label: 'Landing', icon: Compass },
  { path: '/login', label: 'Login', icon: LogIn },
  { path: '/signup', label: 'Signup', icon: UserPlus },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/analyze', label: 'Analyze', icon: ScanLine },
  { path: '/benchmark', label: 'Benchmark', icon: BarChart3 },
  { path: '/dataset', label: 'Datasets', icon: Database },
  { path: '/research', label: 'Research', icon: BookOpen },
  { path: '/experiments', label: 'Experiments', icon: FlaskConical },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function PlaceholderPage({
  title = 'Laboratory View',
  route = '/',
  systemTag = 'VISION ENGINE',
  description = 'Part 1 Project Setup & Design System placeholder. Full module will be built in subsequent phases.',
  icon: Icon = Microscope,
}) {
  const location = useLocation()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen w-full bg-[#060205] text-[#FFFFFF] flex relative selection:bg-[#FF2A55]/30 selection:text-white overflow-x-hidden">
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
        <div className="absolute -top-40 right-10 w-[600px] h-[600px] bg-[#FF2A55]/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-10 left-60 w-[550px] h-[550px] bg-[#FF2A55]/[0.05] rounded-full blur-[180px]" />
      </div>

      {/* App Sidebar (Desktop + Mobile Drawer) */}
      <AppSidebar
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
        statusText={`${systemTag} ONLINE`}
      />

      {/* Main Content Area */}
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
              <Link to="/dashboard" className="text-white/50 hover:text-white transition-colors">
                Dashboard
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-white font-semibold">{title}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge label="SYSTEM ONLINE" variant="crimson" />
            <StatusBadge label="LATENCY" value="24ms" variant="crimson" />
          </div>
        </header>

        <motion.div
          variants={pageTransitionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1 flex flex-col justify-between p-6 sm:p-10 max-w-6xl mx-auto w-full"
        >
          {/* Center Card */}
          <main className="my-auto py-12 flex flex-col items-center justify-center">
            <GlassCard className="max-w-2xl w-full p-8 sm:p-10 text-center border-white/[0.08]" glow>
              {/* Top Status & Route chip */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                <StatusBadge label={systemTag} variant="crimson" />
                <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-text-secondary">
                  ROUTE: {route}
                </span>
                <StatusBadge label="RESEARCH LAB" variant="white" pulse={false} />
              </div>

              {/* Icon Badge */}
              <div className="mx-auto w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.1] flex items-center justify-center text-crimson mb-6 shadow-[0_0_30px_rgba(255,42,85,0.2)]">
                <Icon size={32} />
              </div>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-text-primary tracking-tight mb-3">
                {title}
              </h2>

              <p className="text-sm sm:text-base text-text-secondary max-w-lg mx-auto leading-relaxed mb-8">
                {description}
              </p>

              {/* Specimen Telemetry Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-black/40 border border-white/[0.06] mb-8 text-left">
                <div>
                  <span className="text-[10px] font-mono text-text-muted block uppercase">Architecture</span>
                  <span className="text-xs font-medium text-text-primary">React 19 + Vite</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-text-muted block uppercase">Design Theme</span>
                  <span className="text-xs font-medium text-crimson">Void Hematology</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-text-muted block uppercase">Accent Ratio</span>
                  <span className="text-xs font-medium text-text-primary">70/15/10/5</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-text-muted block uppercase">Typography</span>
                  <span className="text-xs font-medium text-white/90">Space Grotesk</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="primary" icon={Microscope}>
                  Design System Active
                </Button>
                <Button variant="secondary" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
                  View All Routes
                </Button>
              </div>
            </GlassCard>
          </main>

          {/* Route Navigator Strip */}
          <footer className="pt-6 border-t border-white/[0.06]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
              <span className="text-xs font-mono text-text-muted">
                GLOBAL ROUTE MATRIX (PART 1 FOUNDATION)
              </span>
              <span className="text-xs text-text-secondary">
                "Empowering Microscopy with Intelligent Vision"
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              {ALL_ROUTES.map((r) => {
                const isActive = location.pathname === r.path
                const RIcon = r.icon
                return (
                  <Link
                    key={r.path}
                    to={r.path}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-aurora/15 text-aurora border border-aurora/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        : 'bg-white/[0.02] text-text-secondary hover:text-text-primary hover:bg-white/[0.05] border border-white/[0.05]'
                    }`}
                  >
                    <RIcon size={13} className={isActive ? 'text-aurora' : 'opacity-70'} />
                    <span>{r.label}</span>
                    <span className="font-mono text-[10px] opacity-60">({r.path})</span>
                  </Link>
                )
              })}
            </div>
          </footer>
        </motion.div>
      </div>
    </div>
  )
}
