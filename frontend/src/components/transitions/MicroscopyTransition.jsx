import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Microscope, CheckCircle2 } from 'lucide-react'

const TELEMETRY_STEPS = [
  'CONNECTING VISION ENGINE',
  'LOADING MICROSCOPY MODULE',
  'CALIBRATING VISUAL FIELD',
  'INITIALIZING ANALYSIS ENGINE',
  'SYSTEM READY',
]

/**
 * MicroscopyTransition — Signature Authentication Transition
 *
 * Connects the Abstract AI World to the Real Microscopy World:
 * 1. User clicks: ENTER LABORATORY →
 * 2. Authentication panel freezes & fades away.
 * 3. Screen becomes dark (#060205 deep obsidian).
 * 4. Show:
 *      JEEVADRISHTI CORE
 *      INITIALIZING...
 * 5. Then sequential telemetry:
 *      CONNECTING VISION ENGINE
 *      LOADING MICROSCOPY MODULE
 *      CALIBRATING VISUAL FIELD
 *      INITIALIZING ANALYSIS ENGINE
 *      SYSTEM READY
 * 6. Abstract 3D VisionCore fades away with scale & blur dissipation.
 * 7. A REAL 2D MICROSCOPY IMAGE appears through an optical circular diaphragm (clip-path).
 * 8. Slowly zoom into the 2D microscopy image (scale 1.0 -> 1.25) with optical focus resolution.
 * 9. Add a subtle laser scanning line sweeping down across the visual field.
 * 10. Show:
 *      VISUAL FIELD CALIBRATED
 * 11. Seamless handoff into /dashboard.
 *
 * Strict Color Theme:
 * Background: #060205 | Crimson: #FF2A55 | Ruby: #DC2626 | White: #FFFFFF
 */
export default function MicroscopyTransition({
  active = false,
  isActive = false,
  onComplete,
}) {
  const isTriggered = Boolean(active || isActive)

  // Stage timeline:
  // 0: Idle / hidden
  // 1: Dark curtain falls, "JEEVADRISHTI CORE" + "INITIALIZING..." + 3D VisionCore
  // 2: Console telemetry lines appear sequentially
  // 3: Abstract 3D VisionCore fades out with blur/scale expansion
  // 4: Diaphragm iris opens (clip-path) -> REAL 2D MICROSCOPY IMAGE appears & zooms
  // 5: "VISUAL FIELD CALIBRATED" HUD badge illuminates
  // 6: Final iris transition into /dashboard
  const [stage, setStage] = useState(0)
  const [telemetryIndex, setTelemetryIndex] = useState(0)

  useEffect(() => {
    if (!isTriggered) {
      setStage(0)
      setTelemetryIndex(0)
      return
    }

    // t = 0ms: Dark curtain drops, stage 1 begins
    setStage(1)

    // t = 220ms: Telemetry terminal sequence starts cascading
    const tTelemetry = setTimeout(() => {
      setStage(2)
      let count = 0
      const stepInterval = setInterval(() => {
        count += 1
        setTelemetryIndex(count)
        if (count >= TELEMETRY_STEPS.length) {
          clearInterval(stepInterval)
        }
      }, 130)
    }, 220)

    // t = 1050ms: Abstract 3D VisionCore begins fading out with blur & scale
    const tCoreFade = setTimeout(() => {
      setStage(3)
    }, 1050)

    // t = 1250ms: Diaphragm opens, Real 2D Microscopy Image appears & begins optical zoom
    const tMicroscopy = setTimeout(() => {
      setStage(4)
    }, 1250)

    // t = 2050ms: "VISUAL FIELD CALIBRATED" badge locks in
    const tCalibrated = setTimeout(() => {
      setStage(5)
    }, 2050)

    // t = 2750ms: Complete transition -> navigate to /dashboard
    const tComplete = setTimeout(() => {
      setStage(6)
      if (onComplete) onComplete()
    }, 2750)

    return () => {
      clearTimeout(tTelemetry)
      clearTimeout(tCoreFade)
      clearTimeout(tMicroscopy)
      clearTimeout(tCalibrated)
      clearTimeout(tComplete)
    }
  }, [isTriggered, onComplete])

  if (!isTriggered && stage === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        key="microscopy-transition-curtain"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#060205] overflow-hidden select-none"
      >
        {/* Ambient Darkfield Vignette & Crimson Core Aura */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[700px] h-[700px] rounded-full bg-crimson/10 blur-[160px] pointer-events-none" />
        </div>

        {/* ─── SECTION 1: Abstract AI World (Stages 1, 2, 3) ────────────────── */}
        <AnimatePresence>
          {stage >= 1 && stage <= 3 && (
            <motion.div
              key="abstract-vision-core-stage"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{
                opacity: stage === 3 ? 0 : 1,
                scale: stage === 3 ? 1.12 : 1,
                filter: stage === 3 ? 'blur(16px)' : 'blur(0px)',
              }}
              exit={{ opacity: 0, scale: 1.15, filter: 'blur(20px)' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full"
            >
              {/* Abstract 3D VisionCore Gyroscopic Ring Matrix */}
              <div className="relative w-36 h-36 mb-6 flex items-center justify-center">
                {/* Ring 1: Primary Crimson Gyro with 3D tilt */}
                <motion.div
                  animate={{ rotateZ: 360, rotateX: [0, 45, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border border-crimson/45 border-dashed shadow-[0_0_20px_rgba(255,42,85,0.35)]"
                  style={{ perspective: 800 }}
                />

                {/* Ring 2: White Optical Precision Ring */}
                <motion.div
                  animate={{ rotateZ: -360, rotateY: [0, -50, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-2.5 rounded-full border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  style={{ perspective: 800 }}
                />

                {/* Ring 3: Fast Inner Targeting Reticle */}
                <motion.div
                  animate={{ rotateZ: 180, scale: [0.96, 1.04, 0.96] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-6 rounded-full border border-crimson/70 flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#FFFFFF]" />
                </motion.div>

                {/* Central AI Singularity Node */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-ruby via-crimson to-white flex items-center justify-center shadow-[0_0_30px_rgba(255,42,85,0.85)]"
                >
                  <Microscope size={16} className="text-white drop-shadow" />
                </motion.div>

                {/* Reticle Axis Lines */}
                <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-crimson/60 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 w-[1px] bg-gradient-to-b from-transparent via-crimson/60 to-transparent pointer-events-none" />
              </div>

              {/* Eyebrow Identity */}
              <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.12] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
                <span className="text-[11px] font-mono tracking-[0.25em] text-white/90 font-semibold uppercase">
                  JEEVADRISHTI CORE
                </span>
              </div>

              {/* Main Headline */}
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-wider mb-5 uppercase">
                INITIALIZING...
              </h2>

              {/* Sequential Telemetry Terminal */}
              <div className="w-full space-y-2 text-left bg-black/75 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/[0.09] font-mono text-xs shadow-[0_15px_40px_rgba(0,0,0,0.9)]">
                {TELEMETRY_STEPS.map((step, idx) => {
                  const isVisible = idx < telemetryIndex
                  const isReady = idx === TELEMETRY_STEPS.length - 1 && isVisible

                  return (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: isVisible ? 1 : 0.12, x: isVisible ? 0 : -6 }}
                      transition={{ duration: 0.14 }}
                      className={`flex items-center justify-between py-0.5 tracking-wide ${
                        isReady
                          ? 'text-white font-bold'
                          : isVisible
                          ? 'text-crimson font-medium'
                          : 'text-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                            isReady
                              ? 'bg-white shadow-[0_0_8px_#FFFFFF] scale-125'
                              : isVisible
                              ? 'bg-crimson shadow-[0_0_8px_#FF2A55]'
                              : 'bg-white/20'
                          }`}
                        />
                        <span className="text-[11px] sm:text-xs">{step}</span>
                      </div>
                      {isVisible && (
                        <span
                          className={`text-[10px] font-semibold tracking-wider ${
                            isReady ? 'text-white' : 'text-crimson/80'
                          }`}
                        >
                          {isReady ? 'READY' : 'OK'}
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── SECTION 2: Real 2D Microscopy World (Stages 4, 5, 6) ─────────── */}
        <AnimatePresence>
          {stage >= 4 && (
            <motion.div
              key="real-microscopy-world-stage"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              {/* Optical Circular Diaphragm Aperture with Clip-Path Iris */}
              <motion.div
                initial={{
                  clipPath: 'circle(0% at 50% 50%)',
                  boxShadow: '0 0 0px rgba(255,42,85,0)',
                }}
                animate={{
                  clipPath: 'circle(50% at 50% 50%)',
                  boxShadow: '0 0 100px rgba(255,42,85,0.3)',
                }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] md:w-[560px] md:h-[560px] rounded-full overflow-hidden border-2 border-white/25 ring-1 ring-crimson/40"
              >
                {/* 
                  The REAL 2D Microscopy Image
                  - Strictly 2D optical cellular specimen
                  - Slow, cinematic optical zoom (scale: 1.0 -> 1.25)
                  - Optical focus pull (soft blur -> razor-sharp clarity)
                */}
                <motion.img
                  src="/samples/microscopy_cell_sample.jpg"
                  alt="2D Optical Microscopy Specimen"
                  initial={{ scale: 1.0, filter: 'blur(7px)' }}
                  animate={{ scale: 1.25, filter: 'blur(0px)' }}
                  transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }}
                  className="w-full h-full object-cover select-none"
                />

                {/* Authentic Circular Lens Vignette Mask */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle, transparent 48%, rgba(6, 2, 5, 0.65) 80%, #060205 100%)',
                  }}
                />

                {/* Optical Reticle Crosshairs & Coordinate Scales */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-crimson to-transparent" />
                  <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-crimson to-transparent" />
                  <div className="absolute w-36 h-36 rounded-full border border-crimson/50 border-dashed" />
                  <div className="absolute w-64 h-64 rounded-full border border-white/20" />
                </div>

                {/* Lens Coordinate Micro-Ticks */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/60 tracking-widest pointer-events-none">
                  +120μm
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/60 tracking-widest pointer-events-none">
                  -120μm
                </div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/60 tracking-widest pointer-events-none">
                  -120μm
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/60 tracking-widest pointer-events-none">
                  +120μm
                </div>

                {/* Subtle Crimson Laser Scanning Line Sweep */}
                <motion.div
                  initial={{ y: '-100%' }}
                  animate={{ y: '260%' }}
                  transition={{ duration: 1.25, ease: 'easeInOut' }}
                  className="absolute inset-x-0 h-24 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent 0%, rgba(255, 42, 85, 0.15) 60%, rgba(255, 42, 85, 0.9) 92%, #FFFFFF 96%, transparent 100%)',
                  }}
                />

                {/* Lens Outer Rim Bevel Highlight */}
                <div className="absolute inset-0 rounded-full border border-crimson/30 pointer-events-none" />
              </motion.div>

              {/* Bottom HUD: VISUAL FIELD CALIBRATED Badge */}
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.92 }}
                animate={{
                  opacity: stage >= 5 ? 1 : 0,
                  y: stage >= 5 ? 0 : 16,
                  scale: stage >= 5 ? 1 : 0.92,
                }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-8 sm:bottom-12 z-20 flex flex-col items-center gap-2"
              >
                <div className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-black/90 backdrop-blur-xl border border-crimson/60 text-white shadow-[0_0_35px_rgba(255,42,85,0.45)]">
                  <CheckCircle2 size={17} className="text-crimson animate-pulse" />
                  <span className="text-xs sm:text-sm font-mono font-extrabold tracking-wider uppercase text-white">
                    VISUAL FIELD CALIBRATED
                  </span>
                </div>
                <span className="text-[10px] font-mono text-white/70 tracking-widest">
                  OPTICAL OBJECTIVE: 40X // SUB-PIXEL FIELD LOCKED
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
