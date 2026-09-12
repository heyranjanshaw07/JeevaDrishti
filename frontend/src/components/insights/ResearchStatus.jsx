import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ShieldCheck, Database, Layout, Scan, Cpu, Server } from 'lucide-react';

const STATUS_ITEMS = [
  {
    category: 'RESEARCH DATA',
    name: 'Micro-OD Available',
    status: 'READY',
    desc: 'Standardized 252 microscopy image repository and ground truth annotations.',
    icon: Database
  },
  {
    category: 'BENCHMARK INTERFACE',
    name: 'Research Protocol Console',
    status: 'READY',
    desc: 'Zero-shot and few-shot evaluation metrics view and experiment matrix.',
    icon: Layout
  },
  {
    category: 'ANALYSIS UI',
    name: 'Microscopy Analysis Suite',
    status: 'READY',
    desc: 'Interactive slide upload, ROI inspection, and detection viewer.',
    icon: Scan
  },
  {
    category: 'AI INFERENCE',
    name: 'SAM + VLM Inference Engine',
    status: 'PENDING',
    desc: 'Live model weight serving and dynamic GPU batch processing pipeline.',
    icon: Cpu
  },
  {
    category: 'BACKEND',
    name: 'FastAPI Microservice Engine',
    status: 'PENDING',
    desc: 'Asynchronous task queue, storage persistence, and telemetry dispatch.',
    icon: Server
  }
];

export default function ResearchStatus() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] bg-[#060205] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-widest text-white/70 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF2A55]" />
            Deployment Matrix
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Research Environment Status
          </h2>
          <p className="text-sm text-white/60 mt-2">
            Current operational readiness across dataset modules, client interfaces, and inference pipelines.
          </p>
        </div>

        {/* 5 Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {STATUS_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isReady = item.status === 'READY';

            return (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                className="rounded-2xl bg-[#0E060A] border border-white/[0.08] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#170812] border border-white/[0.08] flex items-center justify-center text-[#FF2A55]">
                      <Icon className="w-4 h-4" />
                    </div>
                    {isReady ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/30 text-white font-mono text-[10px] font-bold tracking-wider">
                        <CheckCircle2 className="w-3 h-3" />
                        READY
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-crimson/10 border border-crimson/30 text-crimson font-mono text-[10px] font-bold tracking-wider">
                        <Clock className="w-3 h-3" />
                        PENDING
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1">
                    {item.category}
                  </span>

                  <h3 className="text-sm font-bold text-white tracking-tight mb-2">
                    {item.name}
                  </h3>

                  <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-white/[0.04] text-[9px] font-mono text-white/30">
                  VERIFIED DEPLOYMENT LOG
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
