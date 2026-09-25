import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  FlaskRound as Flask,
  Sliders,
  LogOut,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { getBenchmarkMatrix, runBenchmarkExperiment } from '@/services/api'

// Part 8A Components
import BenchmarkHero from '@/components/benchmark/BenchmarkHero'
import BenchmarkOverview from '@/components/benchmark/BenchmarkOverview'
import BenchmarkDatasetCards from '@/components/benchmark/BenchmarkDatasetCards'
import ResearchQuestion from '@/components/benchmark/ResearchQuestion'
import BenchmarkPipeline from '@/components/benchmark/BenchmarkPipeline'
import ResearchStatus from '@/components/benchmark/ResearchStatus'

// Part 8B Components
import ExperimentConfiguration from '@/components/benchmark/ExperimentConfiguration'
import MetricsPanel from '@/components/benchmark/MetricsPanel'
import BenchmarkChart from '@/components/benchmark/BenchmarkChart'
import ExperimentMatrix from '@/components/benchmark/ExperimentMatrix'
import EvaluationStatus from '@/components/benchmark/EvaluationStatus'
import ShotComparisonVisual from '@/components/benchmark/ShotComparisonVisual'
import ExperimentSummary from '@/components/benchmark/ExperimentSummary'
import ResearchMetricsInfo from '@/components/benchmark/ResearchMetricsInfo'
import AppSidebar from '@/components/navigation/AppSidebar'

export default function Benchmark() {
  const location = useLocation()
  const navigate = useNavigate()
  const { openLogoutModal } = useAppStore()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const handleLogout = () => {
    openLogoutModal()
  }

  // ─── Part 8B Benchmark State (Real evaluation tracking) ────────────────────
  const [selectedDataset, setSelectedDataset] = useState('c_nmc_2019')
  const [selectedShot, setSelectedShot] = useState(0)
  const [matrixCells, setMatrixCells] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [runError, setRunError] = useState(null)

  const fetchMatrix = useCallback(async () => {
    try {
      const data = await getBenchmarkMatrix()
      if (data && data.cells) {
        setMatrixCells(data.cells)
      }
    } catch (err) {
      console.error('Failed to load benchmark matrix:', err)
    }
  }, [])

  useEffect(() => {
    fetchMatrix()
  }, [fetchMatrix])

  const handleRunEvaluation = async (dataset, shots) => {
    setIsRunning(true)
    setRunError(null)
    try {
      await runBenchmarkExperiment({ dataset, shots })
      await fetchMatrix()
    } catch (err) {
      console.error('Benchmark execution error:', err)
      setRunError(err.message || 'Benchmark evaluation failed.')
    } finally {
      setIsRunning(false)
    }
  }

  // Active cell based on selected dataset & shot
  const activeCell = useMemo(() => {
    return matrixCells.find(
      (c) =>
        (c.dataset.toLowerCase() === selectedDataset.toLowerCase() ||
          (selectedDataset === 'micro_od' && c.dataset.toLowerCase() === 'micro-od')) &&
        c.shots === selectedShot
    ) || null
  }, [matrixCells, selectedDataset, selectedShot])

  const taskType = activeCell?.task_type || (
    ['c_nmc_2019', 'redtell_anemia', 'sipakmed'].includes(selectedDataset.toLowerCase())
      ? 'cell_classification'
      : 'object_detection'
  )

  const activeStatus = activeCell?.status || 'not_evaluated'

  const metrics = useMemo(() => {
    if (!activeCell || activeCell.status === 'not_evaluated' || activeCell.status === 'not_available') {
      return {
        mF1: null,
        precision: null,
        recall: null,
        iou: null,
        accuracy: null,
        latency: null,
        vlmCalls: null,
      }
    }
    return {
      mF1: activeCell.mf1,
      precision: activeCell.precision,
      recall: activeCell.recall,
      iou: activeCell.iou,
      accuracy: activeCell.accuracy,
      latency: activeCell.latency,
      vlmCalls: activeCell.vlm_calls,
    }
  }, [activeCell])

  // Few-shot comparison chart data for the current dataset (0-shot vs 6-shot)
  const chartData = useMemo(() => {
    const shot0Cell = matrixCells.find(
      (c) =>
        (c.dataset.toLowerCase() === selectedDataset.toLowerCase() ||
          (selectedDataset === 'micro_od' && c.dataset.toLowerCase() === 'micro-od')) &&
        c.shots === 0
    )
    const shot6Cell = matrixCells.find(
      (c) =>
        (c.dataset.toLowerCase() === selectedDataset.toLowerCase() ||
          (selectedDataset === 'micro_od' && c.dataset.toLowerCase() === 'micro-od')) &&
        c.shots === 6
    )

    const formatPoint = (label, cell) => {
      if (!cell || (cell.status !== 'evaluated' && cell.status !== 'completed')) {
        return { shot: label, mF1: null, precision: null, recall: null }
      }
      const f1Val = cell.mf1 !== null && cell.mf1 !== undefined ? Math.round(cell.mf1 * 100) : (cell.accuracy !== null ? Math.round(cell.accuracy * 100) : null)
      const precVal = cell.precision !== null && cell.precision !== undefined ? Math.round(cell.precision * 100) : null
      const recVal = cell.recall !== null && cell.recall !== undefined ? Math.round(cell.recall * 100) : null
      return { shot: label, mF1: f1Val, precision: precVal, recall: recVal }
    }

    return [
      formatPoint('0 Shot', shot0Cell),
      formatPoint('6 Shot', shot6Cell),
    ]
  }, [matrixCells, selectedDataset])



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
        statusText="BENCHMARK CONSOLE READY"
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
            <div className="flex items-center gap-2 text-sm font-mono">
              <Link to="/dashboard" className="text-text-muted hover:text-white transition-colors">
                JeevaDrishti
              </Link>
              <ChevronRight size={14} className="text-white/20" />
              <span className="text-white font-semibold">Benchmark</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-text-secondary font-medium">
              <Shield size={13} className="text-crimson" />
              <span>Micro-OD Protocol</span>
            </div>

            {/* Header Quick Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out / Logout"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-mono font-medium transition-all duration-200 cursor-pointer shadow-sm"
            >
              <LogOut size={13} className="shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Benchmark Body Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-10">
          {/* ─── 1. PAGE HEADER (Part 8A) ────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-white/[0.06]">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-crimson/10 border border-crimson/25 flex items-center justify-center text-crimson">
                  <BarChart3 size={18} />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-crimson/15 border border-crimson/30 text-xs font-mono font-bold text-crimson">
                  <Sparkles size={11} />
                  <span>MICRO-OD BENCHMARK</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black tracking-tight text-white">
                Research Benchmark
              </h1>

              <p className="text-sm sm:text-base text-text-secondary max-w-2xl font-sans leading-relaxed">
                Evaluate zero-shot and few-shot cell detection across microscopy datasets.
              </p>
            </div>

            {/* Subtle Research Indicator */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-text-muted">
              <Flask size={14} className="text-crimson" />
              <span>AI Microscopy Research Laboratory</span>
            </div>
          </div>

          {/* ─── 2. BENCHMARK HERO (Part 8A) ─────────────────────────────── */}
          <BenchmarkHero />

          {/* ─── 3. VERIFIED DATASET OVERVIEW (Part 8A) ─────────────────── */}
          <BenchmarkOverview />

          {/* ─── 4. RESEARCH QUESTION HIGHLIGHT (Part 8A) ───────────────── */}
          <ResearchQuestion />

          {/* ─── 5. EXPERIMENT CONSOLE SECTION (Part 8B) ────────────────── */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Sliders size={20} className="text-crimson" />
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight">
                  Evaluation Console &amp; Metrics
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-xs font-mono px-3 py-1 rounded bg-crimson/10 text-crimson border border-crimson/25 font-bold">
                  PART 8B EXPERIMENTAL ENGINE
                </span>
                <Link
                  to="/experiments"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-sm font-mono text-white/90 hover:text-white transition-colors"
                >
                  <FlaskConical size={14} className="text-crimson" />
                  <span>Experiments Lab</span>
                  <ChevronRight size={14} className="text-white/40" />
                </Link>
              </div>
            </div>

            {/* 1 & 2: Experiment Configuration (Shot & Dataset selectors) */}
            <ExperimentConfiguration
              selectedShot={selectedShot}
              onSelectShot={setSelectedShot}
              selectedDataset={selectedDataset}
              onSelectDataset={setSelectedDataset}
            />

            {/* 9: Active Configuration Summary */}
            <ExperimentSummary
              selectedDataset={selectedDataset}
              selectedShot={selectedShot}
            />

            {/* 6: Evaluation Status Control Card */}
            <EvaluationStatus
              selectedShot={selectedShot}
              selectedDataset={selectedDataset}
              onRunEvaluation={handleRunEvaluation}
              isRunning={isRunning}
              activeCellStatus={activeStatus}
              errorMessage={runError}
            />

            {/* 3: Evaluation Metrics Panel */}
            <MetricsPanel
              metrics={metrics}
              taskType={taskType}
              status={activeStatus}
            />

            {/* 4: Few-Shot Performance Chart */}
            <BenchmarkChart data={chartData} />

            {/* 5: Experiment Matrix */}
            <ExperimentMatrix
              selectedShot={selectedShot}
              selectedDataset={selectedDataset}
              matrixCells={matrixCells}
              onSelectCell={(ds, shot) => {
                setSelectedDataset(ds)
                setSelectedShot(shot)
              }}
            />

            {/* 8: Conceptual Visual: From Zero-Shot to Few-Shot */}
            <ShotComparisonVisual selectedShot={selectedShot} />

            {/* 7: How JeevaDrishti is Evaluated (Expandable info) */}
            <ResearchMetricsInfo />
          </div>

          {/* ─── 6. DATASET SUMMARY (Part 8A) ───────────────────────────── */}
          <BenchmarkDatasetCards />

          {/* ─── 7. BENCHMARK PIPELINE (Part 8A) ────────────────────────── */}
          <BenchmarkPipeline />

          {/* ─── 8. RESEARCH STATUS (Part 8A) ───────────────────────────── */}
          <ResearchStatus />
        </main>
      </div>
    </div>
  )
}
