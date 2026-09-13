import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Microscope, ArrowRight, Menu, X, Sparkles } from 'lucide-react'
import Button from './Button'
import StatusBadge from './StatusBadge'
import { useAppStore } from '@/store/appStore'

export default function LandingNavbar() {
  const { isAuthenticated } = useAppStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pipeline', href: '#pipeline' },
    { label: 'Benchmark', href: '#benchmark' },
    { label: 'Research', href: '#research' },
  ]

  const handleScrollTo = (e, href) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pt-4 pb-2 pointer-events-none">
      <div
        className={`w-full max-w-6xl pointer-events-auto rounded-2xl transition-all duration-300 ${
          scrolled
            ? 'glass-panel bg-[#0A0408]/90 backdrop-blur-xl border-white/[0.1] shadow-[0_16px_40px_-10px_rgba(0,0,0,0.85)] py-2.5 px-4 sm:px-6'
            : 'bg-white/[0.02] backdrop-blur-md border border-white/[0.06] py-3.5 px-5 sm:px-7'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* ─── Left: Brand Logo ────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-crimson/15 border border-crimson/35 flex items-center justify-center text-crimson shadow-[0_0_18px_rgba(255,42,85,0.35)] group-hover:shadow-[0_0_24px_rgba(255,42,85,0.55)] transition-all duration-300">
              <Microscope size={19} />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-heading font-bold text-text-primary tracking-tight leading-none group-hover:text-crimson transition-colors">
                JeevaDrishti
              </span>
              <span className="text-[10px] font-mono text-text-muted tracking-wider uppercase mt-0.5">
                Intelligent Microscopy
              </span>
            </div>
          </Link>

          {/* ─── Center: Navigation Links ────────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.05] transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* ─── Right: Actions ──────────────────────────────────────────── */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
            )}

            <Link to={isAuthenticated ? "/analyze" : "/login"}>
              <Button variant="primary" size="sm" iconRight={ArrowRight}>
                Get Started
              </Button>
            </Link>
          </div>

          {/* ─── Mobile Hamburger Toggle ─────────────────────────────────── */}
          <div className="sm:hidden flex items-center gap-2">
            <Link to={isAuthenticated ? "/analyze" : "/login"}>
              <Button variant="primary" size="sm">
                Start
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary bg-white/[0.04] border border-white/[0.08]"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* ─── Mobile Dropdown Menu ────────────────────────────────────── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden pt-4 pb-2 border-t border-white/[0.08] mt-3 flex flex-col gap-2"
            >
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href)}
                  className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-crimson hover:bg-white/[0.04] transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 flex items-center gap-2 border-t border-white/[0.06]">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                )}
                <Link to={isAuthenticated ? "/analyze" : "/login"} className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full" iconRight={ArrowRight}>
                    Get Started
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
