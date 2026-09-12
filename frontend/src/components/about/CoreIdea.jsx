import React from 'react';
import { motion } from 'framer-motion';
import { Eye, BrainCircuit, Target, ArrowRight, Sparkles } from 'lucide-react';

const PILLARS = [
  {
    step: '01',
    name: 'SEE',
    sub: 'Visual Extraction',
    icon: Eye,
    body: 'Extract meaningful visual regions from microscopy imagery.',
    desc: 'Unsupervised boundary discovery with SAM generates class-agnostic proposals across dense and occluded cell fields.'
  },
  {
    step: '02',
    name: 'UNDERSTAND',
    sub: 'Multimodal Reasoning',
    icon: BrainCircuit,
    body: 'Use vision-language reasoning to interpret candidate regions.',
    desc: 'In-context prompt conditioning evaluates candidate patches against clinical target categories with few-shot exemplars.'
  },
  {
    step: '03',
    name: 'DETECT',
    sub: 'Structured Geometry',
    icon: Target,
    body: 'Convert visual interpretation into structured cell detections.',
    desc: 'Candidate bounding box coordinates fused with semantic class predictions and confidence scores ready for inspection.'
  }
];

export default function CoreIdea() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A55]/10 border border-[#FF2A55]/30 text-xs font-mono uppercase tracking-widest text-[#FF2A55] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Theoretical Framework
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            The Idea Behind JeevaDrishti
          </h2>
          <p className="text-sm text-white/60 mt-2">
            A three-phase paradigm connecting spatial seeing with semantic understanding and geometric detection.
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl bg-[#0E060A] border border-white/[0.08] hover:border-[#FF2A55]/40 p-6 sm:p-8 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono font-bold text-[#FF2A55] px-2.5 py-1 rounded bg-[#FF2A55]/10 border border-[#FF2A55]/20">
                      {pillar.step} — {pillar.name}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-[#170812] border border-white/[0.08] flex items-center justify-center text-white/70 group-hover:text-[#FF2A55] group-hover:border-[#FF2A55]/30 transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-xl font-black font-mono text-white tracking-tight mb-3">
                    {pillar.name}
                  </h3>

                  <p className="text-sm font-semibold text-white/90 leading-snug mb-3 font-sans">
                    &ldquo;{pillar.body}&rdquo;
                  </p>

                  <p className="text-xs text-white/60 leading-relaxed font-sans">
                    {pillar.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-white/40 flex items-center justify-between">
                  <span>{pillar.sub}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FF2A55] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Visual Connector: SEE → UNDERSTAND → DETECT with Animated Crimson Movement */}
        <div className="rounded-2xl bg-[#0A0408] border border-white/[0.08] p-5 sm:p-6 relative overflow-hidden">
          {/* Animated Crimson Track (Behind labels) */}
          <div className="hidden sm:block absolute top-1/2 left-16 right-16 h-[2px] -translate-y-1/2 bg-white/[0.06] overflow-hidden pointer-events-none">
            <motion.div
              className="h-full w-32 bg-gradient-to-r from-transparent via-[#FF2A55] to-transparent shadow-[0_0_10px_#FF2A55]"
              animate={{ x: ['-100%', '800%'] }}
              transition={{ repeat: Infinity, duration: 4.0, ease: 'linear' }}
            />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-around gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF2A55] ring-4 ring-[#FF2A55]/20" />
              <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider">
                SEE
              </span>
            </div>

            <div className="text-[#FF2A55] font-mono text-sm hidden sm:block">→</div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF2A55] ring-4 ring-[#FF2A55]/20" />
              <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider">
                UNDERSTAND
              </span>
            </div>

            <div className="text-[#FF2A55] font-mono text-sm hidden sm:block">→</div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF2A55] ring-4 ring-[#FF2A55]/20" />
              <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider">
                DETECT
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
