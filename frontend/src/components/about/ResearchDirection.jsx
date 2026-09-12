import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Eye, BrainCircuit, GitFork } from 'lucide-react';

const DIRECTIONS = [
  {
    title: 'ADAPTIVE VISION',
    tag: 'Visual In-Context Support',
    icon: Eye,
    body: 'Investigating how visual context can support detection of unfamiliar microscopy categories.',
    desc: 'Exploring how few-shot reference anchors reduce ambiguity across diverse staining, lighting, and preparation protocols without model fine-tuning.'
  },
  {
    title: 'MULTIMODAL REASONING',
    tag: 'Semantic Interpretation',
    icon: BrainCircuit,
    body: 'Exploring the role of vision-language models in interpreting candidate microscopic regions.',
    desc: 'Examining the linguistic and semantic grounding capabilities of foundation models when confronted with granular cytology phenotypes.'
  },
  {
    title: 'HYBRID DETECTION',
    tag: 'Decoupled Architecture',
    icon: GitFork,
    body: 'Combining object proposals with semantic reasoning rather than relying on a single detection mechanism.',
    desc: 'Bypassing fine-grained boundary hallucination by partitioning localization into proposal generation and classification into multimodal inference.'
  }
];

export default function ResearchDirection() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] bg-[#060205] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A55]/10 border border-[#FF2A55]/30 text-xs font-mono uppercase tracking-widest text-[#FF2A55] mb-3">
            <Compass className="w-3.5 h-3.5" />
            Strategic Exploration
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Research Direction
          </h2>
          <p className="text-sm text-white/60 mt-2">
            Investigating foundational questions in biomedical visual reasoning without unsupported performance claims.
          </p>
        </div>

        {/* 3 Direction Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DIRECTIONS.map((dir, idx) => {
            const Icon = dir.icon;
            return (
              <motion.div
                key={dir.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.1 }}
                className="rounded-2xl bg-[#0E060A] border border-white/[0.08] hover:border-white/20 p-6 sm:p-8 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-mono text-[#FF2A55] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-[#FF2A55]/10 border border-[#FF2A55]/20">
                      {dir.tag}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#170812] border border-white/[0.08] flex items-center justify-center text-[#FF2A55]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold font-mono text-white tracking-tight mb-3">
                    {dir.title}
                  </h3>

                  <p className="text-sm font-semibold text-white/90 leading-snug mb-3 font-sans">
                    &ldquo;{dir.body}&rdquo;
                  </p>

                  <p className="text-xs text-white/60 leading-relaxed font-sans">
                    {dir.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-white/40 flex items-center justify-between">
                  <span>RESEARCH TRAJECTORY</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A55]" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
