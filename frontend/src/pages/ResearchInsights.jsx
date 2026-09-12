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
  Lightbulb,
} from 'lucide-react'

import InsightsHero from '@/components/insights/InsightsHero'
import ResearchQuestion from '@/components/insights/ResearchQuestion'
import InsightCards from '@/components/insights/InsightCards'
import FewShotInsights from '@/components/insights/FewShotInsights'
import ResearchChallenges from '@/components/insights/ResearchChallenges'
import HybridInsight from '@/components/insights/HybridInsight'
import MicroODInsights from '@/components/insights/MicroODInsights'
import ResearchPipelineInsight from '@/components/insights/ResearchPipelineInsight'
import WhatSystemLearns from '@/components/insights/WhatSystemLearns'
import ResearchStatus from '@/components/insights/ResearchStatus'
import NavigationCTA from '@/components/insights/NavigationCTA'
import AppSidebar from '@/components/navigation/AppSidebar'
import GlobalFooter from '@/components/ui/GlobalFooter'
import ResearchSubnav from '@/components/research/ResearchSubnav'

export default function ResearchInsights() {
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
              <Link to="/dashboard" className="text-white/50 hover:text-white transition-colors">
                JeevaDrishti
              </Link>
              <ChevronRight size={13} className="text-white/20" />
              <Link to="/research" className="text-white/50 hover:text-white transition-colors">
                Research
              </Link>
              <ChevronRight size={13} className="text-white/20" />
              <span className="text-white font-semibold">Research Insights</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.08] text-[11px] font-mono text-white/70">
              <Shield size={12} className="text-[#FF2A55]" />
              <span>Theoretical Framework</span>
            </div>
          </div>
        </header>

        {/* Research Insights Main Body */}
        <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Research Area Navigation */}
          <ResearchSubnav />

          {/* 1. HERO */}
          <InsightsHero />

          {/* 2. CORE RESEARCH QUESTION */}
          <ResearchQuestion />

          {/* 3. FOUR INSIGHT CARDS */}
          <InsightCards />

          {/* 4. ZERO-SHOT -> FEW-SHOT VISUALIZATION */}
          <FewShotInsights />

          {/* 5. RESEARCH CHALLENGES */}
          <ResearchChallenges />

          {/* 6. HYBRID INSIGHT */}
          <HybridInsight />

          {/* 7. MICRO-OD BENCHMARK GROUNDING */}
          <MicroODInsights />

          {/* 8. RESEARCH PIPELINE INSIGHT */}
          <ResearchPipelineInsight />

          {/* 9. WHAT THE SYSTEM LEARNS */}
          <WhatSystemLearns />

          {/* 10. RESEARCH ENVIRONMENT STATUS */}
          <ResearchStatus />

          {/* 11. NAVIGATION CTA */}
          <NavigationCTA />

          {/* Platform Footer */}
          <GlobalFooter className="mt-20" />
        </main>
      </div>
    </div>
  )
}
