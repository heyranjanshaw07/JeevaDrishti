import React from 'react';
import { motion } from 'framer-motion';
import { Layout, Server, Scan, Cpu, Database, Layers, Info } from 'lucide-react';

const TECH_TIERS = [
  {
    tier: 'FRONTEND',
    icon: Layout,
    status: 'Client Suite',
    technologies: [
      'React',
      'Vite',
      'Tailwind CSS',
      'Framer Motion',
      'Three.js / React Three Fiber',
      'Recharts',
      'Lucide React'
    ],
    desc: 'High-performance reactive user interface, 3D biological iris rendering, interactive microscopy slide explorer, and research benchmark visualizations.'
  },
  {
    tier: 'BACKEND',
    icon: Server,
    status: 'Planned Service',
    technologies: ['FastAPI', 'Pydantic', 'Uvicorn Asynchronous Gateway'],
    desc: 'Lightweight asynchronous REST API specification for high-throughput cytology slide dispatch and coordinate streaming.'
  },
  {
    tier: 'VISION',
    icon: Scan,
    status: 'Planned Layer',
    technologies: ['SAM (Segment Anything Model)', 'Class-Agnostic Object Proposals'],
    desc: 'Unsupervised spatial segmentation pipeline identifying candidate cell membrane boundaries from complex optical backgrounds.'
  },
  {
    tier: 'REASONING',
    icon: Cpu,
    status: 'Planned Layer',
    technologies: ['Vision-Language Model', 'In-Context Multimodal Prompting'],
    desc: 'Contextual reasoning engine evaluating proposal image crops against target biomedical categories with zero or few visual exemplars.'
  },
  {
    tier: 'DATA / EVALUATION',
    icon: Database,
    status: 'Standard Suite',
    technologies: ['Micro-OD Benchmark', 'BCCD · BBBC · LIVECell · NIH-3T3'],
    desc: 'Rigorous standardized benchmark protocol for evaluating zero-shot and few-shot detection across multi-modal optical microscopy.'
  }
];

export default function TechnologyStack() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] bg-[#060205] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-widest text-white/70 mb-3">
            <Layers className="w-3.5 h-3.5 text-[#FF2A55]" />
            Full Stack Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Technology
          </h2>
          <p className="text-sm text-white/60 mt-2">
            The multi-layer stack powering the JeevaDrishti research platform and evaluation environment.
          </p>
        </div>

        {/* 5 Tech Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {TECH_TIERS.map((tier, idx) => {
            const Icon = tier.icon;
            const isFrontend = tier.tier === 'FRONTEND';

            return (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.07 }}
                className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between border transition-all ${
                  isFrontend
                    ? 'bg-gradient-to-b from-[#180812] to-[#0A0207] border-[#FF2A55]/40 md:col-span-2 lg:col-span-2'
                    : 'bg-[#0E060A] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-[#FF2A55] px-2.5 py-0.5 rounded bg-[#FF2A55]/10 border border-[#FF2A55]/20">
                      {tier.tier}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#170812] border border-white/[0.08] flex items-center justify-center text-white/70">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-xs text-white/60 leading-relaxed font-sans mb-4">
                    {tier.desc}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {tier.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono text-white/80"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-white/40">
                  <span>SPECIFICATION</span>
                  <span>{tier.status}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Informational Architecture Note */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 flex items-center gap-3 text-xs font-mono text-white/50">
          <Info className="w-4 h-4 text-[#FF2A55] shrink-0" />
          <span>
            Architecture note: Technology specifications reflect the documented hybrid design. AI inference and backend endpoints are staged for modular integration following the frontend milestone.
          </span>
        </div>
      </div>
    </section>
  );
}
