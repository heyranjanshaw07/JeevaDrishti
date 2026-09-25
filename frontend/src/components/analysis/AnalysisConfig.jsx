import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sliders, Database, Cpu, Layers, Play, Check, ChevronDown, Sparkles } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'

const DATASET_OPTIONS = [
  { id: 'micro_od', label: 'Micro-OD Benchmark', taskType: 'Detection', domain: 'Multi-Modal Optical' },
  { id: 'nih_nlm_malaria', label: 'NIH-NLM Malaria', taskType: 'Detection', domain: 'Thin Blood Smears' },
  { id: 'c_nmc_2019', label: 'C-NMC 2019 Leukemia', taskType: 'Classification', domain: 'Blood Smear Blasts' },
  { id: 'redtell_anemia', label: 'RedTell Anemia', taskType: 'Classification', domain: 'RBC Morphology' },
  { id: 'sipakmed', label: 'SIPaKMeD Cervical', taskType: 'Classification', domain: 'Pap Smear Cytology' },
  { id: 'BBBC', label: 'BBBC (Micro-OD)', taskType: 'Detection', domain: 'Fluorescence' },
  { id: 'BCCD', label: 'BCCD (Micro-OD)', taskType: 'Detection', domain: 'Blood Smear' },
  { id: 'LIVECell', label: 'LIVECell (Micro-OD)', taskType: 'Detection', domain: 'Phase-Contrast' },
  { id: 'NIH-3T3', label: 'NIH-3T3 (Micro-OD)', taskType: 'Detection', domain: 'Brightfield' },
]
const SHOT_OPTIONS = ['0 Shot', '6 Shot']
const MODEL_OPTIONS = [
  { id: 'optical', label: 'Optical Vision Engine (Local Dynamic)', badge: 'LOCAL' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Google Cloud VLM)', badge: 'CLOUD' },
  { id: 'gpt-4o', label: 'GPT-4o Vision (OpenAI)', badge: 'CLOUD' },
  { id: 'default', label: 'SAM + VLM Foundation (Live Weights)', badge: 'SAM' },
]

/**
 * AnalysisConfig — AI Microscopy Research Configuration Panel
 */
export default function AnalysisConfig({
  dataset = 'micro_od',
  onDatasetChange,
  shotMode = '6 Shot',
  onShotModeChange,
  model = 'optical',
  onModelChange,
  isReady = false,
  onRun = null,
  isRunning = false,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)

  const activeDatasetOpt = DATASET_OPTIONS.find(
    (d) => d.id.toLowerCase() === (dataset || '').toLowerCase()
  ) || DATASET_OPTIONS[0]

  const handleRunClick = () => {
    if (!isReady || isRunning) return
    if (typeof onRun === 'function') {
      onRun()
    }
  }

  return (
    <GlassCard className="p-5 sm:p-6 border-white/[0.08] flex flex-col justify-between" glow>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-crimson" />
            <h3 className="text-base font-heading font-bold text-white tracking-wide">
              ANALYSIS CONFIGURATION
            </h3>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-white/[0.05] text-white/80 border border-white/[0.08] font-semibold">
            PARAMETERS
          </span>
        </div>

        {/* 1. Dataset Selector */}
        <div className="space-y-2">
          <label className="text-sm font-mono font-semibold text-white/90 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Database size={15} className="text-crimson" />
              Target Dataset & Task
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${
              activeDatasetOpt.taskType === 'Classification'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-crimson/10 text-crimson border-crimson/30'
            }`}>
              {activeDatasetOpt.taskType}
            </span>
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-black/60 border border-white/[0.1] hover:border-crimson/40 focus:outline-none focus:ring-1 focus:ring-crimson/50 text-sm font-mono text-white transition-all cursor-pointer shadow-inner"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  activeDatasetOpt.taskType === 'Classification' ? 'bg-emerald-400' : 'bg-crimson'
                }`} />
                <span className="font-semibold text-sm">{activeDatasetOpt.label}</span>
              </div>
              <ChevronDown
                size={16}
                className={`text-white/60 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180 text-crimson' : ''
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full mt-1.5 left-0 right-0 z-30 rounded-xl bg-[#060205]/95 border border-white/[0.15] shadow-[0_15px_35px_rgba(0,0,0,0.9)] backdrop-blur-xl py-1 overflow-hidden max-h-72 overflow-y-auto">
                {DATASET_OPTIONS.map((opt) => {
                  const isSelected = activeDatasetOpt.id.toLowerCase() === opt.id.toLowerCase()
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (onDatasetChange) onDatasetChange(opt.id)
                        setDropdownOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-mono transition-colors text-left cursor-pointer ${
                        isSelected
                          ? 'bg-crimson/20 text-white font-bold'
                          : 'text-text-secondary hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{opt.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                          opt.taskType === 'Classification'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-crimson/15 text-crimson border-crimson/30'
                        }`}>
                          {opt.taskType}
                        </span>
                      </div>
                      {isSelected && <Check size={15} className="text-crimson" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2. Few-Shot Configuration Segmented Selector */}
        <div className="space-y-2">
          <label className="text-sm font-mono font-semibold text-white/90 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles size={15} className="text-crimson" />
              Few-Shot Configuration
            </span>
            <span className="text-xs font-mono text-crimson font-medium">
              {shotMode === '0 Shot' ? 'Foundation Zero-Shot' : `${shotMode} Prompt Bank`}
            </span>
          </label>

          <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-black/60 border border-white/[0.08]">
            {SHOT_OPTIONS.map((shot) => {
              const isSelected = shotMode === shot
              return (
                <button
                  key={shot}
                  type="button"
                  onClick={() => onShotModeChange && onShotModeChange(shot)}
                  className={`relative py-2.5 rounded-lg text-sm font-mono font-bold transition-colors cursor-pointer ${
                    isSelected ? 'text-white' : 'text-text-secondary hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="analysisConfigShotPill"
                      className="absolute inset-0 rounded-lg bg-crimson shadow-[0_0_15px_rgba(255,42,85,0.45)] border border-crimson"
                      transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                    />
                  )}
                  <span className="relative z-10">{shot}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Model Selector (Provider/Model-Agnostic) */}
        <div className="space-y-2">
          <label className="text-sm font-mono font-semibold text-white/90 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu size={15} className="text-crimson" />
              Model Architecture
            </span>
            <span className="text-xs font-mono text-crimson font-bold">INDEPENDENT INFERENCE</span>
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-black/60 border border-white/[0.1] hover:border-crimson/40 focus:outline-none focus:ring-1 focus:ring-crimson/50 text-sm font-mono text-white transition-all cursor-pointer shadow-inner"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#FFFFFF] shrink-0" />
                <span className="font-semibold truncate text-sm">
                  {MODEL_OPTIONS.find((m) => m.id === model)?.label || model}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-white/60 shrink-0 transition-transform duration-200 ${
                  modelDropdownOpen ? 'rotate-180 text-crimson' : ''
                }`}
              />
            </button>

            {modelDropdownOpen && (
              <div className="absolute top-full mt-1.5 left-0 right-0 z-30 rounded-xl bg-[#060205]/95 border border-white/[0.15] shadow-[0_15px_35px_rgba(0,0,0,0.9)] backdrop-blur-xl py-1 overflow-hidden">
                {MODEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (onModelChange) onModelChange(opt.id)
                      setModelDropdownOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-mono transition-colors text-left cursor-pointer ${
                      model === opt.id
                        ? 'bg-crimson/20 text-white font-bold'
                        : 'text-text-secondary hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.08] text-white/90 border border-white/10 shrink-0 font-semibold">
                      {opt.badge}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Detection Mode & Explanation */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5">
          <div className="flex items-center gap-2">
            <Layers size={15} className="text-crimson" />
            <span className="text-sm font-heading font-bold text-white tracking-wide">
              Hybrid Detection
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
            Object proposals + Vision-Language classification
          </p>
        </div>

        {/* 8. Configuration Metadata Display */}
        <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.06] flex items-center justify-between text-sm font-mono">
          <span className="text-text-muted">Dataset</span>
          <span className="text-white font-semibold">{dataset}</span>
        </div>
      </div>

      {/* 5. Primary Action: Run Analysis */}
      <div className="pt-6 mt-6 border-t border-white/[0.06] space-y-3">
        <Button
          variant="primary"
          size="lg"
          className={`w-full justify-center text-base font-heading font-bold tracking-wide transition-all ${
            isReady && !isRunning
              ? 'shadow-[0_4px_25px_rgba(255,42,85,0.35)] hover:shadow-[0_6px_35px_rgba(255,42,85,0.55)] cursor-pointer'
              : 'opacity-40 cursor-not-allowed'
          }`}
          iconRight={isRunning ? null : Play}
          disabled={!isReady || isRunning}
          onClick={handleRunClick}
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Running Analysis...
            </span>
          ) : 'Run Analysis'}
        </Button>

        {!isReady && (
          <p className="text-xs font-mono text-text-muted text-center">
            Mount or upload a microscopy image to enable analysis
          </p>
        )}
      </div>
    </GlassCard>
  )
}
