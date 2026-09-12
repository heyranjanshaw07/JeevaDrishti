import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Microscope,
  Scan,
  Crop,
  Cpu,
  Crosshair,
  BarChart2,
  ArrowRight,
  GitFork,
  ChevronDown
} from 'lucide-react';

import PipelineSignal from '@/components/ui/PipelineSignal';

const PIPELINE_STAGES = [
  { step: '01', title: 'Microscopy Image', icon: Microscope, desc: 'Optical or fluorescence slide ingestion' },
  { step: '02', title: 'SAM / Object Proposals', icon: Scan, desc: 'Class-agnostic spatial boundary proposals' },
  { step: '03', title: 'Candidate Regions', icon: Crop, desc: 'Extracted candidate cell crops' },
  { step: '04', title: 'Vision-Language Classification', icon: Cpu, desc: 'Few-shot multimodal verification' },
  { step: '05', title: 'Cell Detection', icon: Crosshair, desc: 'Structured coordinates and class labels' },
  { step: '06', title: 'Evaluation', icon: BarChart2, desc: 'Standardized Micro-OD benchmark scoring' }
];

export default function AboutPipeline() {
  const navigate = useNavigate();

  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] bg-[#060205] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-widest text-white/70 mb-3">
              <GitFork className="w-3.5 h-3.5 text-[#FF2A55]" />
              Architectural Pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              How It Works
            </h2>
            <p className="text-sm text-white/60 mt-2 max-w-xl">
              From raw optical slide ingestion to structured cell detections and validation metrics.
            </p>
          </div>

          <button
            onClick={() => navigate('/pipeline')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF2A55] hover:bg-[#DC2626] text-white font-semibold text-xs tracking-wider uppercase font-mono shadow-lg shadow-[#FF2A55]/25 transition-all self-start md:self-auto"
          >
            View Full Pipeline
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Traveling Crimson Signal Bar */}
        <PipelineSignal className="mb-8" />

        {/* 6 Stage Sequential Visual */}
        <div className="rounded-2xl bg-[#0E060A] border border-white/[0.08] p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 relative">
            {PIPELINE_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isLast = idx === PIPELINE_STAGES.length - 1;

              return (
                <motion.div
                  key={stage.step}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                  className="relative p-5 rounded-xl bg-[#140810] border border-white/[0.06] hover:border-[#FF2A55]/40 transition-all flex flex-col justify-between group text-center items-center"
                >
                  <span className="text-[10px] font-mono text-[#FF2A55] font-bold px-2 py-0.5 rounded bg-[#FF2A55]/10 border border-[#FF2A55]/20 mb-3">
                    {stage.step}
                  </span>

                  <div className="w-11 h-11 rounded-xl bg-[#1D0A16] border border-white/[0.08] flex items-center justify-center text-white/80 group-hover:text-[#FF2A55] transition-colors mb-3">
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-xs font-mono font-bold text-white mb-1.5 leading-snug">
                    {stage.title}
                  </h3>

                  <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                    {stage.desc}
                  </p>

                  {/* Desktop connector arrow */}
                  {!isLast && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-[#FF2A55]/50 pointer-events-none">
                      →
                    </div>
                  )}

                  {/* Mobile connector down arrow */}
                  {!isLast && (
                    <div className="lg:hidden mt-3 text-[#FF2A55]/50">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
