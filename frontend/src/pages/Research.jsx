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
  Sparkles,
  Lightbulb,
} from 'lucide-react'

import ResearchHero from '@/components/research/ResearchHero'
import ResearchQuestion from '@/components/research/ResearchQuestion'
import ResearchApproach from '@/components/research/ResearchApproach'
import HybridVision from '@/components/research/HybridVision'
import FewShotConcept from '@/components/research/FewShotConcept'
import ResearchCTA from '@/components/research/ResearchCTA'
import ResearchStatus from '@/components/research/ResearchStatus'
import AppSidebar from '@/components/navigation/AppSidebar'
import GlobalFooter from '@/components/ui/GlobalFooter'
import ResearchSubnav from '@/components/research/ResearchSubnav'

export default function Research() {
  const location = useLocation()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)



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
        statusText="RESEARCH REPOSITORY ACTIVE"
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
              <Link to="/dashboard" className="text-text-muted hover:text-white transition-colors">
                JeevaDrishti
              </Link>
              <ChevronRight size={13} className="text-white/20" />
              <span className="text-white font-semibold">Research</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.08] text-[11px] font-mono text-text-secondary">
              <Shield size={12} className="text-crimson" />
              <span>Foundation Research</span>
            </div>
          </div>
        </header>

        {/* Research Hub Body Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-9">
          {/* ─── 1. PAGE HEADER ────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/[0.06]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-crimson/15 border border-crimson/30 flex items-center justify-center text-crimson">
                  <BookOpen size={16} />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-crimson/15 border border-crimson/30 text-[10px] font-mono font-bold text-crimson">
                  <Sparkles size={11} />
                  <span>RESEARCH HUB</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-white">
                Research
              </h1>

              <p className="text-xs sm:text-sm text-text-secondary max-w-2xl font-sans">
                Exploring vision-language intelligence for adaptive cell detection in optical microscopy.
              </p>
            </div>

            {/* Scientific Indicator */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
              <FlaskConical size={14} className="text-crimson" />
              <span>AI Microscopy Research Laboratory</span>
            </div>
          </div>

          {/* Research Area Navigation */}
          <ResearchSubnav />

          {/* ─── 2. RESEARCH HERO ──────────────────────────────────────── */}
          <ResearchHero />

          {/* ─── 3. RESEARCH QUESTION ──────────────────────────────────── */}
          <ResearchQuestion />

          {/* ─── 4. RESEARCH APPROACH (6 Stages) ───────────────────────── */}
          <ResearchApproach />

          {/* ─── 5. HYBRID VISION CONCEPT ──────────────────────────────── */}
          <HybridVision />

          {/* ─── 6. FEW-SHOT PROGRESSION CONCEPT ───────────────────────── */}
          <FewShotConcept />

          {/* ─── 7 & 8. BENCHMARK & DATASET CTAS ───────────────────────── */}
          <ResearchCTA />

          {/* ─── 9. RESEARCH ENVIRONMENT STATUS ────────────────────────── */}
          <ResearchStatus />

          {/* Platform Footer */}
          <GlobalFooter className="mt-20" />
        </main>
      </div>
    </div>
  )
}
