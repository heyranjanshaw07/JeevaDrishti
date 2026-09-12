import { memo } from 'react'
import { motion } from 'framer-motion'
import { Scan, ShieldCheck, Cpu, Activity, Eye, Zap } from 'lucide-react'

/**
 * MicroscopyHUD — Subtle Scientific Overlay & Cell Targeting Reticles
 * Exclusively decorative interface elements for the authentication environment.
 */
function MicroscopyHUD() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden font-mono">
      {/* ─── Top Header: Microscopy Field & Telemetry ────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-crimson animate-pulse shadow-[0_0_8px_#FF2A55]" />
            <span className="text-xs font-bold tracking-widest text-text-primary uppercase">
              MICROSCOPY FIELD
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-crimson/10 text-crimson border border-crimson/25">
              LIVE ANALYSIS
            </span>
          </div>
          <span className="text-[10px] text-text-muted tracking-wider">
            OPTICAL CHANNEL 488nm // CONDENSER NA 1.40
          </span>
        </div>

        {/* Reticle coordinate marker */}
        <div className="text-right text-[10px] text-text-muted hidden sm:block">
          <div>FOV: 240 μm × 180 μm</div>
          <div className="text-crimson/70">MAG: 40X HIGH-DR</div>
        </div>
      </div>

      {/* ─── Central Dynamic Cell Reticles (Decorative Tracking Targets) ─── */}
      <div className="relative w-full h-full my-auto flex items-center justify-center">
        {/* Reticle 1: Targeting Midground RBC */}
        <div className="absolute top-[28%] left-[22%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-start gap-1">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-crimson/40 border-dashed animate-spin-slow">
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-crimson" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-crimson" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-crimson" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-crimson" />
          </div>
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-crimson/30 shadow-[0_0_10px_rgba(255,42,85,0.2)]">
            <span className="text-[10px] font-bold text-crimson">RBC</span>
            <span className="text-[10px] text-text-primary font-semibold">0.92</span>
            <span className="text-[9px] text-text-muted">8.2 μm</span>
          </div>
        </div>

        {/* Reticle 2: Targeting Midground WBC with Internal Chromatin */}
        <div className="absolute bottom-[30%] left-[64%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-start gap-1">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.15)]">
            <div className="absolute inset-2 rounded-full border border-white/30 border-dotted" />
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/40" />
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/40" />
          </div>
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/40 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            <span className="text-[10px] font-bold text-white">WBC</span>
            <span className="text-[10px] text-text-primary font-semibold">0.97</span>
            <span className="text-[9px] text-text-muted">12.5 μm</span>
          </div>
        </div>

        {/* Reticle 3: Targeting Platelet Cluster */}
        <div className="absolute top-[68%] left-[28%] -translate-x-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2">
          <div className="w-7 h-7 rounded border border-ice/40 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-ice" />
          </div>
          <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-ice/30 text-[9px]">
            <span className="text-ice font-bold">PLT</span> <span className="text-text-primary">0.89</span> <span className="text-text-muted">2.4 μm</span>
          </div>
        </div>

        {/* Very Subtle Vertical Scanning Line Sweep */}
        <motion.div
          initial={{ y: '-120%' }}
          animate={{ y: '240%' }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-x-0 h-28 pointer-events-none opacity-40"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(255, 42, 85, 0.08) 50%, rgba(255, 42, 85, 0.25) 98%, transparent)',
          }}
        />

        {/* Scale Bar (10 μm) */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2 text-[10px] text-text-muted bg-black/40 px-2.5 py-1 rounded-lg border border-white/[0.06]">
          <div className="w-10 h-[2px] bg-crimson/80 relative">
            <div className="absolute -top-1 left-0 w-[1px] h-3 bg-crimson/80" />
            <div className="absolute -top-1 right-0 w-[1px] h-3 bg-crimson/80" />
          </div>
          <span>10 μm</span>
        </div>
      </div>

      {/* ─── Bottom Scientific Interface Metadata ────────────────────────── */}
      <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        {/* Left Side Metadata Panel */}
        <div className="space-y-1.5 max-w-sm">
          <div className="text-[11px] font-bold text-text-primary tracking-widest uppercase flex items-center gap-2">
            <span>JEEVADRISHTI CORE</span>
            <span className="text-[9px] font-normal text-crimson px-1.5 py-0.2 rounded bg-crimson/10">v1.0-VLM</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#FFFFFF]" />
              SYSTEM ONLINE
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
              VISION ENGINE READY
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFA0B4]" />
              SECURE CONNECTION
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-text-muted">
            <span>0 / 1 / 3 / 6-SHOT READY</span>
            <span>•</span>
            <span>4 SUPPORTED DATASETS</span>
            <span>•</span>
            <span className="text-crimson">AI + VLM // HYBRID DETECTION</span>
          </div>
        </div>

        {/* Decorative Disclaimer */}
        <div className="text-[9px] text-text-muted text-right opacity-70">
          * DECORATIVE VISUAL FIELD // NOT MODEL PREDICTIONS
        </div>
      </div>
    </div>
  )
}

export default memo(MicroscopyHUD)
