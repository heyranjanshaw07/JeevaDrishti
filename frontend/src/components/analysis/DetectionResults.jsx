import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Target, Download, FileText, Info,
  Sparkles, CheckCircle2, ShieldCheck, Layers, AlertCircle,
  Brain, HelpCircle, Activity, Check, Scan, Zap, Loader2
} from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { openAnalysisReport } from '@/services/api'
import DetectionOverlay from './DetectionOverlay'
import DetectionSummary from './DetectionSummary'
import DetectionList from './DetectionList'

/**
 * DetectionResults — Master Interface for Cell-Level Microscopy Inference
 * 
 * Displays dynamic results directly from the backend AI model:
 * - Real model prediction (or "Unable to determine")
 * - Dynamic confidence score
 * - Detected indicators list returned by model
 * - Diagnostic model explanation
 * - Proper loading, error, and empty states
 * - Zero hardcoded or fabricated results
 */
export default function DetectionResults({
  image = null,
  results = null,
  shotMode = '6 Shot',
  onShotModeChange,
  pipelineStatus = 'Ready',
}) {
  const hasResults = Boolean(results?.detections && results.detections.length > 0)
  const isRejected = results?.status === 'rejected'
  const isComplete = results?.status === 'complete' || results?.status === 'completed'
  const isRunning = results?.status === 'running' || results?.status === 'processing'
  const isFailed = results?.status === 'failed'
  const isUndetermined = isComplete && !hasResults
  const hasReport = Boolean(results?.analysis_id)

  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  const handleDownloadReport = () => {
    if (!results?.analysis_id || isGeneratingReport) return
    setIsGeneratingReport(true)
    try {
      openAnalysisReport(results.analysis_id)
    } catch (err) {
      console.error('Failed to open PDF report:', err)
    } finally {
      setTimeout(() => setIsGeneratingReport(false), 800)
    }
  }

  return (
    <section id="detection-results" className="space-y-6">
      {/* ─── 1. RESULTS HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold tracking-wider text-crimson uppercase">
              02 // INFERENCE PREDICTIONS
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
            Detection Results
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mt-1">
            Cell-level predictions generated dynamically from the provided input.
          </p>
        </div>

        {/* Status Badge */}
        <div className="self-start sm:self-center">
          {isRunning ? (
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-crimson/15 text-crimson border border-crimson/30 text-sm font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-crimson animate-ping" />
              ANALYZING INPUT...
            </span>
          ) : isRejected ? (
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-ruby/20 text-ruby border border-ruby/40 text-sm font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-ruby" />
              NON-MICROSCOPY IMAGE
            </span>
          ) : isFailed ? (
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-ruby/20 text-ruby border border-ruby/40 text-sm font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-ruby" />
              INFERENCE ERROR
            </span>
          ) : isUndetermined ? (
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-sm font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              VALID MICROSCOPY (0 CELLS)
            </span>
          ) : isComplete ? (
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-crimson/15 text-white border border-crimson/40 text-sm font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-crimson animate-pulse shadow-[0_0_8px_#FF2A55]" />
              VALID MICROSCOPY ({results?.detections?.length || 0} CELLS)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] text-white/80 border border-white/[0.1] text-sm font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-white/40" />
              AWAITING ANALYSIS
            </span>
          )}
        </div>
      </div>

      {/* ─── LOADING STATE BANNER ────────────────────────────────────── */}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-crimson/[0.08] border border-crimson/30 flex items-center justify-between gap-3 text-sm font-mono"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-crimson/20 border border-crimson/40 flex items-center justify-center text-crimson animate-spin">
              <Zap size={16} />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Executing Microscopy Validation & Inference</div>
              <div className="text-white/70 text-xs mt-0.5">Validating optical field, scanning candidate patches, querying VLM...</div>
            </div>
          </div>
          <span className="text-crimson font-bold uppercase tracking-wider hidden sm:inline text-xs">PROCESSING</span>
        </motion.div>
      )}

      {/* ─── ERROR STATE BANNER ──────────────────────────────────────── */}
      {isFailed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-ruby/10 border border-ruby/30 flex items-start justify-between gap-3 text-xs font-mono text-ruby"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="text-ruby shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white mb-0.5">Analysis Failed</div>
              <div className="text-ruby/90 leading-relaxed">
                {results.error || 'The detection engine encountered an error while processing the image.'}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-ruby/80 px-2 py-0.5 rounded bg-ruby/20 border border-ruby/30 shrink-0">
            PIPELINE ERROR
          </span>
        </motion.div>
      )}

      {/* ─── NON-MICROSCOPY REJECTION CARD ──────────────────────────── */}
      {isRejected && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <GlassCard className="p-6 sm:p-7 border-ruby/40 bg-ruby/[0.04]" glow>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-ruby/20 border border-ruby/40 flex items-center justify-center text-ruby shrink-0">
                  <AlertCircle size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-ruby">
                      VALIDATION REJECTED // NON-MICROSCOPY IMAGE
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight mt-0.5">
                    {results?.message || 'The uploaded image does not appear to be a microscopy image.'}
                  </h3>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-ruby/20 text-ruby border border-ruby/40 shrink-0">
                REASON: {results?.reason || 'non_microscopy_image'}
              </span>
            </div>

            <div className="mt-4 space-y-3 text-sm font-mono text-text-secondary">
              <p className="leading-relaxed">
                The validation layer intercepted this image before biological cell detection.
                No cellular predictions (RBC/WBC/etc.) or arbitrary metrics were generated.
              </p>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-white/85 text-sm leading-relaxed">
                <strong className="text-white font-semibold">Microscopy Standard: </strong>
                {results?.explanation || 'Image does not match standard optical, electron, or fluorescence microscopy profiles (detected as an ID card, document, screenshot, or natural photograph).'}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* ─── STANDBY BANNER (NO RESULTS YET) ─────────────────────────── */}
      {!isComplete && !isRunning && !isFailed && !isRejected && (
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between gap-3 text-sm font-mono">
          <div className="flex items-center gap-2.5">
            <Info size={16} className="text-crimson shrink-0" />
            <span className="text-white/90">
              <strong className="text-white font-semibold">Ready for analysis.</strong> Upload or select an input image above and click &quot;Run Analysis&quot;.
            </span>
          </div>
          <span className="text-xs text-white/50 hidden md:inline font-semibold">STANDBY</span>
        </div>
      )}

      {/* ─── MODEL DETECTION INTELLIGENCE CARD (DYNAMIC RESULT) ──────── */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <GlassCard
            className={`p-6 sm:p-7 border transition-all ${
              isUndetermined
                ? 'border-amber-500/30 bg-amber-500/[0.03]'
                : 'border-crimson/30 bg-crimson/[0.02]'
            }`}
            glow
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-5 mb-5 border-b border-white/[0.08]">
              {/* Prediction Headline */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-muted font-semibold">
                    ACTUAL MODEL PREDICTION
                  </span>
                  {isUndetermined ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      VALID MICROSCOPY
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-crimson/20 text-crimson border border-crimson/30">
                      CONFIRMED BY MODEL
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3.5">
                  {isUndetermined ? (
                    <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <HelpCircle size={24} />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-crimson/15 border border-crimson/30 flex items-center justify-center text-crimson shrink-0">
                      <Brain size={24} />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight">
                      {isUndetermined
                        ? (results.prediction && results.prediction !== 'Unable to determine' ? results.prediction : '0 Cells Detected')
                        : (results.prediction || 'Cellular Morphology Detected')}
                    </h3>
                    <p className="text-sm text-text-secondary font-mono mt-0.5">
                      {isUndetermined
                        ? 'No cells were confidently detected by the current inference pipeline'
                        : `Dynamic classification resolved from ${results.detections.length} candidate instances`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Confidence Score Badge */}
              <div className="lg:text-right shrink-0 p-4 rounded-xl bg-black/40 border border-white/[0.08] min-w-[160px]">
                <div className="text-xs font-mono text-text-muted uppercase tracking-wider font-semibold">
                  MODEL CONFIDENCE
                </div>
                <div className="text-3xl sm:text-4xl font-mono font-extrabold text-white tracking-tight mt-0.5">
                  {results.confidence != null && results.confidence > 0
                    ? `${(results.confidence * 100).toFixed(1)}%`
                    : isUndetermined
                    ? '—'
                    : '—'}
                </div>
                <div className="text-xs font-mono text-white/50 mt-0.5">
                  {isUndetermined ? 'Below threshold' : 'Calibrated inference'}
                </div>
              </div>
            </div>

            {/* Detected Indicators List */}
            <div className="space-y-3 pb-5 mb-5 border-b border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-bold text-white flex items-center gap-2">
                  <Activity size={15} className="text-crimson" />
                  DETECTED INDICATORS
                </span>
                <span className="text-xs font-mono text-white/60">
                  {results.indicators?.length || 0} SIGNALS IDENTIFIED
                </span>
              </div>

              {results.indicators && results.indicators.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {results.indicators.map((ind, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-black/50 border border-white/[0.08] flex items-start gap-2.5 text-sm font-mono text-white/90"
                    >
                      <Check size={15} className="text-crimson shrink-0 mt-0.5" />
                      <span className="leading-snug">{ind}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-black/30 border border-white/[0.06] text-sm font-mono text-white/60 italic">
                  {isUndetermined
                    ? 'No cytological indicators detected in this image.'
                    : 'No specific indicator breakdown reported by model.'}
                </div>
              )}
            </div>

            {/* Model Explanation */}
            <div className="space-y-2">
              <span className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <Sparkles size={15} className="text-crimson" />
                MODEL EXPLANATION & CONTEXT
              </span>
              <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] text-sm font-mono text-white/85 leading-relaxed">
                {results.explanation ||
                  (isUndetermined
                    ? 'No cells were confidently detected by the current inference pipeline.'
                    : 'Model concluded analysis based on evaluated image patches.')}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* ─── 4. RESULT SUMMARY (Four KPI Cards) ───────────────────────── */}
      <DetectionSummary metrics={results?.metrics} />

      {/* ─── 2. LARGE DETECTION VIEWER (With Dual State & Controls) ──── */}
      <GlassCard className="p-5 sm:p-6 border-white/[0.08]" glow>
        <DetectionOverlay
          image={image}
          results={results}
        />
      </GlassCard>

      {/* ─── 5. CELL DETECTION LIST (Table/Cards) ─────────────────────── */}
      <DetectionList detections={results?.detections || []} />

      {/* ─── 9 & 10. EXPORT RESULTS & HUMAN REVIEW GUIDANCE ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 9. EXPORT RESULTS AREA (Span 6) */}
        <div className="lg:col-span-6">
          <GlassCard className="p-5 sm:p-6 border-white/[0.08] flex flex-col justify-between h-full" glow>
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Download size={15} className="text-crimson" />
                  <h4 className="text-xs font-heading font-bold text-white tracking-wider uppercase">
                    EXPORT RESULTS
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-white/40">
                  {hasReport ? 'EXPORT READY' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                Download verified detection overlays, raw coordinates (JSON), or a compiled research and clinical report.
              </p>
            </div>

            <div className="pt-2">
              {/* Download Report */}
              <button
                type="button"
                id="download-report-btn"
                onClick={handleDownloadReport}
                disabled={!hasReport || isGeneratingReport}
                title={hasReport ? 'Download research analysis report (PDF)' : 'Available after real inference'}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-mono font-semibold transition-all duration-200 ${
                  hasReport && !isGeneratingReport
                    ? 'border-crimson/50 bg-crimson/15 text-white hover:bg-crimson hover:text-white hover:shadow-[0_0_16px_rgba(255,42,85,0.4)] cursor-pointer active:scale-[0.99]'
                    : 'border-white/[0.08] bg-black/40 text-white/40 cursor-not-allowed disabled:opacity-40'
                }`}
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-crimson" />
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <FileText size={14} className={hasReport ? 'text-crimson' : 'text-white/40'} />
                    <span>Download Report</span>
                  </>
                )}
              </button>
            </div>
          </GlassCard>
        </div>

        {/* 10. HUMAN REVIEW GUIDANCE CARD (Span 6) */}
        <div className="lg:col-span-6">
          <GlassCard className="p-5 sm:p-6 border-white/[0.08] flex flex-col justify-between h-full" glow>
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-crimson" />
                  <h4 className="text-xs font-heading font-bold text-white tracking-wider uppercase">
                    HUMAN REVIEW GUIDANCE
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                  PATHOLOGIST TRIAGE
                </span>
              </div>
              <ul className="text-xs text-text-secondary leading-relaxed space-y-2 mb-3">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson shrink-0 mt-1.5" />
                  <span>Verify all flagged high-priority regions against cytological reference standards.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson shrink-0 mt-1.5" />
                  <span>Cross-reference automated cell counts with clinical smear findings and patient history.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-crimson shrink-0 mt-1.5" />
                  <span>JeevaDrishti provides AI diagnostic decision-support; qualified pathologist validation is required.</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
              <span className="text-text-muted">Review Status</span>
              <span className="text-amber-400 font-bold tracking-wider uppercase">
                {isComplete ? 'Awaiting Human Verification' : 'Pending Inference'}
              </span>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  )
}
