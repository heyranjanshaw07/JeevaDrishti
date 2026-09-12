import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ScanLine, BarChart3, Database,
  BookOpen, FlaskConical, Microscope, Settings,
  ArrowRight, Menu, X, Activity, Layers, Target,
  Clock, ShieldCheck, Compass, Sparkles, Terminal,
  CheckCircle2, ChevronRight, Upload, Info, Sliders,
  HelpCircle, Image as ImageIcon, LogOut
} from 'lucide-react'
import {
  ResponsiveContainer, ComposedChart, AreaChart, Area, BarChart, Bar,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, Cell
} from 'recharts'

import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import UploadBox from '@/components/ui/UploadBox'
import AppSidebar from '@/components/navigation/AppSidebar'

import {
  PROJECT_METRICS,
  PROJECT_DATASET_ECOSYSTEM,
  PROJECT_VISION_PIPELINE,
  PROJECT_PIPELINE_STATUS,
  PROJECT_RESEARCH_INSIGHT,
  DEMO_ANALYSIS_CHART,
  DEMO_RECENT_ANALYSIS,
  DEMO_FEW_SHOT_CONFIGS,
} from '@/data/mockData'
import { useAppStore } from '@/store/appStore'
import { getAnalysisHistory, MOCK_ANALYSIS_HISTORY } from '@/services/api'

// ─── Animated KPI Counter Component ──────────────────────────────────────────
function AnimatedCounter({ value, duration = 1.3 }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const numericTarget = parseInt(String(value).replace(/,/g, ''), 10)
    if (isNaN(numericTarget)) return

    let startTime = null
    let animationFrameId

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(easeProgress * numericTarget)
      setDisplayValue(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        setDisplayValue(numericTarget)
      }
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [value, duration])

  // If value is non-numeric string (e.g. "0 / 1 / 3 / 6"), render as-is cleanly
  if (typeof value === 'string' && isNaN(parseInt(value.replace(/,/g, ''), 10))) {
    return <span>{value}</span>
  }

  return <span>{(displayValue ?? 0).toLocaleString()}</span>
}



// ─── Custom Tooltip for Recharts (White & Crimson only) ──────────────────────
const RechartsCrimsonTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className="bg-[#060205]/95 border border-crimson/35 backdrop-blur-xl px-3.5 py-2.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.9)] text-xs font-mono space-y-1"
    >
      <p className="text-white/70 font-semibold border-b border-white/[0.08] pb-1 mb-1.5">
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-white/80">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color || '#FF2A55' }}
            />
            <span className="capitalize">{entry.name || entry.dataKey}:</span>
          </span>
          <span className="text-white font-bold">{entry.value}%</span>
        </div>
      ))}
    </motion.div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Auth store — real user profile
  const { user, openLogoutModal } = useAppStore()
  const displayName = user?.name || 'Researcher'
  const displayRole = user?.role || 'Researcher'
  const avatarInitials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleLogout = () => {
    openLogoutModal()
  }

  // Interactive Few-Shot Adaptation Selected Mode
  const [selectedShotMode, setSelectedShotMode] = useState('6-SHOT')
  const currentShotData = DEMO_FEW_SHOT_CONFIGS[selectedShotMode]

  // Real analysis history from backend (with fallback to DEMO_RECENT_ANALYSIS)
  const [liveHistory, setLiveHistory] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setHistoryLoading(true)
    getAnalysisHistory(1, 5)
      .then((data) => {
        if (!cancelled) {
          setLiveHistory(data?.items || [])
        }
      })
      .catch(() => {
        if (!cancelled) setLiveHistory(null) // null = use demo fallback
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Format relative time from ISO timestamp
  const relativeTime = (iso) => {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} min ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`
  }


  return (
    <div className="min-h-screen w-full bg-[#060205] text-[#FFFFFF] flex relative selection:bg-crimson/30 selection:text-white overflow-x-hidden">
      {/* ─── 8. Background: Void Hematology & Subtle Scientific Grid ────── */}
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
        {/* Soft atmospheric crimson glows */}
        <div className="absolute -top-40 right-10 w-[650px] h-[650px] bg-crimson/10 rounded-full blur-[180px]" />
        <div className="absolute top-1/2 left-40 w-[500px] h-[500px] bg-crimson/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-1/3 w-[550px] h-[550px] bg-crimson/[0.06] rounded-full blur-[180px]" />
      </div>

      {/* App Sidebar (Desktop + Mobile Drawer) */}
      <AppSidebar
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
        statusText="VISION ENGINE ONLINE"
      />

      {/* ───────────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA (Offset by sidebar width on desktop)
      ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* ─── Top Command Bar (Stagger Step 2) ─────────────────────────── */}
        <motion.header
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
          className="sticky top-0 z-20 h-16 border-b border-white/[0.08] bg-[#060205]/85 backdrop-blur-xl px-4 sm:px-6 lg:px-8 flex items-center justify-between"
        >
          {/* Left: Mobile Toggle + Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-text-secondary hover:text-white"
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb: Dashboard / Overview */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono">
              <span className="text-text-muted">Dashboard</span>
              <span className="text-white/20">/</span>
              <span className="text-white font-semibold tracking-wide">Overview</span>
            </div>
          </div>

          {/* Right: System Status + Researcher Profile + Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* System Status Indicator (Crimson/White Only) */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-[0_0_6px_#FFFFFF]" />
              </span>
              <span className="text-white font-medium">SYSTEM OPERATIONAL</span>
            </div>

            {/* User profile / Researcher */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-white/[0.08]">
              <div className="w-8 h-8 rounded-xl bg-crimson/20 border border-crimson/40 flex items-center justify-center text-xs sm:text-sm font-heading font-bold text-white shadow-[0_0_12px_rgba(255,42,85,0.25)]">
                {avatarInitials}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold text-white leading-none">
                  {displayName}
                </span>
                <span className="text-xs font-mono text-text-muted mt-0.5">
                  {displayRole}
                </span>
              </div>
            </div>

            {/* Dedicated Logout Action */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-crimson/20 border border-white/[0.08] hover:border-crimson/40 text-text-secondary hover:text-white transition-all text-xs sm:text-sm font-mono group"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={15} className="group-hover:rotate-12 transition-transform text-crimson" />
              <span className="hidden sm:inline font-medium">Logout</span>
            </button>
          </div>
        </motion.header>

        {/* ─── Scrollable Page Workspace ───────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* ─────────────────────────────────────────────────────────────
              3. MAIN HERO SECTION (Stagger Step 3)
          ───────────────────────────────────────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2, ease: 'easeOut' }}
            className="relative rounded-3xl p-6 sm:p-10 border border-white/[0.1] bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)]"
          >
            {/* Ambient Background Crimson Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-crimson/15 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="relative z-10 max-w-3xl">
              {/* Eyebrow Label */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson/10 border border-crimson/30 text-[11px] font-mono text-crimson tracking-wider uppercase font-semibold mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse shadow-[0_0_8px_#FF2A55]" />
                <span>GOOD MORNING, RESEARCHER</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-white leading-tight mb-3">
                JeevaDrishti Research Command Center
              </h1>

              {/* Subtext */}
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-8 max-w-2xl">
                "Monitor microscopy analysis, model performance, few-shot adaptation, and research experiments from a single workspace."
              </p>

              {/* Hero Action Buttons (5. Interactive Buttons) */}
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  variant="primary"
                  size="md"
                  iconRight={ArrowRight}
                  onClick={() => navigate('/analyze')}
                  className="group hover:shadow-[0_0_25px_rgba(255,42,85,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  START NEW ANALYSIS →
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  iconRight={ArrowRight}
                  onClick={() => navigate('/benchmark')}
                  className="group hover:border-crimson/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  VIEW BENCHMARKS →
                </Button>
              </div>
            </div>
          </motion.section>

          {/* ─────────────────────────────────────────────────────────────
              4. KPI CARDS (Stagger Step 4 + Smooth KPI Counters)
          ───────────────────────────────────────────────────────────── */}
          <motion.section
            id="kpi-metrics"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3, ease: 'easeOut' }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold tracking-wider text-text-muted uppercase">
                01 // BENCHMARK KEY PERFORMANCE INDICATORS
              </span>
              <span className="text-[10px] font-mono text-white/50 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
                PROJECT DATA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PROJECT_METRICS.map((kpi, idx) => (
                <motion.div
                  key={kpi.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.32 + idx * 0.07, ease: 'easeOut' }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-crimson/40 hover:shadow-[0_12px_35px_rgba(255,42,85,0.15)] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider font-medium">
                        {kpi.label}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
                    </div>
                    {/* Animated Number Counter */}
                    <div className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight mb-1.5">
                      <AnimatedCounter value={kpi.value} />
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary font-mono mt-2">
                    {kpi.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ─────────────────────────────────────────────────────────────
              5. CHARTS & PANELS (Stagger Step 5 & 6 + Scroll Reveal)
          ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* 2. Analysis Overview (Span 8) */}
            <section id="analysis-overview" className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold tracking-wider text-text-muted uppercase">
                  02 // ANALYSIS OVERVIEW
                </span>
                <span className="text-[10px] font-mono text-crimson bg-crimson/10 px-2 py-0.5 rounded border border-crimson/30 font-semibold">
                  DEMO VISUALIZATION
                </span>
              </div>

              <motion.div
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-crimson/35 hover:shadow-[0_12px_35px_rgba(255,42,85,0.14)] transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                  <div className="flex items-center gap-2.5">
                    <Activity size={17} className="text-crimson" />
                    <div>
                      <h3 className="text-sm font-heading font-bold text-white">
                        Few-Shot Precision Trajectory (mF1)
                      </h3>
                      <p className="text-[11px] font-mono text-text-muted">
                        Progression across 0-Shot, 1-Shot, 3-Shot, and 6-Shot regimes
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-white/60">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-crimson" /> Overall
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white" /> Cytology
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-ruby" /> Fluorescence
                    </span>
                  </div>
                </div>

                {/* 4. Recharts Line/Area Visualization with Smooth In-View Animation */}
                <div className="w-full h-64 my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={DEMO_ANALYSIS_CHART}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="crimsonGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF2A55" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#FF2A55" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255, 255, 255, 0.05)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="shot"
                        stroke="#64748b"
                        tick={{ fill: '#FFFFFF', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                        axisLine={false}
                        tickLine={false}
                        domain={[35, 95]}
                      />
                      <Tooltip content={<RechartsCrimsonTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="overall"
                        name="Mean mF1"
                        stroke="#FF2A55"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#crimsonGradient)"
                        isAnimationActive={true}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                      <Line
                        type="monotone"
                        dataKey="bccd"
                        name="BCCD"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        dot={{ fill: '#FFFFFF', r: 3 }}
                        isAnimationActive={true}
                        animationDuration={1300}
                        animationEasing="ease-out"
                      />
                      <Line
                        type="monotone"
                        dataKey="bbbc"
                        name="BBBC"
                        stroke="#DC2626"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ fill: '#DC2626', r: 3 }}
                        isAnimationActive={true}
                        animationDuration={1400}
                        animationEasing="ease-out"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-[11px] font-mono text-text-muted">
                  <span className="flex items-center gap-1">
                    <Info size={13} className="text-crimson" />
                    <span>DEMO VISUALIZATION — ILLUSTRATIVE BASELINE TRAJECTORY</span>
                  </span>
                  <span className="text-white/60">EVAL: MICRO-OD v1.0</span>
                </div>
              </motion.div>
            </section>

            {/* 4. Quick Analysis (Span 4) */}
            <section id="quick-analysis" className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold tracking-wider text-text-muted uppercase">
                  04 // READY TO ANALYZE?
                </span>
                <span className="text-[10px] font-mono text-crimson font-medium">DISPATCH</span>
              </div>

              <motion.div
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-crimson/35 hover:shadow-[0_12px_35px_rgba(255,42,85,0.14)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ScanLine size={16} className="text-crimson" />
                    <h3 className="text-sm font-heading font-bold text-white">
                      Direct Specimen Runner
                    </h3>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    "Upload a microscopy image and let JeevaDrishti analyze it using the hybrid vision pipeline."
                  </p>

                  {/* Reusable UploadBox Component */}
                  <div
                    onClick={() => navigate('/analyze')}
                    className="cursor-pointer mb-4 group"
                  >
                    <UploadBox
                      onFileSelect={() => navigate('/analyze')}
                    />
                  </div>
                </div>

                {/* Primary Action Buttons (5. Interactive Buttons) */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center text-xs group hover:shadow-[0_0_22px_rgba(255,42,85,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                    iconRight={ArrowRight}
                    onClick={() => navigate('/analyze')}
                  >
                    UPLOAD MICROSCOPY IMAGE →
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center text-xs group hover:border-crimson/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                    iconRight={ArrowRight}
                    onClick={() => navigate('/analyze?sample=blood_smear_042.png')}
                  >
                    TRY SAMPLE IMAGE →
                  </Button>
                </div>
              </motion.div>
            </section>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              6. FEW-SHOT ADAPTATION (Interactive Dynamic Controller)
          ───────────────────────────────────────────────────────────── */}
          <motion.section
            id="few-shot-adaptation"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold tracking-wider text-text-muted uppercase">
                06 // FEW-SHOT ADAPTATION
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-crimson bg-crimson/10 px-2 py-0.5 rounded border border-crimson/30 font-semibold">
                  DEMO DATA
                </span>
                <span className="text-[10px] font-mono text-white/40 hidden sm:inline">
                  (ILLUSTRATIVE BENCHMARK)
                </span>
              </div>
            </div>

            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-crimson/35 hover:shadow-[0_12px_35px_rgba(255,42,85,0.14)] transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06] mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sliders size={16} className="text-crimson" />
                    <h3 className="text-base font-heading font-bold text-white">
                      Interactive Shot Regime Selector
                    </h3>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Select a shot regime to inspect adaptation dynamics across benchmark cytology datasets.
                  </p>
                </div>

                {/* 4 Interactive Shot Buttons with Elevation & Glow */}
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-black/60 border border-white/[0.08] shrink-0">
                  {['0-SHOT', '1-SHOT', '3-SHOT', '6-SHOT'].map((shot) => {
                    const isSelected = selectedShotMode === shot
                    return (
                      <button
                        key={shot}
                        onClick={() => setSelectedShotMode(shot)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-crimson text-white shadow-[0_0_18px_rgba(255,42,85,0.5)] border border-crimson scale-[1.02]'
                            : 'text-text-secondary hover:text-white hover:bg-white/[0.05] border border-transparent'
                        }`}
                      >
                        {shot}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dynamic Metrics & Chart Display */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left: Dynamic Metrics Cards */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.06] hover:border-crimson/30 transition-colors">
                    <span className="text-[10px] font-mono text-text-muted uppercase block mb-1">
                      MEAN DETECTION mF1
                    </span>
                    <span className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                      {currentShotData.mF1}
                    </span>
                    <span className="text-[10px] font-mono text-crimson block mt-1">
                      +{(currentShotData.accuracyNum - 52.4).toFixed(1)}% vs 0-Shot
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.06] hover:border-white/20 transition-colors">
                    <span className="text-[10px] font-mono text-text-muted uppercase block mb-1">
                      INFERENCE LATENCY
                    </span>
                    <span className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                      {currentShotData.latency}
                    </span>
                    <span className="text-[10px] font-mono text-white/50 block mt-1">
                      Single GPU Pass
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.06] hover:border-white/20 transition-colors">
                    <span className="text-[10px] font-mono text-text-muted uppercase block mb-1">
                      ACTIVE EXEMPLARS
                    </span>
                    <span className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                      {currentShotData.exemplars}
                    </span>
                    <span className="text-[10px] font-mono text-text-secondary block mt-1">
                      Per Clinical Class
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.06] hover:border-crimson/30 transition-colors">
                    <span className="text-[10px] font-mono text-text-muted uppercase block mb-1">
                      AVG CONFIDENCE
                    </span>
                    <span className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                      {currentShotData.confidence}
                    </span>
                    <span className="text-[10px] font-mono text-crimson block mt-1">
                      Calibrated Logits
                    </span>
                  </div>

                  <div className="col-span-2 p-3 rounded-xl bg-crimson/[0.06] border border-crimson/25 text-xs text-text-secondary font-mono">
                    <span className="text-crimson font-bold mr-1.5">REGIME PROFILE:</span>
                    {currentShotData.description}
                  </div>
                </div>

                {/* Right: Per-Dataset Bar Chart for Selected Shot (Animated Recharts) */}
                <div className="lg:col-span-7 h-60">
                  <div className="text-[11px] font-mono text-white/70 mb-2 flex items-center justify-between">
                    <span>CROSS-DATASET mF1 // {selectedShotMode}</span>
                    <span className="text-crimson">DEMO DATA ONLY</span>
                  </div>
                  <ResponsiveContainer width="100%" height="88%">
                    <BarChart
                      data={currentShotData.datasetScores}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255, 255, 255, 0.05)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="dataset"
                        stroke="#64748b"
                        tick={{ fill: '#FFFFFF', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip content={<RechartsCrimsonTooltip />} />
                      <Bar
                        dataKey="score"
                        name="mF1 Score"
                        radius={[6, 6, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      >
                        {currentShotData.datasetScores.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index % 2 === 0 ? '#FF2A55' : '#FFFFFF'}
                            fillOpacity={0.88}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-4 mt-5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span>NOTE: DEMO DATA REPRESENTS SIMULATED CITATION BENCHMARK BEHAVIOR</span>
                <span className="text-white/60">NO FABRICATED RESEARCH RESULTS</span>
              </div>
            </motion.div>
          </motion.section>

          {/* ─────────────────────────────────────────────────────────────
              3 & 5. RECENT ANALYSIS & VISION PIPELINE (With 6. Animated Pipeline Pulse)
          ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* 3. Recent Analysis (Span 7) */}
            <section id="recent-analysis" className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold tracking-wider text-text-muted uppercase">
                  03 // RECENT ANALYSIS
                </span>
                <span className="text-[10px] font-mono text-crimson bg-crimson/10 px-2 py-0.5 rounded border border-crimson/30 font-semibold">
                  DEMO HISTORY
                </span>
              </div>

              <motion.div
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-crimson/35 hover:shadow-[0_12px_35px_rgba(255,42,85,0.14)] transition-all duration-300"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-crimson" />
                    <h3 className="text-sm font-heading font-bold text-white">
                      Recent Inspection Log
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">
                    {historyLoading
                      ? 'Loading...'
                      : liveHistory !== null
                        ? `${liveHistory.length} record${liveHistory.length !== 1 ? 's' : ''}`
                        : '3 Cached Demonstrations'}
                  </span>
                </div>

                {/* Analysis History Records — real backend data with DEMO fallback */}
                <div className="space-y-3">
                  {historyLoading ? (
                    // Loading skeleton
                    [1, 2, 3].map((i) => (
                      <div key={i} className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] animate-pulse">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.04]" />
                          <div className="space-y-2 flex-1">
                            <div className="h-3 bg-white/[0.06] rounded w-2/3" />
                            <div className="h-2.5 bg-white/[0.04] rounded w-1/3" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : liveHistory !== null && liveHistory.length > 0 ? (
                    // Real backend records
                    liveHistory.map((item) => (
                      <div
                        key={item.analysis_id}
                        onClick={() => navigate('/analyze')}
                        className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-crimson/40 hover:bg-black/60 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-crimson/10 border border-crimson/25 flex items-center justify-center text-crimson group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(255,42,85,0.3)] transition-all">
                            <Microscope size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-mono font-bold text-white group-hover:text-crimson transition-colors">
                                {item.dataset} Analysis
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-white/80 border border-white/[0.08]">
                                {item.dataset} · {item.shots}-shot
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                              <span className="text-crimson font-medium capitalize">
                                {item.status}
                              </span>
                              <span className="text-white/30">•</span>
                              <span className="text-text-muted font-mono text-[11px]">
                                {relativeTime(item.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-crimson/10 border border-crimson/30 text-[10px] font-mono text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
                            {item.status.toUpperCase()}
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-text-muted group-hover:text-white group-hover:translate-x-1 transition-all"
                          />
                        </div>
                      </div>
                    ))
                  ) : liveHistory !== null && liveHistory.length === 0 ? (
                    // Empty real state — no analyses yet
                    <div className="p-6 rounded-2xl bg-black/30 border border-white/[0.04] text-center">
                      <Microscope size={28} className="text-white/20 mx-auto mb-2" />
                      <p className="text-xs font-mono text-text-muted">No analyses yet.</p>
                      <p className="text-[11px] font-mono text-text-muted mt-0.5">Upload an image to get started.</p>
                    </div>
                  ) : (
                    // Fallback: backend unreachable — show demo
                    DEMO_RECENT_ANALYSIS.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/analyze?sample=${item.fileName}`)}
                        className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-crimson/40 hover:bg-black/60 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-crimson/10 border border-crimson/25 flex items-center justify-center text-crimson group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(255,42,85,0.3)] transition-all">
                            <Microscope size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-mono font-bold text-white group-hover:text-crimson transition-colors">
                                {item.fileName}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-white/80 border border-white/[0.08]">
                                {item.dataset} · {item.shotMode}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                              <span className="text-crimson font-medium">
                                {item.cellCount} cells detected
                              </span>
                              <span className="text-white/30">•</span>
                              <span className="text-text-muted font-mono text-[11px]">
                                {item.timestamp}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-crimson/10 border border-crimson/30 text-[10px] font-mono text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
                            {item.status}
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-text-muted group-hover:text-white group-hover:translate-x-1 transition-all"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-text-muted">
                  <span>{liveHistory !== null ? 'STATUS: LIVE DATA' : 'STATUS: DEMO DATA'}</span>
                  <Link to="/analyze" className="text-crimson hover:underline flex items-center gap-1 group">
                    Load New Specimen <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            </section>

            {/* 5. Vision Pipeline (With 6. Animated Traveling Pulse) */}
            <section id="vision-pipeline" className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold tracking-wider text-text-muted uppercase">
                  05 // VISION PIPELINE
                </span>
                <span className="text-[10px] font-mono text-crimson font-medium">ARCHITECTURE</span>
              </div>

              <motion.div
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-crimson/35 hover:shadow-[0_12px_35px_rgba(255,42,85,0.14)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-crimson" />
                      <h3 className="text-sm font-heading font-bold text-white">
                        Hybrid Vision Architecture
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-crimson bg-crimson/10 px-2 py-0.5 rounded border border-crimson/25">
                      SAM + VLM
                    </span>
                  </div>

                  {/* Compact Visual Pipeline Stages with Crimson Nodes & Traveling Pulse */}
                  <div className="relative pl-6 space-y-4 my-2">
                    {/* Vertical Connecting Gradient Track */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-crimson/50 via-ruby/40 to-white/20" />

                    {/* 6. Traveling Crimson Pulse Moving Through the Pipeline */}
                    <motion.div
                      animate={{
                        top: ['0%', '100%'],
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{
                        duration: 3.2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="absolute left-[11px] w-[3px] h-10 -translate-x-1/2 rounded-full bg-gradient-to-b from-transparent via-[#FF2A55] to-white shadow-[0_0_12px_#FF2A55] pointer-events-none"
                    />

                    {PROJECT_VISION_PIPELINE.map((stage, idx) => (
                      <div key={stage.step} className="relative flex items-start gap-3 group">
                        {/* Crimson Node with Soft Pulse Animation */}
                        <div className="absolute -left-[19px] top-1 w-4 h-4 rounded-full bg-[#060205] border-2 border-crimson flex items-center justify-center shadow-[0_0_8px_rgba(255,42,85,0.4)] group-hover:shadow-[0_0_14px_#FF2A55] transition-shadow">
                          <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.4, ease: 'easeInOut' }}
                            className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#FFFFFF]"
                          />
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05] group-hover:border-crimson/30 transition-colors w-full">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-heading font-bold text-white tracking-wide">
                              {stage.title}
                            </span>
                            <span className="text-[10px] font-mono text-crimson font-semibold">
                              STEP {stage.step}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary mt-0.5">
                            {stage.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. Subtle Pulsing Status Items (Crimson & White only, Zero Green) */}
                <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-1.5">
                  {PROJECT_PIPELINE_STATUS.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 text-[11px] font-mono text-white/90"
                    >
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson opacity-60" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-crimson shadow-[0_0_6px_#FF2A55]" />
                      </span>
                      <span className="tracking-wide font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </section>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              7 & 8. DATASET SNAPSHOT & RESEARCH INSIGHT
          ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* 7. Dataset Snapshot / Dataset Ecosystem (Span 6) */}
            <section id="dataset-snapshot" className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold tracking-wider text-text-muted uppercase">
                  07 // DATASET ECOSYSTEM
                </span>
                <span className="text-[10px] font-mono text-white/50">BENCHMARK REPOSITORY</span>
              </div>

              <motion.div
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-crimson/35 hover:shadow-[0_12px_35px_rgba(255,42,85,0.14)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-crimson" />
                      <h3 className="text-sm font-heading font-bold text-white">
                        Supported Microscopy Suites
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crimson/10 text-crimson border border-crimson/25">
                      4 DATASETS
                    </span>
                  </div>

                  {/* 4 Datasets: BBBC, BCCD, LIVECell, NIH-3T3 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {PROJECT_DATASET_ECOSYSTEM.map((ds) => (
                      <div
                        key={ds.id}
                        className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-crimson/40 hover:bg-black/60 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-heading font-extrabold text-white tracking-wide">
                            {ds.id}
                          </span>
                          <span className="text-[10px] font-mono text-crimson">
                            {ds.samples} imgs
                          </span>
                        </div>
                        <p className="text-[11px] text-white/75 line-clamp-1 mb-1">
                          {ds.name}
                        </p>
                        <span className="text-[10px] font-mono text-text-muted block">
                          {ds.modality}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted">
                    Total Test Annotations: <strong className="text-white">5,551 cells</strong>
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    iconRight={ArrowRight}
                    onClick={() => navigate('/datasets')}
                    className="group hover:border-crimson/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                  >
                    VIEW DATASETS →
                  </Button>
                </div>
              </motion.div>
            </section>

            {/* 8. Research Insight / Research Question (Span 6) */}
            <section id="research-insight" className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold tracking-wider text-text-muted uppercase">
                  08 // RESEARCH INSIGHT
                </span>
                <span className="text-[10px] font-mono text-crimson bg-crimson/10 px-2 py-0.5 rounded border border-crimson/30 font-semibold">
                  HYPOTHESIS
                </span>
              </div>

              <motion.div
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-crimson/35 hover:shadow-[0_12px_35px_rgba(255,42,85,0.14)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-crimson" />
                      <h3 className="text-sm font-heading font-bold text-white">
                        {PROJECT_RESEARCH_INSIGHT.tag}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-white/50">FEW-SHOT VLM</span>
                  </div>

                  {/* Explicit Research Question */}
                  <blockquote className="text-sm sm:text-base font-heading font-bold text-white border-l-2 border-crimson pl-4 py-1 mb-4 leading-snug">
                    "{PROJECT_RESEARCH_INSIGHT.question}"
                  </blockquote>

                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    {PROJECT_RESEARCH_INSIGHT.abstract}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted">
                    Paper & Methodology
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    iconRight={ArrowRight}
                    onClick={() => navigate('/research')}
                    className="group hover:shadow-[0_0_22px_rgba(255,42,85,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                  >
                    EXPLORE RESEARCH →
                  </Button>
                </div>
              </motion.div>
            </section>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
