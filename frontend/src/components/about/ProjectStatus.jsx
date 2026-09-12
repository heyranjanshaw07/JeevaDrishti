import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

const STATUS_ENTRIES = [
  { module: 'FRONTEND', status: 'READY', desc: 'Complete client interface & design system' },
  { module: 'RESEARCH UI', status: 'READY', desc: 'Research Hub & Scientific Insights explorer' },
  { module: 'DATASET EXPLORER', status: 'READY', desc: 'Microscopy slide viewer & dataset catalog' },
  { module: 'BENCHMARK UI', status: 'READY', desc: 'Experiment matrix & evaluation protocol view' },
  { module: 'AI INFERENCE', status: 'PENDING INTEGRATION', desc: 'SAM proposals + VLM GPU inference serving' },
  { module: 'BACKEND', status: 'PENDING INTEGRATION', desc: 'FastAPI microservices & async batch queue' }
];

export default function ProjectStatus() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-widest text-white/70 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF2A55]" />
            Deployment Tracking
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Project Status
          </h2>
          <p className="text-sm text-white/60 mt-2">
            Verified development milestone status across presentation, evaluation, and planned compute layers.
          </p>
        </div>

        {/* 6 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STATUS_ENTRIES.map((entry, idx) => {
            const isReady = entry.status === 'READY';

            return (
              <motion.div
                key={entry.module}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                className="rounded-2xl bg-[#0E060A] border border-white/[0.08] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-white tracking-wider">
                      {entry.module}
                    </span>
                    {isReady ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/30 text-white font-mono text-[10px] font-bold tracking-wider">
                        <CheckCircle2 className="w-3 h-3" />
                        READY
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-crimson/10 border border-crimson/30 text-crimson font-mono text-[10px] font-bold tracking-wider">
                        <Clock className="w-3 h-3" />
                        PENDING
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-white/60 leading-relaxed font-sans">
                    {entry.desc}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-white/[0.04] text-[9px] font-mono text-white/30 flex items-center justify-between">
                  <span>AUDIT STATUS</span>
                  <span className={isReady ? 'text-white/80' : 'text-crimson/80'}>
                    {entry.status}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
