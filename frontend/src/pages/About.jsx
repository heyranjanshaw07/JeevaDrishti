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

import AboutHero from '@/components/about/AboutHero'
import AboutIntro from '@/components/about/AboutIntro'
import ResearchQuestion from '@/components/about/ResearchQuestion'
import CoreIdea from '@/components/about/CoreIdea'
import AboutPipeline from '@/components/about/AboutPipeline'
import ResearchFoundation from '@/components/about/ResearchFoundation'
import TechnologyStack from '@/components/about/TechnologyStack'
import ProjectStatus from '@/components/about/ProjectStatus'
import ResearchDirection from '@/components/about/ResearchDirection'
import Credits from '@/components/about/Credits'
import ResearchResources from '@/components/about/ResearchResources'
import AboutDisclaimer from '@/components/about/AboutDisclaimer'
import AboutCTA from '@/components/about/AboutCTA'
import AppSidebar from '@/components/navigation/AppSidebar'
import GlobalFooter from '@/components/ui/GlobalFooter'
import ResearchSubnav from '@/components/research/ResearchSubnav'

export default function About() {
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
        statusText="PRODUCT IDENTITY ONLINE"
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
              <span className="text-white font-semibold">About</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.08] text-[11px] font-mono text-white/70">
              <Shield size={12} className="text-[#FF2A55]" />
              <span>Research Initiative</span>
            </div>
          </div>
        </header>

        {/* About Main Body */}
        <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Research Area Navigation */}
          <ResearchSubnav />

          {/* 1. HERO */}
          <AboutHero />

          {/* 2. WHAT IS JEEVADRISHTI */}
          <AboutIntro />

          {/* 3. THE QUESTION */}
          <ResearchQuestion />

          {/* 4. THE CORE IDEA */}
          <CoreIdea />

          {/* 5. HOW IT WORKS PIPELINE */}
          <AboutPipeline />

          {/* 6. RESEARCH FOUNDATION (Micro-OD) */}
          <ResearchFoundation />

          {/* 7. TECHNOLOGY STACK */}
          <TechnologyStack />

          {/* 8. PROJECT STATUS */}
          <ProjectStatus />

          {/* 9. RESEARCH DIRECTION */}
          <ResearchDirection />

          {/* 10. CREDITS & ACKNOWLEDGEMENTS */}
          <Credits />

          {/* 11. RESEARCH RESOURCES */}
          <ResearchResources />

          {/* 12. RESEARCH DISCLAIMER */}
          <AboutDisclaimer />

          {/* 13. FINAL CTA */}
          <AboutCTA />

          {/* Platform Footer */}
          <GlobalFooter className="mt-20" />
        </main>
      </div>
    </div>
  )
}
