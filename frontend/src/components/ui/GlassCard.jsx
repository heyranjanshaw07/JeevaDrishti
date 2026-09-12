import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * GlassCard — Reusable Aurora Vision Lab Glassmorphic Container
 *
 * Spec:
 * - background: rgba(255, 255, 255, 0.025)
 * - border: 1px solid rgba(255, 255, 255, 0.08)
 * - backdrop-filter: blur(20px)
 * - border-radius: 20px
 * - specular top highlight
 */
export default function GlassCard({
  children,
  className = '',
  hover = false,
  glow = false,
  variant = 'default', // 'default' | 'elevated' | 'cyan' | 'violet'
  onClick,
  ...props
}) {
  const variantStyles = {
    default: 'border-white/[0.08] bg-white/[0.025]',
    elevated: 'border-white/[0.12] bg-[#12060E]/80 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)]',
    crimson: 'border-crimson/30 bg-crimson/[0.03] shadow-[0_0_30px_rgba(255,42,85,0.12)]',
    white: 'border-white/25 bg-white/[0.03] shadow-[0_0_30px_rgba(255,255,255,0.08)]',
    cyan: 'border-crimson/30 bg-crimson/[0.03] shadow-[0_0_30px_rgba(255,42,85,0.12)]',
    violet: 'border-white/25 bg-white/[0.03] shadow-[0_0_30px_rgba(255,255,255,0.08)]',
  }

  return (
    <motion.div
      className={cn(
        'relative rounded-[20px] backdrop-blur-[20px] border transition-all duration-300',
        'shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]',
        variantStyles[variant] || variantStyles.default,
        glow && 'ring-1 ring-crimson/30 shadow-[0_0_40px_rgba(255,42,85,0.18)]',
        hover && 'hover:border-crimson/35 hover:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85)] cursor-pointer',
        className
      )}
      onClick={onClick}
      whileHover={hover ? { y: -3, scale: 1.012, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } : undefined}
      {...props}
    >
      {/* Specular Top Edge Light */}
      <div 
        className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/[0.14] to-transparent pointer-events-none" 
      />

      {children}
    </motion.div>
  )
}
