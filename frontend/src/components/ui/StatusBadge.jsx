import { cn } from '@/lib/utils'

/**
 * StatusBadge — Reusable Scientific Telemetry & System Label Badge
 * Uses JetBrains Mono typography for precision instrumentation labels:
 * SYSTEM ONLINE, VISION ENGINE, INFERENCE, LATENCY, DATASET, MODEL
 */
export default function StatusBadge({
  label,
  children,
  value,
  variant = 'crimson', // 'crimson' | 'white' | 'ruby' | 'neutral'
  pulse = true,
  icon: Icon,
  className = '',
}) {
  const text = label || children

  const variantStyles = {
    crimson: {
      pill: 'bg-crimson/[0.08] border-crimson/35 text-[#FF6B8B] shadow-[0_0_14px_rgba(255,42,85,0.2)]',
      dot: 'bg-crimson shadow-[0_0_8px_#FF2A55]',
    },
    white: {
      pill: 'bg-white/[0.08] border-white/35 text-white shadow-[0_0_14px_rgba(255,255,255,0.15)]',
      dot: 'bg-white shadow-[0_0_8px_#FFFFFF]',
    },
    cyan: {
      pill: 'bg-crimson/[0.08] border-crimson/35 text-[#FFA0B4] shadow-[0_0_14px_rgba(255,42,85,0.2)]',
      dot: 'bg-crimson shadow-[0_0_8px_#FF2A55]',
    },
    violet: {
      pill: 'bg-white/[0.08] border-white/30 text-white shadow-[0_0_12px_rgba(255,255,255,0.12)]',
      dot: 'bg-white shadow-[0_0_8px_#FFFFFF]',
    },
    emerald: {
      pill: 'bg-crimson/[0.08] border-crimson/30 text-[#FFA0B4] shadow-[0_0_12px_rgba(255,42,85,0.12)]',
      dot: 'bg-crimson shadow-[0_0_8px_#FF2A55]',
    },
    amber: {
      pill: 'bg-ruby-500/[0.08] border-ruby-500/30 text-ruby-300 shadow-[0_0_12px_rgba(220,38,38,0.12)]',
      dot: 'bg-ruby-400 shadow-[0_0_8px_#ef4444]',
    },
    rose: {
      pill: 'bg-crimson/[0.08] border-crimson/30 text-crimson-300 shadow-[0_0_12px_rgba(255,42,85,0.12)]',
      dot: 'bg-crimson shadow-[0_0_8px_#FF2A55]',
    },
    neutral: {
      pill: 'bg-white/[0.04] border-white/[0.1] text-text-secondary',
      dot: 'bg-white/60',
    },
  }

  const selected = variantStyles[variant] || variantStyles.crimson

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-mono tracking-wider uppercase font-medium backdrop-blur-md select-none',
        selected.pill,
        className
      )}
    >
      {/* Indicator Dot */}
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              selected.dot
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', selected.dot)} />
      </span>

      {/* Optional Icon */}
      {Icon && <Icon size={12} className="opacity-80" />}

      {/* Label Text */}
      <span className="leading-none">{text}</span>

      {/* Optional Value */}
      {value && (
        <>
          <span className="opacity-30">|</span>
          <span className="font-semibold text-text-primary tracking-normal font-sans text-xs">
            {value}
          </span>
        </>
      )}
    </span>
  )
}
