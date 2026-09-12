import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, BarChart3, ArrowRight, Binary, Layers, ShieldCheck, Microscope } from 'lucide-react';

const RESEARCH_STATS = [
  {
    val: '252',
    label: 'Microscopy Images',
    sub: 'Full-resolution optical slides',
    icon: Microscope
  },
  {
    val: '4',
    label: 'Source Datasets',
    sub: 'BCCD, Blood Cell, Bone Marrow, Malaria',
    icon: Database
  },
  {
    val: '0 / 1 / 3 / 6',
    label: 'Shot Configurations',
    sub: 'Zero-shot to full few-shot context',
    icon: Layers
  },
  {
    val: '5,551',
    label: 'Annotated Test Cells',
    sub: 'Verified ground truth bounding boxes',
    icon: Binary
  }
];

export default function ResearchConnection() {
  const navigate = useNavigate();

  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] bg-gradient-to-b from-[#060205] via-[#0B0408] to-[#060205] overflow-hidden">
      {/* Background ambient crimson */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#FF2A55]/05 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A55]/10 border border-[#FF2A55]/30 text-xs font-mono uppercase tracking-widest text-[#FF2A55] mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Research Benchmark
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            Designed Around Micro-OD
          </h2>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed max-w-2xl mx-auto">
            The JeevaDrishti vision pipeline is grounded in the standardized Micro-OD benchmark, establishing rigorous evaluation for zero-shot and few-shot cellular detection across disparate microscopy modalities.
          </p>
        </div>

        {/* Compact Research Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {RESEARCH_STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.07 }}
                className="rounded-2xl bg-[#0E060A]/90 border border-white/[0.08] hover:border-[#FF2A55]/40 p-6 text-center transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#170912] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 group-hover:border-[#FF2A55]/30 transition-colors">
                  <Icon className="w-5 h-5 text-[#FF2A55]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight group-hover:text-[#FF2A55] transition-colors">
                  {stat.val}
                </div>
                <div className="text-sm font-semibold text-white/90 mt-1">{stat.label}</div>
                <div className="text-xs text-white/40 mt-1 font-mono">{stat.sub}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Call to Action Container */}
        <div className="rounded-2xl bg-[#0F070E] border border-white/[0.08] p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Ready to Explore Benchmark Evaluation?
            </h3>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Inspect test metrics, class distributions, and standardized optical evaluation protocols.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/benchmark')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF2A55] hover:bg-[#DC2626] text-white font-semibold text-sm shadow-lg shadow-[#FF2A55]/25 transition-all transform hover:-translate-y-0.5"
            >
              <BarChart3 className="w-4 h-4" />
              Open Benchmark
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/dataset')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/80 hover:text-white border border-white/10 font-semibold text-sm transition-all"
            >
              <Database className="w-4 h-4" />
              Explore Dataset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
