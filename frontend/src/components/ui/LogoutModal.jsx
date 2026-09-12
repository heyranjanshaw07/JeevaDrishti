import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, X } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export default function LogoutModal() {
  const navigate = useNavigate()
  const { isLogoutModalOpen, closeLogoutModal, logout } = useAppStore()

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLogoutModalOpen) {
        closeLogoutModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLogoutModalOpen, closeLogoutModal])

  const handleConfirm = async () => {
    closeLogoutModal()
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  const handleCancel = () => {
    closeLogoutModal()
  }

  return (
    <AnimatePresence>
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md rounded-2xl bg-[#0B0408]/95 border border-white/[0.12] p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_30px_rgba(255,42,85,0.15)] overflow-hidden z-10"
          >
            {/* Ambient Background Crimson Radiance */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-crimson/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-crimson/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close icon button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-text-muted hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close dialog"
            >
              <X size={15} />
            </button>

            {/* Modal Body */}
            <div className="flex flex-col items-center text-center space-y-4 pt-1">
              {/* Icon badge */}
              <div className="w-14 h-14 rounded-2xl bg-crimson/15 border border-crimson/30 flex items-center justify-center text-crimson shadow-[0_0_20px_rgba(255,42,85,0.25)]">
                <LogOut size={26} className="translate-x-0.5" />
              </div>

              {/* Title & Question */}
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight">
                  Confirm Logout
                </h3>
                <p className="text-base sm:text-lg text-white/90 font-medium leading-relaxed">
                  Are you sure you want to logout?
                </p>
              </div>

              {/* Action Buttons: Yes / No */}
              <div className="grid grid-cols-2 gap-3 w-full pt-3">
                {/* No Button */}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.15] border border-white/[0.1] hover:border-white/20 text-white font-mono text-sm sm:text-base font-semibold transition-all duration-150 flex items-center justify-center cursor-pointer"
                >
                  No
                </button>

                {/* Yes Button */}
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full py-3 px-4 rounded-xl bg-crimson hover:bg-crimson-dark active:bg-crimson/90 border border-crimson/50 text-white font-mono text-sm sm:text-base font-bold shadow-[0_0_20px_rgba(255,42,85,0.35)] hover:shadow-[0_0_28px_rgba(255,42,85,0.55)] transition-all duration-150 flex items-center justify-center cursor-pointer"
                >
                  Yes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
