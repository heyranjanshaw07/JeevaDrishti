import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ScanLine,
  GitFork,
  BarChart3,
  Database,
  BookOpen,
  FlaskConical,
  Microscope,
  Settings,
  Menu,
  X,
  ChevronRight,
  Shield,
  Layers,
  Lightbulb,
} from 'lucide-react'

import PipelineHero from '@/components/pipeline/PipelineHero'
import PipelineFlow from '@/components/pipeline/PipelineFlow'
import HybridArchitecture from '@/components/pipeline/HybridArchitecture'
import FewShotFlow from '@/components/pipeline/FewShotFlow'
import DataFlowSignal from '@/components/pipeline/DataFlowSignal'
import SystemArchitecture from '@/components/pipeline/SystemArchitecture'
import ResearchConnection from '@/components/pipeline/ResearchConnection'
import AppSidebar from '@/components/navigation/AppSidebar'
import GlobalFooter from '@/components/ui/GlobalFooter'

export default function Pipeline() {
  const location = useLocation()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)



  return (
    <div className="min-h-screen w-full bg-[#060205] text-[#FFFFFF] flex relative selection:bg-[#FF2A55]/30 selection:text-white overflow-x-hidden">
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
        <div className="absolute -top-40 right-10 w-[600px] h-[600px] bg-[#FF2A55]/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-10 left-60 w-[550px] h-[550px] bg-[#FF2A55]/[0.05] rounded-full blur-[180px]" />
      </div>

      {/* App Sidebar (Desktop + Mobile Drawer) */}
      <AppSidebar
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
        statusText="PIPELINE ARCHITECTURE"
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
            <div className="flex items-center gap-2 text-xs font-mono">
              <Link to="/dashboard" className="text-white/50 hover:text-white transition-colors">
                JeevaDrishti
              </Link>
              <ChevronRight size={13} className="text-white/20" />
              <span className="text-white font-semibold">Vision Pipeline</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.08] text-[11px] font-mono text-white/70">
              <Shield size={12} className="text-[#FF2A55]" />
              <span>Hybrid Vision-Language</span>
            </div>
          </div>
        </header>

        {/* Pipeline Page Body */}
        <main className="flex-1 space-y-4">
          {/* 1. HERO SECTION */}
          <PipelineHero />

          {/* 2. INTERACTIVE 6-STAGE PIPELINE FLOW */}
          <PipelineFlow />

          {/* 3. HYBRID ARCHITECTURE COMPARISON */}
          <HybridArchitecture />

          {/* 4. FEW-SHOT ADAPTATION */}
          <FewShotFlow />

          {/* 5. DATA FLOW SEQUENCE */}
          <DataFlowSignal />

          {/* 6. TECHNICAL SYSTEM ARCHITECTURE */}
          <SystemArchitecture />

          {/* 7. RESEARCH CONNECTION */}
          <ResearchConnection />

          {/* Platform Footer */}
          <GlobalFooter className="mt-20" />
        </main>
      </div>
    </div>
  )
}
