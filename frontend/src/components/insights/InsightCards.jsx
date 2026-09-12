import React from 'react';
import { motion } from 'framer-motion';
import { Grid, EyeOff, Sparkles, Layers, ArrowUpRight } from 'lucide-react';

const INSIGHTS = [
  {
    num: '01',
    title: 'Microscopy Is Visually Dense',
    icon: Grid,
    highlight: null,
    explanation:
      'Cells can vary in appearance, shape, size, texture, and spatial arrangement. Microscopy images may contain many visually similar objects within a single frame.',
    tag: 'Morphological Complexity'
  },
  {
    num: '02',
    title: 'Zero-Shot Is Challenging',
    icon: EyeOff,
    highlight: null,
    explanation:
      'A model may recognize broad visual concepts while still struggling with domain-specific microscopy patterns and fine-grained cell categories.',
    tag: 'Domain Specificity'
  },
  {
    num: '03',
    title: 'Visual Context Can Help',
    icon: Sparkles,
    highlight: null,
    explanation:
      'Few-shot examples provide additional visual context that can help a vision-language model interpret unfamiliar cell appearances.',
    tag: 'In-Context Grounding'
  },
  {
    num: '04',
    title: 'Proposal + Reasoning',
    icon: Layers,
    highlight: 'Proposal + Reasoning',
    explanation:
      'The hybrid pipeline separates region discovery from semantic classification: object proposals narrow the search space, while the VLM reasons about candidate regions.',
    tag: 'Decoupled Architecture'
  }
];

export default function InsightCards() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-widest text-white/70 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A55]" />
            Foundational Principles
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Core Scientific Insights
          </h2>
          <p className="text-sm text-white/60 mt-2">
            Theoretical motivation driving adaptive vision-language cellular detection.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {INSIGHTS.map((item, idx) => {
            const Icon = item.icon;
            const isHighlighted = !!item.highlight;

            return (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
                className={`relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between border transition-all duration-300 group ${
                  isHighlighted
                    ? 'bg-gradient-to-b from-[#1E0916] via-[#10040B] to-[#0A0207] border-[#FF2A55]/70 ring-1 ring-[#FF2A55]/40 shadow-xl shadow-[#FF2A55]/15'
                    : 'bg-[#0E060A]/90 hover:bg-[#150910] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div>
                  {/* Top Bar: Number + Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        isHighlighted
                          ? 'border-[#FF2A55]/50 text-[#FF2A55] bg-[#FF2A55]/10'
                          : 'border-white/10 text-white/40 bg-white/[0.02]'
                      }`}
                    >
                      INSIGHT {item.num}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isHighlighted
                          ? 'bg-[#FF2A55]/20 text-[#FF2A55] border border-[#FF2A55]/50 group-hover:scale-110'
                          : 'bg-[#180A13] text-white/70 border border-white/[0.08] group-hover:text-white group-hover:border-white/20'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    className={`text-lg font-bold tracking-tight mb-3 ${
                      isHighlighted ? 'text-[#FF2A55]' : 'text-white'
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Explanation */}
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
                    {item.explanation}
                  </p>
                </div>

                {/* Footer Tag */}
                <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                  <span className={isHighlighted ? 'text-[#FF2A55] font-semibold' : 'text-white/40'}>
                    {item.tag}
                  </span>
                  <ArrowUpRight
                    className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                      isHighlighted ? 'text-[#FF2A55]' : 'text-white/30'
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
