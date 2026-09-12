import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Database, Globe, ShieldCheck } from 'lucide-react';

const CREDIT_ITEMS = [
  {
    role: 'Research & Development',
    entity: 'JeevaDrishti Research Team',
    desc: 'Adaptive vision-language modeling, hybrid proposal pipeline design, and front-end research interface architecture.',
    icon: Users
  },
  {
    role: 'Dataset Foundation',
    entity: 'Micro-OD Benchmark Suite',
    desc: 'Standardized microscopy object detection benchmark compiling BBBC, BCCD, LIVECell, and NIH-3T3 research cohorts.',
    icon: Database
  },
  {
    role: 'Technology & Infrastructure',
    entity: 'Open-Source Research Ecosystem',
    desc: 'Built upon foundation work in multimodal transformers, Segment Anything Model (SAM), PyTorch, React, Vite, and the scientific Python community.',
    icon: Globe
  }
];

export default function Credits() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-widest text-white/70 mb-3">
            <Heart className="w-3.5 h-3.5 text-[#FF2A55]" />
            Acknowledgements
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Credits & Acknowledgements
          </h2>
          <p className="text-sm text-white/60 mt-2">
            Recognizing the open-source frameworks, benchmark curators, and foundational research community.
          </p>
        </div>

        {/* Credits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CREDIT_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.role}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.1 }}
                className="rounded-2xl bg-[#0E060A] border border-white/[0.08] p-6 sm:p-8 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#170812] border border-white/[0.08] flex items-center justify-center text-[#FF2A55] mb-5">
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF2A55] font-semibold block mb-1">
                    {item.role}
                  </span>

                  <h3 className="text-lg font-bold text-white tracking-tight mb-3">
                    {item.entity}
                  </h3>

                  <p className="text-xs text-white/60 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-white/[0.04] text-[10px] font-mono text-white/30">
                  VERIFIED CONTRIBUTION RECORD
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
