import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, BookOpen, Code, Database, Globe, Compass } from 'lucide-react';

const RESOURCES = [
  {
    type: 'Project',
    name: 'Micro-OD Benchmark Project',
    url: 'https://scslabisu.github.io/Micro-OD/',
    desc: 'Official benchmark website documenting datasets, annotation standards, and experimental protocols.',
    icon: Globe
  },
  {
    type: 'Paper',
    name: 'In-Context Adaptation of VLMs for Few-Shot Cell Detection in Optical Microscopy',
    url: 'https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2026.1761903/full',
    desc: 'Published peer-reviewed scientific paper exploring vision-language foundation models in optical cytology.',
    icon: BookOpen
  },
  {
    type: 'Code',
    name: 'VLM_Det Repository',
    url: 'https://github.com/shrn2/VLM_Det',
    desc: 'Official open-source research implementation repository and model evaluation codebase.',
    icon: Code
  },
  {
    type: 'Dataset',
    name: 'Micro-OD on Hugging Face',
    url: 'https://huggingface.co/datasets/stumbledparams/Micro-OD',
    desc: 'Publicly hosted benchmark dataset hub containing processed image tensors and bounding annotations.',
    icon: Database
  }
];

export default function ResearchResources() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] bg-[#060205] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A55]/10 border border-[#FF2A55]/30 text-xs font-mono uppercase tracking-widest text-[#FF2A55] mb-3">
            <ExternalLink className="w-3.5 h-3.5" />
            Verified Citations
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Research Resources
          </h2>
          <p className="text-sm text-white/60 mt-2">
            Direct links to official project pages, published literature, source code, and dataset repositories.
          </p>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {RESOURCES.map((res, idx) => {
            const Icon = res.icon;
            return (
              <motion.a
                key={res.type}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                whileHover={{ y: -3 }}
                className="rounded-2xl bg-[#0E060A] hover:bg-[#140810] border border-white/[0.08] hover:border-[#FF2A55]/50 p-6 sm:p-7 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-[#FF2A55] px-2.5 py-1 rounded bg-[#FF2A55]/10 border border-[#FF2A55]/20">
                      {res.type}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#170812] border border-white/[0.08] flex items-center justify-center text-white/70 group-hover:text-[#FF2A55] group-hover:border-[#FF2A55]/30 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-2 group-hover:text-white transition-colors leading-snug">
                    {res.name}
                  </h3>

                  <p className="text-xs text-white/60 leading-relaxed font-sans mb-4">
                    {res.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <span className="text-white/40 truncate max-w-xs">{res.url}</span>
                  <span className="inline-flex items-center gap-1 text-[#FF2A55] font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
                    Open Resource
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
