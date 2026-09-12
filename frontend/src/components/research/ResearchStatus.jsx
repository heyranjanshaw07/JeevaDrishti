import { Terminal, CheckCircle2, Clock, ShieldCheck, AlertCircle } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

const STATUS_ITEMS = [
  {
    module: 'Micro-OD',
    status: 'Available',
    statusType: 'ready',
    desc: '4 datasets & 252 images verified',
  },
  {
    module: 'Benchmark UI',
    status: 'Ready',
    statusType: 'ready',
    desc: '0-6 shot configuration matrix active',
  },
  {
    module: 'AI Inference',
    status: 'Pending Integration',
    statusType: 'pending',
    desc: 'VLM model serving pipeline standby',
  },
  {
    module: 'Backend',
    status: 'Pending Integration',
    statusType: 'pending',
    desc: 'FastAPI execution server standby',
  },
]

/**
 * ResearchStatus — Transparent environment readiness status panel
 */
export default function ResearchStatus() {
  return (
    <GlassCard className="p-6 sm:p-7 border-white/[0.08] relative overflow-hidden space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-crimson" />
          <h3 className="text-base font-heading font-bold text-white tracking-tight">
            Research Environment
          </h3>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] font-mono text-text-muted">
          <ShieldCheck size={11} className="text-crimson" />
          <span>STANDBY VERIFICATION MATRIX</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {STATUS_ITEMS.map((item) => {
          const isReady = item.statusType === 'ready'

          return (
            <div
              key={item.module}
              className="p-4 rounded-xl bg-black/50 border border-white/[0.06] space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white">
                  {item.module}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                    isReady
                      ? 'bg-crimson/15 text-crimson border-crimson/30'
                      : 'bg-white/[0.04] text-text-muted border-white/[0.08]'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-sans text-text-secondary">
                  {item.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-white/[0.04] flex items-center gap-1.5 text-[9px] font-mono text-text-muted">
                {isReady ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
                    <span>FRONTEND MOUNTED</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    <span>NEXT PHASE</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[11px] font-mono text-text-muted text-center pt-1">
        Notice: Pending components are not currently connected to live model weights or backend APIs.
      </p>
    </GlassCard>
  )
}
