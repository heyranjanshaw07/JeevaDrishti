import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Eye, Sparkles } from 'lucide-react';

const CAPABILITIES = [
  {
    title: 'VISUAL PATTERNS',
    subtitle: 'Morphological Extraction',
    icon: Eye,
    body: 'Shape, texture, appearance, and spatial visual evidence.',
    detail: 'Uses low-level and mid-level visual features from candidate proposal crops to characterize cytoplasm, nucleus boundaries, and staining intensity without requiring retraining.'
  },
  {
    title: 'CONTEXT',
    subtitle: 'Exemplar Grounding',
    icon: Sparkles,
    body: 'Examples provide task-specific visual references.',
    detail: 'Supports in-context comparison by conditioning the vision-language prompt on curated support exemplars, helping bridge specimen preparation and optical illumination shifts.'
  },
  {
    title: 'SEMANTIC INTERPRETATION',
    subtitle: 'Multimodal Association',
    icon: BrainCircuit,
    body: 'Vision-language reasoning connects visual regions with cell categories.',
    detail: 'Helps interpret novel cellular phenotypes by aligning candidate optical patches with natural language biomedical definitions and categorical taxonomies.'
  }
];

export default function WhatSystemLearns() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A55]/10 border border-[#FF2A55]/30 text-xs font-mono uppercase tracking-widest text-[#FF2A55] mb-3">
            <BrainCircuit className="w-3.5 h-3.5" />
            Inference Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            What the System Learns
          </h2>
          <p className="text-sm text-white/60 mt-2">
            How visual evidence, contextual support, and semantic grounding converge during adaptive cellular inference.
          </p>
        </div>

        {/* 3 Conceptual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CAPABILITIES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.1 }}
                className="rounded-2xl bg-[#0E060A] border border-white/[0.08] hover:border-white/20 p-6 sm:p-8 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#170812] border border-white/[0.08] flex items-center justify-center text-[#FF2A55] mb-6">
                    <Icon className="w-6 h-6" />
                  </div>

                  <span className="text-[10px] font-mono text-[#FF2A55] font-semibold tracking-wider uppercase block mb-1">
                    {item.subtitle}
                  </span>

                  <h3 className="text-lg font-bold font-mono text-white tracking-tight mb-3">
                    {item.title}
                  </h3>

                  <p className="text-sm font-semibold text-white/90 mb-3 font-sans leading-snug">
                    &ldquo;{item.body}&rdquo;
                  </p>

                  <p className="text-xs text-white/60 leading-relaxed font-sans">
                    {item.detail}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] font-mono text-white/40 flex items-center justify-between">
                  <span>RUNTIME IN-CONTEXT</span>
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
