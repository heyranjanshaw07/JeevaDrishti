import { useState, useCallback, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ScanLine, BarChart3, Database,
  BookOpen, FlaskConical, Microscope, Settings,
  ArrowRight, Menu, X, Activity, Layers, Target,
  Clock, ShieldCheck, Compass, Sparkles, Terminal,
  CheckCircle2, ChevronRight, Info, LogOut
} from 'lucide-react'

import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import AppSidebar from '@/components/navigation/AppSidebar'
import MicroscopyViewer from '@/components/analysis/MicroscopyViewer'
import AnalysisConfig from '@/components/analysis/AnalysisConfig'
import DetectionResults from '@/components/analysis/DetectionResults'
import { runFullPipeline, ensureSessionToken } from '@/services/api'
import { useAppStore } from '@/store/appStore'


export default function Analyze() {
  const navigate = useNavigate()
  const location = useLocation()
  const { openLogoutModal } = useAppStore()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const handleLogout = () => {
    openLogoutModal()
  }

  // Ensure active researcher session token is available
  useEffect(() => {
    ensureSessionToken().catch(() => {})
  }, [])

  // Workbench Form State
  const [selectedDataset, setSelectedDataset] = useState('auto')
  const [selectedShotMode, setSelectedShotMode] = useState('6 Shot')
  const [selectedModel, setSelectedModel] = useState('optical')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // State architecture for dynamic inference results from actual model
  const [analysisResults, setAnalysisResults] = useState({
    status: 'idle',
    prediction: null,
    confidence: null,
    indicators: [],
    explanation: null,
    detections: [],
    metrics: null,
    overlay: null,
    shotMetrics: null,
    error: null,
  })

  // Running state for the pipeline
  const [isRunning, setIsRunning] = useState(false)
  const [pipelineStage, setPipelineStage] = useState('idle')
  const [runError, setRunError] = useState(null)

  // Map display shot strings → backend integer
  const shotModeToInt = (mode) => {
    const map = { '0 Shot': 0, '6 Shot': 6 }
    return map[mode] ?? 0
  }

  // Run the full pipeline: upload → create → run → results
  const handleRunAnalysis = useCallback(async () => {
    let fileToUse = selectedFile
    if (!fileToUse && previewUrl) {
      try {
        const resp = await fetch(previewUrl)
        const blob = await resp.blob()
        fileToUse = new File([blob], 'microscopy_sample.jpg', { type: blob.type || 'image/jpeg' })
      } catch (e) {
        console.warn('Could not extract file from previewUrl:', e)
      }
    }
    if (!fileToUse || isRunning) return
    setIsRunning(true)
    setRunError(null)
    // Clear previous results immediately upon new submission
    setAnalysisResults({
      status: 'running',
      prediction: null,
      confidence: null,
      indicators: [],
      explanation: null,
      detections: [],
      metrics: null,
      overlay: null,
      shotMetrics: null,
      error: null,
    })

    try {
      const shots = shotModeToInt(selectedShotMode)
      const result = await runFullPipeline(
        fileToUse,
        selectedDataset,
        shots,
        (stage) => setPipelineStage(stage),
        selectedModel
      )

      const isRejected = result.status === 'rejected'
      const isFailed = result.status === 'failed'
      const errDetail = result.error_message || (isFailed ? 'Inference failed on the backend model.' : null)

      setAnalysisResults({
        analysis_id: result.analysis_id,
        dataset: result.dataset || selectedDataset,
        shots: result.shots ?? shots,
        vlm_model: result.vlm_model || selectedModel,
        created_at: result.created_at || null,
        completed_at: result.completed_at || null,
        status: isRejected ? 'rejected' : (isFailed ? 'failed' : 'complete'),
        reason: result.reason || (isRejected ? 'non_microscopy_image' : null),
        message: result.message || null,
        prediction: isRejected ? 'Non-Microscopy Image' : (result.prediction || (isFailed ? null : (result.detections?.length === 0 ? 'No Cells Detected' : 'Cellular Detection Complete'))),
        confidence: isRejected ? null : result.confidence,
        indicators: isRejected ? [] : (result.indicators || []),
        explanation: isRejected ? (result.message || 'The uploaded image does not appear to be a microscopy image.') : (result.explanation || (result.detections?.length === 0 ? 'No cells were confidently detected by the current inference pipeline.' : null)),
        detections: isRejected ? [] : (result.detections || []),
        metrics: isRejected ? null : (result.metrics || null),
        overlay: isRejected ? null : (result.overlay_url || null),
        shotMetrics: !isFailed && !isRejected && result.detections?.length ? {
          [`${shots}-shot`]: { status: 'Evaluated', detections: result.detections.length }
        } : null,
        error: isFailed ? errDetail : null,
      })

      if (isFailed) {
        setRunError(errDetail)
      }
    } catch (err) {
      const errMsg = err.message || 'Analysis failed. Please try again.'
      setRunError(errMsg)
      setAnalysisResults({
        status: 'failed',
        prediction: null,
        confidence: null,
        indicators: [],
        explanation: null,
        detections: [],
        metrics: null,
        overlay: null,
        shotMetrics: null,
        error: errMsg,
      })
    } finally {
      setIsRunning(false)
      setPipelineStage('idle')
    }
  }, [selectedFile, previewUrl, selectedDataset, selectedShotMode, selectedModel, isRunning])

  // Handle local file selection with object URL cleanup and immediate result clearing
  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file)
    setRunError(null)
    // Clear previous results immediately upon selecting a new input
    setAnalysisResults({
      status: 'idle',
      prediction: null,
      confidence: null,
      indicators: [],
      explanation: null,
      detections: [],
      metrics: null,
      overlay: null,
      shotMetrics: null,
      error: null,
    })
    setPreviewUrl((prevUrl) => {
      if (prevUrl) {
        try {
          URL.revokeObjectURL(prevUrl)
        } catch (_) {}
      }
      return URL.createObjectURL(file)
    })
  }, [])

  // Clear loaded image and revoke object URL, resetting results to idle
  const handleClearImage = useCallback(() => {
    setPreviewUrl((prevUrl) => {
      if (prevUrl) {
        try {
          URL.revokeObjectURL(prevUrl)
        } catch (_) {}
      }
      return null
    })
    setSelectedFile(null)
    setRunError(null)
    setAnalysisResults({
      status: 'idle',
      prediction: null,
      confidence: null,
      indicators: [],
      explanation: null,
      detections: [],
      metrics: null,
      overlay: null,
      shotMetrics: null,
      error: null,
    })
  }, [])

  // Cleanup object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        try {
          URL.revokeObjectURL(previewUrl)
        } catch (_) {}
      }
    }
  }, [previewUrl])

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
        statusText="ANALYSIS ENGINE IDLE"
      />

      {/* ───────────────────────────────────────────────────────────────────
          2. MAIN WORKSPACE CONTAINER
      ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* ─── Top Command Bar ─────────────────────────────────────────── */}
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
              className="lg:hidden w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-text-secondary hover:text-white cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb: Dashboard / Analyze */}
            <div className="flex items-center gap-2 text-sm font-mono">
              <Link to="/dashboard" className="text-text-muted hover:text-white transition-colors">
                Dashboard
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-white font-semibold tracking-wide">Analyze</span>
            </div>
          </div>

          {/* Right: Status + Researcher Profile + Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-[0_0_6px_#FFFFFF]" />
              </span>
              <span className="text-white font-medium">RESEARCH WORKBENCH</span>
            </div>

            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-white/[0.08]">
              <div className="w-8 h-8 rounded-xl bg-crimson/20 border border-crimson/40 flex items-center justify-center text-xs font-heading font-bold text-white shadow-[0_0_12px_rgba(255,42,85,0.25)]">
                ES
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-white leading-none">
                  Dr. Evelyn Sharma
                </span>
                <span className="text-[11px] font-mono text-text-muted mt-0.5">
                  Lead Researcher
                </span>
              </div>
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
        </motion.header>

        {/* ─── Scrollable Analysis Workspace ───────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* ─────────────────────────────────────────────────────────────
              1. PAGE HEADER
          ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson/10 border border-crimson/30 text-xs font-mono text-crimson uppercase tracking-wider font-semibold mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
                <span>DIAGNOSTIC WORKBENCH</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">
                Microscopy Analysis
              </h1>
              <p className="text-sm sm:text-base text-text-secondary mt-1.5 max-w-2xl leading-relaxed">
                Upload a microscopy specimen for automated cellular detection, classification, and diagnostic review.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono text-white/80 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AI ASSIST: <span className="text-white font-bold">AUTOMATED SCAN</span>
              </span>
            </div>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────
              2. ANALYSIS WORKSPACE (Two-Column Layout)
          ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* LEFT — Image Input / Viewer (Span 7) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25, ease: 'easeOut' }}
              className="lg:col-span-7"
            >
              <MicroscopyViewer
                file={selectedFile}
                preview={previewUrl}
                onFileSelect={handleFileSelect}
                onClear={handleClearImage}
              />
            </motion.div>

            {/* RIGHT — Configuration (Span 5, vertically centered) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.35, ease: 'easeOut' }}
              className="lg:col-span-5 flex flex-col justify-center items-center self-center w-full"
            >
              {/* Configuration Panel */}
              <AnalysisConfig
                dataset={selectedDataset}
                onDatasetChange={setSelectedDataset}
                shotMode={selectedShotMode}
                onShotModeChange={setSelectedShotMode}
                model={selectedModel}
                onModelChange={setSelectedModel}
                isReady={Boolean(previewUrl)}
                onRun={handleRunAnalysis}
                isRunning={isRunning}
              />
            </motion.div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              4. RESULTS AREA ("Detection Results")
          ───────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
          >
            <DetectionResults
              image={previewUrl}
              results={analysisResults}
              shotMode={selectedShotMode}
              onShotModeChange={setSelectedShotMode}
              pipelineStatus={
                isRunning
                  ? 'Processing'
                  : analysisResults.status === 'failed'
                  ? 'Error'
                  : analysisResults.status === 'complete'
                  ? 'Complete'
                  : 'Ready'
              }
            />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
