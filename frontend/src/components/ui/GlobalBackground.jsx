import { memo } from 'react'
import { useLocation } from 'react-router-dom'
import AbstractScene from '@/components/3d/AbstractScene'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

/**
 * GlobalBackground — JeevaDrishti Hematology Ambient System
 * 
 * 1. Deep Void Hematology Base (#060205)
 * 2. Subtle precision scientific grid
 * 3. Soft Crimson atmospheric glow (#FF2A55)
 * 4. Deep Ruby atmospheric glow (#DC2626)
 * 5. Interactive 3D Cell Swarm Layer
 */
function GlobalBackground({ children }) {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'
  return (
    <div className="relative min-h-screen w-full bg-lab-void text-text-primary overflow-x-hidden">
      {/* ─── Layer 1: Deep Hematology Darkfield Base ───────────────────── */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 100% 80% at 50% 0%, #160510 0%, #0D0309 45%, #060205 100%)',
        }}
      />

      {/* ─── Layer 2: Subtle Scientific Precision Grid ─────────────────── */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 30%, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 30%, black 40%, transparent 90%)',
        }}
      />

      {/* ─── Layer 3: Soft Crimson Atmospheric Glow ─────────────────────── */}
      <div 
        className="fixed -top-[20%] left-[10%] pointer-events-none z-0 rounded-full blur-[140px] opacity-25 animate-pulse-slow"
        style={{
          width: '750px',
          height: '650px',
          background: 'radial-gradient(circle, rgba(255, 42, 85, 0.2) 0%, transparent 70%)',
        }}
      />

      {/* ─── Layer 4: Soft Pure White Atmospheric Specular Glow ─────────── */}
      <div 
        className="fixed top-[35%] -right-[10%] pointer-events-none z-0 rounded-full blur-[160px] opacity-15"
        style={{
          width: '650px',
          height: '650px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, transparent 70%)',
        }}
      />

      {/* ─── Layer 5: Ambient 3D Cell Swarm Canvas Layer ───────────────────── */}
      {!isAuthPage && (
        <div 
          id="canvas-3d-background-layer"
          className="fixed inset-0 pointer-events-none z-0 opacity-95"
        >
          <ErrorBoundary silent>
            <AbstractScene />
          </ErrorBoundary>
        </div>
      )}

      {/* ─── Foreground Content Layer ─────────────────────────────────── */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  )
}

export default memo(GlobalBackground)
