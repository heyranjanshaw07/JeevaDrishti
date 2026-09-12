import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scan, Cpu, Crosshair, ArrowRight, GitFork, ArrowDownRight, Layers } from 'lucide-react';

export default function HybridInsight() {
  const navigate = useNavigate();

  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] bg-gradient-to-b from-[#060205] via-[#0A0307] to-[#060205] overflow-hidden">
      {/* Background radial crimson glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#FF2A55]/07 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A55]/10 border border-[#FF2A55]/30 text-xs font-mono uppercase tracking-widest text-[#FF2A55] mb-3">
            <GitFork className="w-3.5 h-3.5" />
            Decoupled Vision Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Why Separate Seeing From Reasoning?
          </h2>
          <p className="text-sm text-white/60 mt-2 max-w-2xl">
            By delegating spatial boundary segmentation to class-agnostic object proposals and semantic category reasoning to a vision-language model, JeevaDrishti bypasses fine-grained boundary failure modes.
          </p>
        </div>

        {/* 3 Interconnected Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative items-stretch mb-10">
          {/* Pillar 1: Object Proposals (Left) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl bg-[#0E060A] border border-white/[0.08] hover:border-white/20 p-6 sm:p-7 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#170812] border border-white/[0.08] flex items-center justify-center text-[#FF2A55] mb-5">
                <Scan className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1">
                Phase I: Spatial Localization
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                OBJECT PROPOSALS
              </h3>
              <p className="text-sm font-mono text-[#FF2A55] mb-4">
                &ldquo;Where might the relevant objects be?&rdquo;
              </p>
              <p className="text-xs text-white/60 leading-relaxed font-sans">
                Generates class-agnostic candidate segmentation masks across high-contrast biological membranes without needing prior semantic classification.
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-white/40 flex items-center justify-between">
              <span>SAM Proposal Backbone</span>
              <span className="text-white/60">Spatial Prior</span>
            </div>
          </motion.div>

          {/* Pillar 2: Vision-Language Reasoning (Right) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="rounded-2xl bg-[#0E060A] border border-white/[0.08] hover:border-white/20 p-6 sm:p-7 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#170812] border border-white/[0.08] flex items-center justify-center text-[#FF2A55] mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1">
                Phase II: Semantic Inference
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                VISION-LANGUAGE REASONING
              </h3>
              <p className="text-sm font-mono text-[#FF2A55] mb-4">
                &ldquo;What visual category best describes this region?&rdquo;
              </p>
              <p className="text-xs text-white/60 leading-relaxed font-sans">
                Evaluates cropped candidate regions in-context against target textual labels and exemplar shots to determine cell category.
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-white/40 flex items-center justify-between">
              <span>VLM Reasoning Engine</span>
              <span className="text-white/60">Semantic Prior</span>
            </div>
          </motion.div>

          {/* Pillar 3: Final Output (Cell Detection) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="rounded-2xl bg-gradient-to-b from-[#180812] to-[#0A0207] border-2 border-[#FF2A55]/50 shadow-xl shadow-[#FF2A55]/15 p-6 sm:p-7 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FF2A55]/20 border border-[#FF2A55]/40 flex items-center justify-center text-[#FF2A55] mb-5">
                <Crosshair className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF2A55] font-semibold block mb-1">
                Unified Synthesis
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                CELL DETECTION
              </h3>
              <p className="text-sm font-mono text-white mb-4">
                &ldquo;Structured candidate + category&rdquo;
              </p>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                Calibrated spatial bounding coordinates fused with semantic class assignments and confidence scores ready for clinical inspection.
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-white/[0.08] text-[11px] font-mono text-[#FF2A55] flex items-center justify-between font-semibold">
              <span>Structured Detection</span>
              <span>Final Target</span>
            </div>
          </motion.div>
        </div>

        {/* Animated Connector Flow Banner */}
        <div className="rounded-2xl bg-[#090306] border border-white/[0.08] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-white/[0.04] text-white/80 border border-white/10">
              SAM / Object Proposals
            </span>
            <span className="text-[#FF2A55]">→</span>
            <span className="px-2.5 py-1 rounded bg-white/[0.04] text-white/80 border border-white/10">
              Candidate Regions
            </span>
            <span className="text-[#FF2A55]">→</span>
            <span className="px-2.5 py-1 rounded bg-white/[0.04] text-white/80 border border-white/10">
              VLM Classification
            </span>
            <span className="text-[#FF2A55]">→</span>
            <span className="px-2.5 py-1 rounded bg-[#FF2A55]/15 text-[#FF2A55] border border-[#FF2A55]/30 font-semibold">
              Cell Detection
            </span>
          </div>

          <button
            onClick={() => navigate('/pipeline')}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF2A55] hover:bg-[#DC2626] text-white text-xs font-semibold tracking-wide shadow-lg shadow-[#FF2A55]/25 transition-all"
          >
            Explore Pipeline
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
