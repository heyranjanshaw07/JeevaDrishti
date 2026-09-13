import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, User, ArrowRight, ArrowLeft,
  Sparkles, AlertCircle
} from 'lucide-react'

import BiologicalIrisScene from '@/components/3d/BiologicalIrisScene'
import MicroscopeLensTransition from '@/components/transitions/MicroscopeLensTransition'
import { useAppStore } from '@/store/appStore'
import { loginUser, signupUser } from '@/services/api'

/**
 * Minimalist Logo Mark: Eye + Iris + Biological Cell
 */
function JeevaDrishtiLogo({ size = 20, className = '' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-crimson"
      >
        {/* Outer Biological Membrane / Eye Oval */}
        <path
          d="M2 12C4.5 7 8.5 4 12 4C15.5 4 19.5 7 22 12C19.5 17 15.5 20 12 20C8.5 20 4.5 17 2 12Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inner Iris Ring */}
        <circle
          cx="12"
          cy="12"
          r="4.5"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          strokeDasharray="1.5 1.5"
        />
        {/* Central Pupil Nucleus */}
        <circle
          cx="12"
          cy="12"
          r="2"
          fill="#FF2A55"
        />
      </svg>
    </div>
  )
}

/**
 * Official Google G SVG Icon
 */
function GoogleIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  )
}

/**
 * AuthPage — Fullscreen Cinematic Iris Experience → Transition → Login
 * 
 * Flow:
 * 1. INITIAL: Fullscreen eye occupying entire viewport. No login form visible.
 * 2. CLICK EYE / PROMPT:
 *    - Iris pulses and scanning light animates
 *    - Camera/iris smoothly zooms deep into pupil
 *    - Crimson/black optical expansion
 *    - Iris completely fades out (disappears)
 *    - Login page materializes smoothly into center view
 * 3. BACK BUTTON:
 *    - Reverse transition plays gracefully
 *    - Login form fades and zooms back
 *    - Fullscreen iris returns to its original calm state
 */
export default function AuthPage({ initialMode = 'login' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login } = useAppStore()

  // Authentication Visual Stage: 'eye' | 'transitioning-to-login' | 'login' | 'transitioning-to-eye'
  const [authStage, setAuthStage] = useState('eye')

  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState(initialMode)

  // 3D Iris Interaction States
  const [focusField, setFocusField] = useState(null) // null | 'email' | 'password'
  const [irisAnimState, setIrisAnimState] = useState('idle') // 'idle' | 'transition' | 'reverse-transition' | 'login' | 'signup'

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: true,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)

  // If user is already authenticated, redirect to dashboard (unless completing login transition)
  useEffect(() => {
    if (isAuthenticated && !isTransitioning) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isTransitioning, navigate])

  // Sync mode with route if navigating directly
  useEffect(() => {
    if (location.pathname === '/signup') {
      setMode('signup')
    } else if (location.pathname === '/login') {
      setMode('login')
    }
  }, [location.pathname])

  // Escape key returns to eye if on login screen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && authStage === 'login') {
        handleBackToEye()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [authStage])

  // ─── 1. Forward Cinematic Transition: Eye → Login ──────────────────────────
  const handleEnterLogin = () => {
    if (authStage !== 'eye') return
    setAuthStage('transitioning-to-login')
    setIrisAnimState('transition')

    // Transition duration: 1.8s
    setTimeout(() => {
      setAuthStage('login')
      setIrisAnimState('idle')
    }, 1800)
  }

  // ─── 2. Reverse Cinematic Transition: Login → Eye ──────────────────────────
  const handleBackToEye = () => {
    if (authStage !== 'login') return
    setAuthStage('transitioning-to-eye')
    setIrisAnimState('reverse-transition')

    // Reverse transition duration: 1.5s
    setTimeout(() => {
      setAuthStage('eye')
      setIrisAnimState('idle')
    }, 1500)
  }

  // Switch to Sign Up mode inside login card
  const triggerSignUpState = () => {
    setMode('signup')
    setError('')
    window.history.replaceState(null, '', '/signup')
  }

  // Switch to Login mode inside login card
  const triggerLoginState = () => {
    setMode('login')
    setError('')
    window.history.replaceState(null, '', '/login')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  // Quick Demo Auto-Fill
  const handleAutoFillDemo = () => {
    if (authStage === 'eye') {
      handleEnterLogin()
    }
    if (mode === 'login') {
      setFormData((prev) => ({
        ...prev,
        email: 'dr.sharma@aiims.edu',
        password: 'microscopy-lab-key-2026',
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        name: 'Dr. Evelyn Sharma',
        email: 'evelyn.sharma@aiims.edu',
        password: 'microscopy-lab-key-2026',
        confirmPassword: 'microscopy-lab-key-2026',
      }))
    }
    setError('')
  }

  // Form Submission — wired to real FastAPI backend
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (mode === 'login') {
      if (!formData.email.trim() || !formData.password.trim()) {
        return setError('Please enter your email and password.')
      }

      setLoading(true)

      try {
        const data = await loginUser({ email: formData.email, password: formData.password })
        login({ ...data.user, token: data.token })
        if (formData.rememberMe) {
          localStorage.setItem('jeevadrishti_remember', 'true')
        }
        setIsTransitioning(true)
      } catch (err) {
        setLoading(false)
        setError(err.message || 'Login failed. Please check your credentials.')
      }
    } else {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
        return setError('Please complete all required fields.')
      }
      if (formData.password !== formData.confirmPassword) {
        return setError('Passwords do not match.')
      }
      if (formData.password.length < 8) {
        return setError('Password must be at least 8 characters.')
      }

      setLoading(true)

      try {
        const data = await signupUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        })
        login({ ...data.user, token: data.token })
        setIsTransitioning(true)
      } catch (err) {
        setLoading(false)
        setError(err.message || 'Registration failed. Please try again.')
      }
    }
  }

  const handleTransitionComplete = () => {
    navigate('/dashboard')
  }

  return (
    <div className="relative min-h-screen w-full bg-[#060205] text-white flex items-center justify-center overflow-hidden select-none">
      {/* ─── Microscope Lens → Microscopic World Transition into Dashboard ──── */}
      <MicroscopeLensTransition
        isActive={isTransitioning}
        onComplete={handleTransitionComplete}
      />

      {/* ─── Deep Hematology Atmospheric Ambient Radiance ────────────────── */}
      <div
        className="fixed -top-40 left-0 w-[650px] h-[650px] rounded-full bg-crimson/[0.08] blur-[170px] pointer-events-none z-0 transition-opacity duration-700"
        style={{ opacity: authStage === 'eye' ? 0.35 : 0.6 }}
      />
      <div
        className="fixed -bottom-40 right-0 w-[600px] h-[600px] rounded-full bg-ruby/[0.06] blur-[160px] pointer-events-none z-0 transition-opacity duration-700"
        style={{ opacity: authStage === 'eye' ? 0.2 : 0.4 }}
      />

      {/* ───────────────────────────────────────────────────────────────────
          1. FULLSCREEN 3D BIOLOGICAL IRIS / EYE (Entire Viewport)
      ─────────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={false}
        animate={{
          scale: authStage === 'transitioning-to-login' ? 3.6 : 1,
          opacity: (authStage === 'transitioning-to-login' || authStage === 'login') ? 0 : 1,
          filter: authStage === 'transitioning-to-login' ? 'blur(10px)' : 'blur(0px)',
        }}
        transition={{
          duration: authStage === 'transitioning-to-login' ? 1.8 : 1.4,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          display: authStage === 'login' ? 'none' : 'flex',
          pointerEvents: authStage === 'eye' ? 'auto' : 'none',
        }}
        className="fixed inset-0 w-screen h-screen z-10 flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none"
      >
        {/* Top Header: Brand Identity & Demo Action */}
        <div className="relative z-30 flex items-center justify-between w-full max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-crimson/15 border border-crimson/35 flex items-center justify-center shadow-[0_0_15px_rgba(255,42,85,0.25)] group-hover:shadow-[0_0_22px_rgba(255,42,85,0.45)] transition-all duration-300">
              <JeevaDrishtiLogo size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-heading font-extrabold text-white tracking-tight leading-none group-hover:text-crimson transition-colors">
                JeevaDrishti
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-white/50 tracking-wider uppercase mt-1">
                Biological Intelligence
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleAutoFillDemo}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-white/80 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <Sparkles size={13} className="text-crimson" />
            <span>Demo Fill</span>
          </button>
        </div>

        {/* 3D Biological Iris Canvas: Fullscreen Interactive Centerpiece */}
        <div
          className="absolute inset-0 z-10 pointer-events-auto cursor-pointer"
          onClick={handleEnterLogin}
          title="Click iris to enter"
        >
          <BiologicalIrisScene
            isAwakened={authStage !== 'eye'}
            onToggleAwaken={handleEnterLogin}
            focusMode={focusField}
            animState={irisAnimState}
            className="w-full h-full"
          />
        </div>

        {/* Bottom Interactive Awakening Trigger & Philosophy Overlay */}
        <div className="relative z-30 pb-4 sm:pb-8 w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 pointer-events-none">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold text-white tracking-tight leading-tight">
              Seeing Life Through Intelligence
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-text-secondary font-mono max-w-lg">
              Cellular neural architecture meets foundation vision models.
            </p>
          </div>

          {/* Touch Iris Prompt Button */}
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={handleEnterLogin}
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-black/85 hover:bg-black border border-crimson/50 hover:border-crimson text-white text-xs sm:text-sm font-mono backdrop-blur-xl shadow-[0_0_30px_rgba(255,42,85,0.35)] hover:shadow-[0_0_45px_rgba(255,42,85,0.65)] transition-all cursor-pointer group"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-crimson animate-pulse shadow-[0_0_10px_#FF2A55]" />
              <span className="font-bold tracking-wider uppercase">
                TOUCH IRIS TO ENTER
              </span>
              <ArrowRight size={15} className="text-crimson group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Optical Scanning & Light Burst Overlay ────────────────────────── */}
      {(authStage === 'transitioning-to-login' || authStage === 'transitioning-to-eye') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: authStage === 'transitioning-to-login' ? [0, 0.85, 1, 0] : [0, 0.7, 0],
          }}
          transition={{
            duration: authStage === 'transitioning-to-login' ? 1.8 : 1.4,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="fixed inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden"
        >
          {/* Central crimson photon dilation */}
          <motion.div
            animate={{
              scale: authStage === 'transitioning-to-login' ? [0.2, 1.4, 3.8] : [3.2, 1.0, 0.2],
              opacity: [0.2, 0.9, 0],
            }}
            transition={{
              duration: authStage === 'transitioning-to-login' ? 1.8 : 1.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-[440px] h-[440px] rounded-full bg-gradient-radial from-crimson/50 via-ruby/25 to-transparent blur-3xl absolute"
          />

          {/* Slit-lamp scanning light beam */}
          <motion.div
            animate={{
              x: authStage === 'transitioning-to-login' ? ['-100%', '100%'] : ['100%', '-100%'],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute h-1.5 w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-75 shadow-[0_0_24px_#FFFFFF]"
          />
        </motion.div>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          2. AUTHENTICATION PANEL (LOGIN / SIGN UP PAGE)
      ─────────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={false}
        animate={{
          opacity: (authStage === 'login' || authStage === 'transitioning-to-login') ? 1 : 0,
          scale: (authStage === 'login' || authStage === 'transitioning-to-login') ? 1 : 0.94,
          y: (authStage === 'login' || authStage === 'transitioning-to-login') ? 0 : 28,
          filter: (authStage === 'login' || authStage === 'transitioning-to-login') ? 'blur(0px)' : 'blur(14px)',
        }}
        transition={{
          duration: authStage === 'transitioning-to-login' ? 0.9 : 0.6,
          delay: authStage === 'transitioning-to-login' ? 0.85 : 0,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          display: authStage === 'eye' ? 'none' : 'flex',
          pointerEvents: authStage === 'login' ? 'auto' : 'none',
        }}
        className="relative z-30 min-h-screen w-full flex items-center justify-center p-4 sm:p-8 lg:p-12"
      >
        <div className="w-full max-w-[500px] sm:max-w-[520px] my-auto">
          <div className="p-8 sm:p-10 rounded-[30px] bg-black/75 backdrop-blur-2xl border border-white/[0.1] shadow-[0_30px_90px_-15px_rgba(0,0,0,0.95)] relative overflow-hidden">
            {/* Soft Ambient Card Radiance */}
            <div className="absolute -top-28 -right-28 w-64 h-64 bg-crimson/12 rounded-full blur-3xl pointer-events-none" />

            {/* ─── Top Controls: Back Button & Demo Fill ───────────────────── */}
            <div className="flex items-center justify-between mb-6">
              {/* Subtle Back Button: Returns to Fullscreen Iris */}
              <button
                type="button"
                onClick={handleBackToEye}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/[0.08] hover:border-crimson/40 text-sm font-mono text-white/80 hover:text-white transition-all cursor-pointer group"
                title="Return to visual iris entry"
              >
                <ArrowLeft size={16} className="text-crimson group-hover:-translate-x-0.5 transition-transform" />
                <span className="font-semibold text-sm">Back</span>
              </button>

              <button
                type="button"
                onClick={handleAutoFillDemo}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-sm font-mono text-white/80 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <Sparkles size={14} className="text-crimson" />
                <span>Demo Fill</span>
              </button>
            </div>

            {/* ─── Header & Tagline ───────────────────────────────────────── */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-2">
                <JeevaDrishtiLogo size={26} />
                <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
                  JeevaDrishti
                </h1>
              </div>
              <p className="text-sm sm:text-base font-mono text-crimson font-semibold tracking-wide">
                See Deeper. Understand Life.
              </p>
            </div>

            {/* ─── Sign In | Sign Up Toggle ───────────────────────────────── */}
            <div className="flex p-1.5 rounded-xl bg-black/70 border border-white/[0.08] mb-7">
              <button
                type="button"
                onClick={triggerLoginState}
                className={`flex-1 py-2.5 text-sm sm:text-base font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-crimson text-white shadow-[0_0_18px_rgba(255,42,85,0.45)]'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={triggerSignUpState}
                className={`flex-1 py-2.5 text-sm sm:text-base font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-crimson text-white shadow-[0_0_18px_rgba(255,42,85,0.45)]'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Notification */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-5 p-3.5 rounded-xl bg-crimson/15 border border-crimson/35 flex items-start gap-3 text-sm text-white"
                >
                  <AlertCircle size={17} className="shrink-0 mt-0.5 text-crimson" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Forms: Sign In vs Sign Up ─────────────────────────────── */}
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                /* ─── LOGIN STATE ────────────────────────────────────────── */
                <motion.form
                  key="login-form"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="mb-2">
                    <h3 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight">
                      Welcome Back
                    </h3>
                    <p className="text-sm text-text-secondary font-sans mt-1 leading-relaxed">
                      Continue your journey with intelligent biological insights.
                    </p>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label htmlFor="login-email" className="block text-xs sm:text-sm font-mono font-semibold text-white/90 mb-2 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-crimson transition-colors"
                      />
                      <input
                        id="login-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setFocusField('email')}
                        onBlur={() => setFocusField(null)}
                        placeholder="researcher@institute.edu"
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/60 border border-white/[0.08] focus:border-crimson/60 focus:ring-1 focus:ring-crimson/40 text-base text-white placeholder:text-white/25 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="login-password" className="block text-xs sm:text-sm font-mono font-semibold text-white/90 mb-2 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-crimson transition-colors"
                      />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setFocusField('password')}
                        onBlur={() => setFocusField(null)}
                        placeholder="••••••••••••"
                        required
                        className="w-full pl-11 pr-12 py-3 rounded-xl bg-black/60 border border-white/[0.08] focus:border-crimson/60 focus:ring-1 focus:ring-crimson/40 text-base text-white placeholder:text-white/25 outline-none transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setShowPassword((prev) => !prev)
                        }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-crimson/50 transition-all cursor-pointer flex items-center justify-center"
                      >
                        {showPassword ? (
                          <EyeOff size={20} className="text-crimson transition-colors" />
                        ) : (
                          <Eye size={20} className="text-white/75 hover:text-white transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Options: Remember me & Forgot Password? */}
                  <div className="flex items-center justify-between pt-1 text-sm">
                    <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-white/20 bg-black/50 text-crimson focus:ring-0 cursor-pointer"
                      />
                      <span>Remember me</span>
                    </label>
                    <a
                      href="#forgot"
                      onClick={(e) => {
                        e.preventDefault()
                        setError('Reset link dispatched to authorized research email.')
                      }}
                      className="text-text-muted hover:text-crimson transition-colors font-mono text-xs sm:text-sm"
                    >
                      Forgot Password?
                    </a>
                  </div>

                  {/* Primary button: Sign In */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2.5 py-3.5 rounded-xl bg-crimson hover:bg-ruby text-white font-heading font-extrabold text-base sm:text-lg tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(255,42,85,0.35)] hover:shadow-[0_6px_35px_rgba(255,42,85,0.55)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Authenticating Biological Gateway...' : 'Sign In'}</span>
                  </button>

                  {/* Divider: OR */}
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/[0.08]" />
                    </div>
                    <span className="relative px-3.5 bg-[#060205] text-xs font-mono font-semibold text-white/40 uppercase tracking-widest">
                      OR
                    </span>
                  </div>

                  {/* Secondary button: Continue with Google */}
                  <button
                    type="button"
                    onClick={handleAutoFillDemo}
                    className="w-full py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-sm sm:text-base font-mono font-semibold text-white flex items-center justify-center gap-3 transition-all cursor-pointer"
                  >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </button>

                  {/* Bottom: Don't have an account? Create Account */}
                  <div className="pt-3 text-center text-sm sm:text-base text-text-secondary font-sans">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={triggerSignUpState}
                      className="text-crimson hover:underline font-bold ml-1 cursor-pointer font-mono"
                    >
                      Create Account
                    </button>
                  </div>
                </motion.form>
              ) : (
                /* ─── SIGN UP STATE ──────────────────────────────────────── */
                <motion.form
                  key="signup-form"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="mb-2">
                    <h3 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight">
                      Begin Your Journey
                    </h3>
                    <p className="text-sm text-text-secondary font-sans mt-1 leading-relaxed">
                      Create your JeevaDrishti account.
                    </p>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label htmlFor="signup-name" className="block text-xs sm:text-sm font-mono font-semibold text-white/90 mb-2 uppercase tracking-wider">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-crimson transition-colors"
                      />
                      <input
                        id="signup-name"
                        type="text"
                        name="name"
                        autoComplete="name"
                        value={formData.name}
                        onChange={handleChange}
                        onFocus={() => setFocusField('email')}
                        onBlur={() => setFocusField(null)}
                        placeholder="Dr. Evelyn Sharma"
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/60 border border-white/[0.08] focus:border-crimson/60 focus:ring-1 focus:ring-crimson/40 text-base text-white placeholder:text-white/25 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label htmlFor="signup-email" className="block text-xs sm:text-sm font-mono font-semibold text-white/90 mb-2 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-crimson transition-colors"
                      />
                      <input
                        id="signup-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setFocusField('email')}
                        onBlur={() => setFocusField(null)}
                        placeholder="evelyn.sharma@aiims.edu"
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/60 border border-white/[0.08] focus:border-crimson/60 focus:ring-1 focus:ring-crimson/40 text-base text-white placeholder:text-white/25 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="signup-password" className="block text-xs sm:text-sm font-mono font-semibold text-white/90 mb-2 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-crimson transition-colors"
                      />
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setFocusField('password')}
                        onBlur={() => setFocusField(null)}
                        placeholder="••••••••••••"
                        required
                        className="w-full pl-11 pr-12 py-3 rounded-xl bg-black/60 border border-white/[0.08] focus:border-crimson/60 focus:ring-1 focus:ring-crimson/40 text-base text-white placeholder:text-white/25 outline-none transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setShowPassword((prev) => !prev)
                        }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-crimson/50 transition-all cursor-pointer flex items-center justify-center"
                      >
                        {showPassword ? (
                          <EyeOff size={20} className="text-crimson transition-colors" />
                        ) : (
                          <Eye size={20} className="text-white/75 hover:text-white transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="signup-confirm-password" className="block text-xs sm:text-sm font-mono font-semibold text-white/90 mb-2 uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-crimson transition-colors"
                      />
                      <input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onFocus={() => setFocusField('password')}
                        onBlur={() => setFocusField(null)}
                        placeholder="••••••••••••"
                        required
                        className="w-full pl-11 pr-12 py-3 rounded-xl bg-black/60 border border-white/[0.08] focus:border-crimson/60 focus:ring-1 focus:ring-crimson/40 text-base text-white placeholder:text-white/25 outline-none transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setShowConfirmPassword((prev) => !prev)
                        }}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-crimson/50 transition-all cursor-pointer flex items-center justify-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} className="text-crimson transition-colors" />
                        ) : (
                          <Eye size={20} className="text-white/75 hover:text-white transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Primary button: Create Account */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2.5 py-3.5 rounded-xl bg-crimson hover:bg-ruby text-white font-heading font-extrabold text-base sm:text-lg tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(255,42,85,0.35)] hover:shadow-[0_6px_35px_rgba(255,42,85,0.55)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Initializing Biological Profile...' : 'Create Account'}</span>
                  </button>

                  {/* Bottom: Already have an account? Sign In */}
                  <div className="pt-3 text-center text-sm sm:text-base text-text-secondary font-sans">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={triggerLoginState}
                      className="text-crimson hover:underline font-bold ml-1 cursor-pointer font-mono"
                    >
                      Sign In
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
