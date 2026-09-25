import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { BarChart3, AlertCircle, Sparkles } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

/**
 * BenchmarkChart — Few-Shot Performance chart with honest empty state
 * Expected data shape:
 * [
 *   { shot: '0 Shot', mF1: null, precision: null, recall: null },
 *   { shot: '1 Shot', mF1: null, precision: null, recall: null },
 *   { shot: '3 Shot', mF1: null, precision: null, recall: null },
 *   { shot: '6 Shot', mF1: null, precision: null, recall: null },
 * ]
 */
export default function BenchmarkChart({ data = [] }) {
  // Determine if there is any real numeric data present
  const hasValidData =
    Array.isArray(data) &&
    data.length > 0 &&
    data.some(
      (d) =>
        (typeof d.mF1 === 'number' && !isNaN(d.mF1)) ||
        (typeof d.precision === 'number' && !isNaN(d.precision)) ||
        (typeof d.recall === 'number' && !isNaN(d.recall))
    )

  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-crimson" />
            <h3 className="text-lg font-heading font-bold text-white tracking-tight">
              Few-Shot Performance
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            mF1, Precision, and Recall trajectory as visual in-context shot count increases.
          </p>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
            <span className="text-white/80">mF1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_6px_#FFFFFF]" />
            <span className="text-white/80">Precision</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-crimson-400" />
            <span className="text-white/80">Recall</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full h-72 sm:h-80 rounded-xl bg-black/40 border border-white/[0.06] relative overflow-hidden flex items-center justify-center p-4">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />

        {hasValidData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
              <XAxis
                dataKey="shot"
                stroke="rgba(255, 255, 255, 0.4)"
                tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11, fontFamily: 'monospace' }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="rgba(255, 255, 255, 0.4)"
                tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11, fontFamily: 'monospace' }}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#060205',
                  borderColor: 'rgba(255, 42, 85, 0.4)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="mF1"
                stroke="#FF2A55"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#FF2A55' }}
                activeDot={{ r: 6, fill: '#FF2A55' }}
              />
              <Line
                type="monotone"
                dataKey="precision"
                stroke="#FFFFFF"
                strokeWidth={2}
                dot={{ r: 4, fill: '#FFFFFF' }}
              />
              <Line
                type="monotone"
                dataKey="recall"
                stroke="#DC2626"
                strokeWidth={2}
                dot={{ r: 4, fill: '#DC2626' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          /* Honest Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-3 z-10 max-w-sm px-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-crimson/10 border border-crimson/25 mx-auto flex items-center justify-center text-crimson shadow-[0_0_20px_rgba(255,42,85,0.2)]">
              <BarChart3 size={22} />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-text-muted mb-1">
                <span>BENCHMARK RESULTS UNAVAILABLE</span>
              </div>
              <h4 className="text-base font-heading font-extrabold text-white tracking-tight">
                Benchmark results unavailable
              </h4>
              <p className="text-xs font-sans text-text-secondary leading-relaxed">
                Run an evaluation to populate performance metrics.
              </p>
            </div>

            <div className="pt-2 flex justify-center items-center gap-2 text-[10px] font-mono text-text-muted">
              <span>0 / 6 SHOT COMPARISON</span>
              <span className="text-crimson">●</span>
              <span>AWAITING INFERENCE</span>
            </div>
          </motion.div>
        )}
      </div>
    </GlassCard>
  )
}
