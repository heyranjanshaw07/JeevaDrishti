import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Microscope, ArrowRight, Sparkles, Layers, Cpu,
  Brain, ShieldCheck, Activity, BarChart3, Database,
  Eye, CheckCircle2, ChevronRight, Terminal, BookOpen,
  Zap, Scan, Compass, FlaskConical, ExternalLink
} from 'lucide-react'

import LandingNavbar from '@/components/ui/LandingNavbar'
import GlobalFooter from '@/components/ui/GlobalFooter'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import { useAppStore } from '@/store/appStore'
import { MOCK_DATASETS, MOCK_BENCHMARK_DATA } from '@/services/api'
import { fadeInUpVariants, staggerContainerVariants } from '@/components/transitions/motionVariants'

// ─── Metric Strip Data (Structured for direct API replacement) ────────────────
const METRIC_STRIP = [
  {
    id: 'mf1-6shot',
    label: 'mF1 @ 6-shot',
    value: '79.8%',
    detail: 'Clinical benchmark accuracy',
    subtext: 'Rivaling supervised models',
    highlight: true,
  },
  {
    id: 'map50',
    label: 'mAP@50',
    value: '76.4%',
    detail: 'Boundary proposal overlap',
    subtext: 'Cross-domain precision',
    highlight: false,
  },
  {
    id: 'inference',
    label: 'Inference',
    value: '850ms',
    detail: 'Zero-shot VLM reasoning',
    subtext: 'High-throughput stream',
    highlight: false,
  },
  {
    id: 'datasets',
    label: 'Datasets',
    value: '4 Benchmarks',
    detail: 'BCCD, BBBC, LIVECell, NIH-3T3',
    subtext: '1.7M+ annotated cells',
    highlight: false,
  },
]

// ─── Pipeline Stages ─────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  {
    step: '01',
    title: 'Optical Acquisition',
    subtitle: 'Stain Normalization',
    description: 'Raw microscopy streams (Brightfield, Fluorescence, Phase Contrast) are normalized for illumination drift and optical aberration.',
    icon: Eye,
    color: 'text-crimson',
    accent: 'border-crimson/30',
  },
  {
    step: '02',
    title: 'Foundation Proposal',
    subtitle: 'SAM Bio-Adapter',
    description: 'Sub-pixel zero-shot boundary candidates are computed at native optical resolution without requiring pre-trained biological labels.',
    icon: Scan,
    color: 'text-white',
    accent: 'border-white/30',
  },
  {
    step: '03',
    title: 'VLM Semantic Reasoning',
    subtitle: 'Biomedical Verification',
    description: 'A fine-tuned biomedical vision-language foundation model inspects organelle morphology, stain affinity, and chromatin condensation.',
    icon: Brain,
    color: 'text-[#FF4D73]',
    accent: 'border-crimson/30',
  },
  {
    step: '04',
    title: 'Calibrated Telemetry',
    subtitle: 'Phenotype Classification',
    description: 'Generates sub-cellular bounding boxes, confidence logits, automated cell counts, and exportable research analytics in real time.',
    icon: Activity,
    color: 'text-white',
    accent: 'border-white/30',
  },
]

// ─── Few-Shot Scaling Data ───────────────────────────────────────────────────
const SHOT_SCALING = [
  { shot: '0-shot', mF1: '41.2%', mAP: '38.9%', latency: '1,240ms', desc: 'Direct foundation semantic reasoning with zero visual exemplars' },
  { shot: '1-shot', mF1: '58.1%', mAP: '55.4%', latency: '980ms', desc: 'Rapid adaptation from a single annotated exemplar image' },
  { shot: '3-shot', mF1: '71.4%', mAP: '68.2%', latency: '1,100ms', desc: 'Optimal trade-off between exemplar setup and boundary sharpness' },
  { shot: '6-shot', mF1: '79.8%', mAP: '76.4%', latency: '1,380ms', desc: 'Comprehensive clinical calibration rivaling dedicated supervised models' },
]

export default function Landing() {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const { isAuthenticated } = useAppStore()
  const [selectedShot, setSelectedShot] = useState('6-shot')
  const [activePromptIndex, setActivePromptIndex] = useState(0)

  const samplePrompts = [
    'Identify all polymorphonuclear neutrophils with multi-lobed chromatin nuclei in BCCD blood smear.',
    'Segment adherent fibroblast cell membranes under brightfield illumination with high edge contrast.',
    'Detect fluorescent cell nuclei expressing DAPI stain and flag mitotic division pairs.',
  ]

  const handleStartAnalysis = (e) => {
    if (e) e.preventDefault()
    if (isAuthenticated) {
      navigate('/analyze')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen text-text-primary selection:bg-crimson/25 selection:text-crimson">
      {/* ─── Floating Glass Navbar ────────────────────────────────────────── */}
      <LandingNavbar />

      {/* ───────────────────────────────────────────────────────────────────────
          HERO SECTION (Centered Cinematic Layout with Smooth Optical Reticle)
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 sm:pt-48 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto overflow-hidden text-center flex flex-col items-center">
        {/* Background Rotating Optical Reticle Graphics */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[720px] h-[550px] sm:h-[720px] pointer-events-none -z-10 opacity-20">
          <motion.div
            animate={shouldReduceMotion ? {} : { rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full rounded-full border border-dashed border-crimson/40 relative flex items-center justify-center"
          >
            <div className="w-3/4 h-3/4 rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-1/2 h-1/2 rounded-full border border-crimson/30" />
            </div>
          </motion.div>
        </div>

        <motion.div
          className="flex flex-col items-center z-10 w-full"
          initial="initial"
          animate="animate"
          variants={staggerContainerVariants}
        >
          {/* Status Badge */}
          <motion.div variants={fadeInUpVariants} className="mb-6">
            <StatusBadge
              label="AI VISION ENGINE ONLINE"
              variant="crimson"
              pulse
              className="px-3.5 py-1.5 text-xs tracking-wider"
            />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            variants={fadeInUpVariants}
            className="text-5xl sm:text-7xl lg:text-8xl font-heading font-extrabold tracking-tight text-text-primary leading-[1.05] mb-5 drop-shadow-[0_4px_30px_rgba(255,42,85,0.25)]"
          >
            JeevaDrishti
          </motion.h1>

          {/* Main Tagline */}
          <motion.p
            variants={fadeInUpVariants}
            className="text-2xl sm:text-4xl lg:text-5xl font-heading font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FF6B8B] to-[#FF2A55] mb-6 leading-tight max-w-3xl"
          >
            Empowering Microscopy with <br className="hidden sm:inline" />
            Intelligent Vision
          </motion.p>

          {/* Description */}
          <motion.p
            variants={fadeInUpVariants}
            className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mb-10 mx-auto"
          >
            An adaptive vision-language framework for intelligent cell detection in optical microscopy — from zero-shot to few-shot, across diverse biological domains.
          </motion.p>

          {/* Action Buttons */}
          <motion.div variants={fadeInUpVariants} className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
            <button
              onClick={handleStartAnalysis}
              className="btn-primary px-8 py-3.5 rounded-xl font-medium text-sm sm:text-base flex items-center gap-2.5 cursor-pointer shadow-[0_4px_25px_rgba(255,42,85,0.4)] hover:shadow-[0_6px_35px_rgba(255,42,85,0.6)] active:scale-[0.98] transition-all"
            >
              <span>Start Analysis</span>
              <ArrowRight size={17} />
            </button>
            <a
              href="#features"
              className="btn-secondary px-7 py-3.5 rounded-xl font-medium text-sm sm:text-base flex items-center gap-2 hover:bg-white/[0.08] transition-all"
            >
              <Compass size={17} />
              <span>Explore Platform</span>
            </a>
          </motion.div>

          {/* Laboratory Sub-label Telemetry */}
          <motion.div variants={fadeInUpVariants} className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-12 pt-6 border-t border-white/[0.08] w-full max-w-lg text-xs font-mono text-text-muted">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-crimson shadow-[0_0_8px_#FF2A55] animate-pulse" />
              <span className="text-white font-medium">HYBRID SAM + VLM</span>
            </div>
            <span className="text-white/20">|</span>
            <div>
              <span>0-SHOT TO 6-SHOT READY</span>
            </div>
            <span className="text-white/20">|</span>
            <div>
              <span>v1.0.0-ALPHA</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          METRICS STRIP
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-4 mb-24 z-20">
        <GlassCard className="p-6 sm:p-8 border-white/[0.08]" glow>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
            {METRIC_STRIP.map((m, idx) => (
              <div key={m.id} className={`${idx !== 0 ? 'pt-4 sm:pt-0 sm:pl-8' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    {m.label}
                  </span>
                  {m.highlight && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-crimson/10 text-crimson border border-crimson/25">
                      LEADER
                    </span>
                  )}
                </div>
                <div className="text-3xl sm:text-4xl font-heading font-extrabold text-text-primary tracking-tight">
                  {m.value}
                </div>
                <div className="text-xs font-medium text-text-secondary mt-1">
                  {m.detail}
                </div>
                <div className="text-[11px] font-mono text-crimson/85 mt-0.5">
                  {m.subtext}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 1: INTELLIGENT MICROSCOPY
      ─────────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <StatusBadge label="ARCHITECTURAL FOUNDATION" variant="crimson" className="mb-4" />
          <h2 className="text-3xl sm:text-5xl font-heading font-bold tracking-tight text-text-primary mb-4">
            Intelligent Microscopy
          </h2>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            Bridging fundamental optical microscopy with foundation vision-language intelligence. Overcoming illumination shifts, stain variability, and morphological heterogeneity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <GlassCard className="p-8 border-white/[0.08]" hover>
            <div className="w-12 h-12 rounded-2xl bg-crimson/15 border border-crimson/35 flex items-center justify-center text-crimson mb-6 shadow-[0_0_20px_rgba(255,42,85,0.3)]">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-heading font-bold text-text-primary mb-2">
              Cross-Modality Invariance
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Uniform sub-cellular precision across Brightfield, Phase Contrast, and Fluorescence imaging lines without bespoke per-modality re-engineering.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-text-muted">Brightfield</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-text-muted">Fluorescence</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-text-muted">Phase Contrast</span>
            </div>
          </GlassCard>

          {/* Card 2 */}
          <GlassCard className="p-8 border-white/[0.08]" hover glow>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/20 flex items-center justify-center text-white mb-6 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <Brain size={24} />
            </div>
            <h3 className="text-xl font-heading font-bold text-text-primary mb-2">
              Semantic Bio-Reasoning
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Foundation vision-language models interpret sub-cellular organelles, chromatin density, and cellular morphology using scientific natural language prompts.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.08] text-white">Prompt Guided</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-text-muted">VLM Alignment</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-text-muted">Zero Hallucination</span>
            </div>
          </GlassCard>

          {/* Card 3 */}
          <GlassCard className="p-8 border-white/[0.08]" hover>
            <div className="w-12 h-12 rounded-2xl bg-ice/10 border border-ice/30 flex items-center justify-center text-ice mb-6 shadow-[0_0_20px_rgba(224,242,254,0.15)]">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-heading font-bold text-text-primary mb-2">
              Clinical-Grade Sub-Pixel SAM
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Integrated Segment Anything Model (SAM) biological adapter proposing pixel-tight boundary contours around overlapping and clustered cells.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-text-muted">Sub-pixel Masks</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-text-muted">Overlap Handling</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-text-muted">mAP@50: 76.4%</span>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 2: ZERO-SHOT DETECTION
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-6">
            <StatusBadge label="ZERO MANUAL ANNOTATION" variant="crimson" className="mb-4" />
            <h2 className="text-3xl sm:text-5xl font-heading font-bold tracking-tight text-text-primary mb-6">
              Zero-Shot Detection
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-6">
              Identify unseen cellular phenotypes immediately upon optical ingestion. By grounding natural biological vocabulary into latent visual features, JeevaDrishti detects rare and novel cells without requiring thousands of human-labeled training exemplars.
            </p>
            <ul className="space-y-3.5 mb-8">
              {[
                'Instant inference on novel cytological and histology preparations',
                'Natural language semantic targeting of specific cellular features',
                'Automatic rejection of optical artifacts, dust, and slide scratches',
                'Seamless zero-shot deployment in resource-constrained clinical settings',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                  <CheckCircle2 size={16} className="text-crimson shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to={isAuthenticated ? "/analyze" : "/login"}>
              <Button variant="primary" iconRight={ArrowRight}>
                Try Zero-Shot Prompting
              </Button>
            </Link>
          </div>

          {/* Right Interactive Prompt Simulation Card */}
          <div className="lg:col-span-6">
            <GlassCard className="p-6 sm:p-8 border-white/[0.1]" glow>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
                <div className="flex items-center gap-2">
                  <Terminal size={16} className="text-crimson" />
                  <span className="text-xs font-mono text-text-muted uppercase">VLM Visual Prompt Simulator</span>
                </div>
                <StatusBadge label="ZERO-SHOT READY" variant="crimson" pulse={false} />
              </div>

              {/* Prompt selection buttons */}
              <div className="flex flex-col gap-2 mb-6">
                <span className="text-[11px] font-mono text-text-muted uppercase">Select Exemplar Prompt:</span>
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePromptIndex(idx)}
                    className={`text-left text-xs p-3 rounded-xl border transition-all ${
                      activePromptIndex === idx
                        ? 'bg-crimson/[0.1] border-crimson/40 text-crimson shadow-[0_0_15px_rgba(255,42,85,0.2)]'
                        : 'bg-white/[0.02] border-white/[0.06] text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    }`}
                  >
                    "{p}"
                  </button>
                ))}
              </div>

              {/* Simulation Result Preview */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-text-muted">INFERENCE PIPELINE:</span>
                  <span className="text-crimson">ZERO-SHOT VLM + SAM</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/[0.06]">
                  <div>
                    <span className="text-[10px] font-mono text-text-muted block">CONFIDENCE</span>
                    <span className="text-sm font-bold text-text-primary">82.4%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-text-muted block">PROPOSED CELLS</span>
                    <span className="text-sm font-bold text-crimson">34 detected</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-text-muted block">LATENCY</span>
                    <span className="text-sm font-bold text-white">740ms</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 3: FEW-SHOT ADAPTATION
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <StatusBadge label="RAPID EXEMPLAR CALIBRATION" variant="white" className="mb-4" />
          <h2 className="text-3xl sm:text-5xl font-heading font-bold tracking-tight text-text-primary mb-4">
            Few-Shot Adaptation
          </h2>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            Need heightened sub-cellular precision? Provide as few as 1, 3, or 6 visual prompt exemplars to adapt the foundation engine in milliseconds, achieving clinical accuracy without retraining.
          </p>
        </div>

        {/* Interactive Shot Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {SHOT_SCALING.map((item) => {
            const isSelected = selectedShot === item.shot
            return (
              <button
                key={item.shot}
                onClick={() => setSelectedShot(item.shot)}
                className={`p-5 rounded-2xl text-left border transition-all duration-300 ${
                  isSelected
                    ? 'bg-crimson/[0.12] border-crimson/50 shadow-[0_0_25px_rgba(255,42,85,0.25)] scale-[1.02]'
                    : 'glass-card border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-base font-mono font-bold ${isSelected ? 'text-crimson' : 'text-text-primary'}`}>
                    {item.shot}
                  </span>
                  {isSelected && <Sparkles size={14} className="text-crimson" />}
                </div>
                <div className="text-2xl font-heading font-extrabold text-text-primary tracking-tight">
                  {item.mF1} <span className="text-xs font-mono font-normal text-text-muted">mF1</span>
                </div>
                <div className="text-xs font-mono text-text-muted mt-1">
                  mAP: {item.mAP} // {item.latency}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Shot Detail Display */}
        {(() => {
          const activeConfig = SHOT_SCALING.find((s) => s.shot === selectedShot)
          return (
            <GlassCard className="p-8 border-white/[0.08]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-heading font-bold text-text-primary">
                      Calibration Mode: {activeConfig.shot}
                    </span>
                    <StatusBadge label="VERIFIED BENCHMARK" variant="emerald" pulse={false} />
                  </div>
                  <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
                    {activeConfig.desc}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-text-muted uppercase block">Mean F1 Score</span>
                    <span className="text-3xl font-heading font-extrabold text-crimson">{activeConfig.mF1}</span>
                  </div>
                  <div className="h-10 w-[1px] bg-white/[0.1]" />
                  <div className="text-left">
                    <span className="text-[10px] font-mono text-text-muted uppercase block">Inference Time</span>
                    <span className="text-3xl font-heading font-extrabold text-text-primary">{activeConfig.latency}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          )
        })()}
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 4: HYBRID VISION PIPELINE
      ─────────────────────────────────────────────────────────────────────── */}
      <section id="pipeline" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <StatusBadge label="END-TO-END WORKFLOW" variant="crimson" className="mb-4" />
          <h2 className="text-3xl sm:text-5xl font-heading font-bold tracking-tight text-text-primary mb-4">
            Hybrid Vision Pipeline
          </h2>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            How JeevaDrishti orchestrates sub-pixel foundation segmenters with biomedical language vision reasoning to output clinical-grade detections.
          </p>
        </div>

        {/* Pipeline Nodes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {PIPELINE_STAGES.map((st, idx) => {
            const SIcon = st.icon
            return (
              <GlassCard key={st.step} className="p-7 border-white/[0.08] relative group" hover>
                {/* Step number badge */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/[0.04] text-text-muted border border-white/[0.06]">
                    STAGE {st.step}
                  </span>
                  <div className={`p-2 rounded-xl bg-white/[0.02] border ${st.accent} ${st.color}`}>
                    <SIcon size={18} />
                  </div>
                </div>

                <h3 className="text-lg font-heading font-bold text-text-primary mb-1">
                  {st.title}
                </h3>
                <p className="text-xs font-mono text-crimson mb-3">
                  {st.subtitle}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {st.description}
                </p>
              </GlassCard>
            )
          })}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 5: RESEARCH BENCHMARK
      ─────────────────────────────────────────────────────────────────────── */}
      <section id="benchmark" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <StatusBadge label="EMPIRICAL VALIDATION" variant="crimson" className="mb-4" />
          <h2 className="text-3xl sm:text-5xl font-heading font-bold tracking-tight text-text-primary mb-4">
            Research Benchmark
          </h2>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            Rigorous evaluation against gold-standard microscopy datasets. Tracking mF1 precision, recall, and detection accuracy across increasing exemplar shots.
          </p>
        </div>

        <GlassCard className="p-6 sm:p-10 border-white/[0.08]" glow>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08] mb-6">
            <div>
              <h3 className="text-xl font-heading font-bold text-text-primary">
                Multi-Dataset Performance Across Shots
              </h3>
              <p className="text-xs font-mono text-text-muted mt-1">
                METRICS: mF1 (Macro F1 Score) // EVALUATION PROTOCOL: ZERO-SHOT TO 6-SHOT
              </p>
            </div>
            <Link to="/benchmark">
              <Button variant="secondary" size="sm" iconRight={ArrowRight}>
                Full Benchmark Suite
              </Button>
            </Link>
          </div>

          {/* Dataset Benchmark Rows */}
          <div className="space-y-6">
            {Object.entries(MOCK_BENCHMARK_DATA.per_dataset).map(([datasetName, shotValues]) => (
              <div key={datasetName} className="p-4 rounded-xl bg-black/40 border border-white/[0.05]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-heading font-bold text-base text-text-primary">{datasetName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crimson/10 text-crimson border border-crimson/25">
                      Top mF1: {(shotValues['6-shot'] * 100).toFixed(0)}%
                    </span>
                  </div>
                  <span className="text-xs font-mono text-text-muted">6-shot Target</span>
                </div>

                {/* Progress bar visualizer */}
                <div className="grid grid-cols-4 gap-2">
                  {['0-shot', '1-shot', '3-shot', '6-shot'].map((s) => {
                    const score = shotValues[s]
                    const pct = Math.round(score * 100)
                    return (
                      <div key={s} className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-mono text-text-muted">
                          <span>{s}</span>
                          <span className="text-text-primary font-semibold">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-crimson via-[#FF4D73] to-white transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 6: SUPPORTED DATASETS
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <StatusBadge label="CORPUS ARCHITECTURE" variant="crimson" className="mb-4" />
          <h2 className="text-3xl sm:text-5xl font-heading font-bold tracking-tight text-text-primary mb-4">
            Supported Datasets
          </h2>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            Standard clinical and biomedical benchmark corpora verified with sub-cellular ground truth annotations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_DATASETS.map((ds) => (
            <GlassCard key={ds.id} className="p-7 border-white/[0.08]" hover>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-heading font-bold text-text-primary">{ds.name}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-crimson border border-white/[0.08]">
                      {ds.domain || ds.modality || 'Microscopy'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-text-muted">{ds.fullName || ds.full_name || ds.name}</p>
                </div>
                <Database size={20} className="text-text-muted shrink-0" />
              </div>

              <p className="text-xs text-text-secondary leading-relaxed mb-6">
                {ds.description}
              </p>

              {/* Data metrics */}
              <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-xl bg-black/40 border border-white/[0.06] text-center mb-4">
                <div>
                  <span className="text-[10px] font-mono text-text-muted block uppercase">Images</span>
                  <span className="text-xs font-bold text-text-primary">{ds.images ?? ds.total_images ?? 0}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-text-muted block uppercase">Classes</span>
                  <span className="text-xs font-bold text-crimson">{ds.classes ?? ds.classes_count ?? 0}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-text-muted block uppercase">Annotations</span>
                  <span className="text-xs font-bold text-white">{(ds.annotations ?? ds.test_boxes ?? 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {(ds.tags || [ds.modality, `${ds.classes_count || ds.classes || 3} Classes`].filter(Boolean)).map((t) => (
                  <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-text-muted">
                    #{t}
                  </span>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 7: RESEARCH QUESTION
      ─────────────────────────────────────────────────────────────────────── */}
      <section id="research" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <GlassCard className="p-8 sm:p-14 border-white/[0.1] relative overflow-hidden" glow>
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-crimson/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-ruby/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <StatusBadge label="PRIMARY SCIENTIFIC INQUIRY" variant="crimson" className="mb-6" />

            <h2 className="text-2xl sm:text-4xl font-heading font-bold text-text-primary leading-snug mb-6">
              "Can vision-language foundation models eliminate the need for costly manual biomedical annotation while maintaining clinical-grade sub-cellular precision?"
            </h2>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-2xl mx-auto mb-8">
              Microscopy labs spend thousands of hours tracing cell boundaries per diagnostic assay. JeevaDrishti demonstrates that combining zero-shot visual prompting with sub-pixel foundation segmenters achieves 79.8% mF1 with only 6 visual exemplars — cutting annotation overhead by over 90%.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6 border-t border-white/[0.08]">
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06]">
                <span className="text-[11px] font-mono text-crimson block uppercase font-semibold mb-1">01 // Domain Shift</span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Generalizes across differing microscopes, objective lenses, and camera sensors without fine-tuning.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06]">
                <span className="text-[11px] font-mono text-white block uppercase font-semibold mb-1">02 // Morphological Density</span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Accurately segments confluent cell monolayers and multi-layered high-density clusters.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06]">
                <span className="text-[11px] font-mono text-[#FF85A0] block uppercase font-semibold mb-1">03 // Rapid Calibration</span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  From zero-shot to 6-shot in sub-second inference runtime with zero GPU weight retraining.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 8: FINAL CTA
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="relative rounded-[32px] p-10 sm:p-16 glass-panel border-white/[0.12] overflow-hidden shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85)]">
          {/* Ambient Glow Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-crimson/20 to-transparent blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <StatusBadge label="ENTER THE FUTURE OF MICROSCOPY" variant="crimson" className="mb-6" />

            <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-text-primary tracking-tight mb-6">
              Empower Your Microscopy Research Today
            </h2>

            <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-8 max-w-xl mx-auto">
              Deploy adaptive vision foundation models for high-throughput cell counting, phenotype classification, and automated biological discovery.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                iconRight={ArrowRight}
                onClick={handleStartAnalysis}
              >
                Start Analysis Now
              </Button>
              <Link to="/benchmark">
                <Button variant="secondary" size="lg" icon={BarChart3}>
                  Explore Benchmarks
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Standard Global Footer ─── */}
      <GlobalFooter />
    </div>
  )
}
