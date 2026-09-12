import React from 'react';
import { motion } from 'framer-motion';
import {
  Microscope,
  Scan,
  Crop,
  Cpu,
  Crosshair,
  BarChart2,
  ChevronDown
} from 'lucide-react';

import PipelineSignal from '@/components/ui/PipelineSignal';

const PIPELINE_NODES = [
  {
    step: '01',
    name: 'MICROSCOPY IMAGE',
    desc: 'High-resolution optical tensor ingestion',
    icon: Microscope
  },
  {
    step: '02',
    name: 'OBJECT PROPOSALS',
    desc: 'Unsupervised spatial segmentation via SAM',
    icon: Scan
  },
  {
    step: '03',
    name: 'CANDIDATE REGIONS',
    desc: 'Normalized bounding box RoI crops',
    icon: Crop
  },
  {
    step: '04',
    name: 'VLM REASONING',
    desc: 'In-context few-shot multimodal verification',
    icon: Cpu
  },
  {
    step: '05',
    name: 'CELL DETECTION',
    desc: 'Structured bounding coordinates & classification',
    icon: Crosshair
  },
  {
    step: '06',
    name: 'EVALUATION',
    desc: 'Precision, Recall, F1 and IoU metric assessment',
    icon: BarChart2
  }
];

export default function ResearchPipelineInsight() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] bg-[#060205] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-widest text-white/70 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A55]" />
            Execution Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            The JeevaDrishti Pipeline
          </h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto">
            Sequential progression from raw optical specimen acquisition to calibrated benchmark evaluation.
          </p>
        </div>

        {/* Reusable Traveling Crimson Pipeline Signal */}
        <PipelineSignal className="mb-8" />

        {/* Pipeline Sequence (Desktop Horizontal, Mobile Vertical) */}
        <div className="relative rounded-2xl bg-[#0B0408] border border-white/[0.08] p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6 relative">
            {PIPELINE_NODES.map((node, idx) => {
              const Icon = node.icon;
              const isLast = idx === PIPELINE_NODES.length - 1;

              return (
                <motion.div
                  key={node.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                  className="relative flex flex-col items-center text-center p-5 rounded-xl bg-[#12070E] border border-white/[0.06] hover:border-[#FF2A55]/40 transition-all group"
                >
                  {/* Step Pip */}
                  <span className="text-[10px] font-mono text-[#FF2A55] font-bold px-2 py-0.5 rounded bg-[#FF2A55]/10 border border-[#FF2A55]/20 mb-3">
                    STAGE {node.step}
                  </span>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-[#1A0914] border border-white/[0.08] flex items-center justify-center text-white/80 group-hover:text-[#FF2A55] group-hover:border-[#FF2A55]/30 transition-colors mb-3">
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Node Title */}
                  <h3 className="text-xs font-mono font-extrabold text-white tracking-wider mb-1">
                    {node.name}
                  </h3>

                  {/* Node Description */}
                  <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                    {node.desc}
                  </p>

                  {/* Desktop connector arrow */}
                  {!isLast && (
                    <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-[#FF2A55]/40 pointer-events-none">
                      →
                    </div>
                  )}

                  {/* Mobile connector down arrow */}
                  {!isLast && (
                    <div className="lg:hidden mt-3 text-[#FF2A55]/40">
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
