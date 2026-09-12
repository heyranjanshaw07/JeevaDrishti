import { Link } from 'react-router-dom'
import { Microscope, ArrowLeft } from 'lucide-react'
import AbstractScene from '@/components/3d/AbstractScene'

/**
 * AuthVisualSide — Left Split-Screen 3D Showcase & System Status
 * Strictly abstract AI Vision Core with live telemetry status badges.
 */
export default function AuthVisualSide({ subtitle = 'Intelligent Microscopy Workspace' }) {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 sm:p-12 overflow-hidden bg-gradient-to-b from-[#14050E] via-[#0A0307] to-[#060205]">
      {/* ─── Layer 1: Ambient Backdrop & Subtle Scientific Grid ────────── */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* ─── Layer 2: Biological 3D Cell Swarm Environment ─────────────── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <AbstractScene className="w-full h-full scale-105" />
      </div>

      {/* ─── Top Bar: Brand Identity & Back Link ───────────────────────── */}
      <div className="relative z-10 flex items-center justify-between pointer-events-auto">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-crimson/15 border border-crimson/35 flex items-center justify-center text-crimson shadow-[0_0_15px_rgba(255,42,85,0.3)] group-hover:shadow-[0_0_20px_rgba(255,42,85,0.5)] transition-all">
            <Microscope size={19} />
          </div>
          <div>
            <span className="text-base font-heading font-bold text-text-primary tracking-tight block group-hover:text-crimson transition-colors">
              JeevaDrishti
            </span>
            <span className="text-[10px] font-mono text-text-muted tracking-wider uppercase">
              {subtitle}
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={13} />
          <span>PORTAL</span>
        </Link>
      </div>

      {/* ─── Bottom Panel: Precision Telemetry System Status ──────────── */}
      <div className="relative z-10 p-6 rounded-2xl glass-panel border-white/[0.1] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.85)] max-w-md">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <span className="text-[11px] font-mono font-bold tracking-widest text-text-muted uppercase">
            JEEVADRISHTI CORE
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crimson/10 text-crimson border border-crimson/20">
            NODE #4092
          </span>
        </div>

        {/* The 3 Required Telemetry Statuses */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-[0_0_8px_#FFFFFF]" />
              </span>
              <span className="text-text-primary font-medium tracking-wide">SYSTEM ONLINE</span>
            </div>
            <span className="text-[11px] text-white font-semibold">100.0% UPTIME</span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-crimson" />
              </span>
              <span className="text-text-primary font-medium tracking-wide">VISION ENGINE READY</span>
            </div>
            <span className="text-[11px] text-crimson font-semibold">0/1/3/6-SHOT</span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span className="text-text-primary font-medium tracking-wide">SECURE NODE ACTIVE</span>
            </div>
            <span className="text-[11px] text-white/90 font-semibold">TLS 1.3 / E2E</span>
          </div>
        </div>
      </div>
    </div>
  )
}
