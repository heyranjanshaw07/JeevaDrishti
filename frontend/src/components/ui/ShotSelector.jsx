import { motion } from 'framer-motion'

const SHOTS = ['0-shot', '6-shot']

/**
 * Few-shot mode selector — pill-style toggle
 */
export default function ShotSelector({ value, onChange }) {
  return (
    <div className="flex gap-1.5 p-1 glass rounded-xl">
      {SHOTS.map((shot) => (
        <button
          key={shot}
          onClick={() => onChange(shot)}
          className="relative px-4 py-2 rounded-lg text-xs font-mono font-medium transition-colors"
        >
          {value === shot && (
            <motion.div
              layoutId="shot-pill"
              className="absolute inset-0 rounded-lg bg-crimson/20 border border-crimson/40 shadow-[0_0_12px_rgba(255,42,85,0.25)]"
              transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
            />
          )}
          <span className={`relative z-10 ${value === shot ? 'text-white font-bold' : 'text-text-muted hover:text-text-secondary'}`}>
            {shot}
          </span>
        </button>
      ))}
    </div>
  )
}
