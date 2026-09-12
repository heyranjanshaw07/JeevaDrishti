import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Button — Foundational JeevaDrishti Button System
 * 
 * Variants:
 * - primary: Vivid Crimson / Ruby with specular shine
 * - secondary: Glass with subtle border & specular highlight
 * - crimson: Vivid Crimson accent
 * - outline: Clean laboratory hairline border
 * - ghost: Minimal sleek hover
 * - danger: Alert state (Crimson/Ruby)
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  onClick,
  type = 'button',
  disabled = false,
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    crimson: 'btn-primary',
    violet: 'btn-primary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm border border-crimson/30 text-crimson bg-crimson/10 hover:bg-crimson/20 transition-all',
  }

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs rounded-lg',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-7 py-3.5 text-base rounded-2xl',
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        variants[variant] || variants.primary,
        sizes[size],
        'disabled:opacity-40 disabled:cursor-not-allowed select-none font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2A55] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060205]',
        className
      )}
      whileHover={disabled || loading ? undefined : { y: -1 }}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="shrink-0" />}
          {children}
          {IconRight && <IconRight size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="shrink-0" />}
        </>
      )}
    </motion.button>
  )
}
