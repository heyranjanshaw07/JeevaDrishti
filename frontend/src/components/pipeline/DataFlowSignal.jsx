import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileInput,
  Image as ImageIcon,
  Scan,
  Maximize2,
  Cpu,
  Tag,
  Crosshair,
  BarChart2,
  ChevronRight,
  Activity
} from 'lucide-react';

const DATA_FLOW_STEPS = [
  {
    step: '01',
    label: 'INPUT',
    sub: 'Optical Source',
    desc: 'Raw microscopic slide acquisition',
    icon: FileInput
  },
  {
    step: '02',
    label: 'IMAGE',
    sub: 'Preprocessed Tensor',
    desc: 'RGB optical tensor normalized for analysis',
    icon: ImageIcon
  },
  {
    step: '03',
    label: 'PROPOSALS',
    sub: 'SAM Segmentation',
    desc: 'Unsupervised mask generation over structures',
    icon: Scan
  },
  {
    step: '04',
    label: 'REGIONS',
    sub: 'Extracted Crops',
    desc: 'Normalized candidate bounding boxes',
    icon: Maximize2
  },
  {
    step: '05',
    label: 'VLM',
    sub: 'Semantic Reasoning',
    desc: 'Few-shot vision-language contextual scoring',
    icon: Cpu
  },
  {
    step: '06',
    label: 'LABELS',
    sub: 'Class Confidence',
    desc: 'Fine-grained cell category assignment',
    icon: Tag
  },
  {
    step: '07',
    label: 'DETECTIONS',
    sub: 'Structured Geometry',
    desc: 'NMS filtering and final coordinates',
    icon: Crosshair
  },
  {
    step: '08',
    label: 'EVALUATION',
    sub: 'Metric Logging',
    desc: 'Precision, Recall, F1 and IoU assessment',
    icon: BarChart2
  }
];

export default function DataFlowSignal() {
  const [activeStep, setActiveStep] = useState(null);

  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] bg-[#060205] overflow-hidden">
      {/* Background signal wire effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#ff2a5508_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-widest text-white/70 mb-3">
              <Activity className="w-3.5 h-3.5 text-[#FF2A55] animate-pulse" />
              End-to-End Data Lifecycle
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Data Flow Sequence
            </h2>
            <p className="text-sm text-white/60 mt-2 max-w-xl">
              From raw optical slide ingestion to structured cell detections and validation metrics.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-white/50 bg-[#0E060A] px-3.5 py-2 rounded-lg border border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-[#FF2A55] animate-ping inline-block mr-1" />
            <span>Continuous Pipeline Stream</span>
          </div>
        </div>

        {/* Technical Sequence Bar (Desktop horizontal line / wrap) */}
        <div className="relative rounded-2xl bg-[#0A0407] border border-white/[0.08] p-6 sm:p-8">
          {/* Animated Crimson Signal Track (Behind nodes) */}
          <div className="hidden xl:block absolute top-[68px] left-12 right-12 h-[2px] bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full w-40 bg-gradient-to-r from-transparent via-[#FF2A55] to-transparent"
              animate={{ x: ['-100%', '800%'] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'linear' }}
            />
          </div>

          {/* Grid of Steps */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4 sm:gap-6 relative">
            {DATA_FLOW_STEPS.map((item, idx) => {
              const Icon = item.icon;
              const isHovered = activeStep === idx;

              return (
                <div
                  key={item.step}
                  onMouseEnter={() => setActiveStep(idx)}
                  onMouseLeave={() => setActiveStep(null)}
                  className="relative flex flex-col items-center text-center group cursor-pointer"
                >
                  {/* Step Node Circle */}
                  <div
                    className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 mb-3 border ${
                      isHovered
                        ? 'bg-[#FF2A55]/20 border-[#FF2A55] scale-110 shadow-lg shadow-[#FF2A55]/30'
                        : 'bg-[#12070D] border-white/[0.08] group-hover:border-[#FF2A55]/50 group-hover:bg-[#1A0A13]'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 transition-colors ${
                        isHovered ? 'text-[#FF2A55]' : 'text-white/70 group-hover:text-white'
                      }`}
                    />

                    {/* Step Number Tag */}
                    <span className="absolute -bottom-2 font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#060205] border border-white/[0.1] text-white/60">
                      {item.step}
                    </span>
                  </div>

                  {/* Label */}
                  <h3
                    className={`text-xs font-bold font-mono tracking-wider transition-colors ${
                      isHovered ? 'text-[#FF2A55]' : 'text-white'
                    }`}
                  >
                    {item.label}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-[11px] text-white/50 font-medium mt-0.5">{item.sub}</p>

                  {/* Hover tooltip explanation */}
                  <div
                    className={`mt-2 text-[10px] text-white/40 leading-snug transition-opacity duration-200 hidden sm:block ${
                      isHovered ? 'opacity-100 text-white/70' : 'opacity-50'
                    }`}
                  >
                    {item.desc}
                  </div>

                  {/* Mobile connector icon for between items */}
                  {idx < DATA_FLOW_STEPS.length - 1 && (
                    <div className="xl:hidden absolute -right-2 top-5 transform translate-x-1/2 text-white/20">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Flow Inspector Footer */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/50">
            <div className="flex items-center gap-2">
              <span className="text-white/30">CURRENT SPECIFICATION:</span>
              <span className="text-white font-medium">Deterministic pipeline serialization</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A55]" />
                Zero parameters altered at inference
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                Auditable coordinate registry
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
