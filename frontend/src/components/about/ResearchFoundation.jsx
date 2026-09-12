import React from 'react';
import { motion } from 'framer-motion';
import { Database, Image, Box, Layers, Binary, ShieldCheck } from 'lucide-react';

const STATS = [
  { val: '252', label: 'Microscopy Images', sub: 'Total repository benchmark slides', icon: Image },
  { val: '40', label: 'Example Images', sub: 'Few-shot exemplar support bank', icon: Box },
  { val: '212', label: 'Test Images', sub: 'Dedicated test evaluation set', icon: Layers },
  { val: '5,551', label: 'Annotated Test Cells', sub: 'Verified ground-truth bounding boxes', icon: Binary },
  { val: '4', label: 'Source Datasets', sub: 'Multi-domain optical cohorts', icon: Database }
];

const DATASET_CARDS = [
  {
    name: 'BBBC',
    sub: 'Fluorescent Microscopy',
    testImages: 53,
    testBoxes: '4,000',
    classes: 6,
    desc: 'High-content biological image screening with diverse cytoplasmic markers.'
  },
  {
    name: 'BCCD',
    sub: 'Peripheral Blood Cytology',
    testImages: 53,
    testBoxes: '952',
    classes: 3,
    desc: 'Optical blood smear fields identifying White Blood Cells, Red Blood Cells, and Platelets.'
  },
  {
    name: 'LIVECell',
    sub: 'Phase-Contrast Cytology',
    testImages: 53,
    testBoxes: '223',
    classes: 3,
    desc: 'Label-free optical live-cell imaging capturing high-confluency cell culture morphology.'
  },
  {
    name: 'NIH-3T3',
    sub: 'Brightfield Cell Line',
    testImages: 53,
    testBoxes: '376',
    classes: 3,
    desc: 'Mouse embryonic fibroblast cell lines evaluated under standard brightfield transmission.'
  }
];

export default function ResearchFoundation() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A55]/10 border border-[#FF2A55]/30 text-xs font-mono uppercase tracking-widest text-[#FF2A55] mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Standardized Protocol
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Built Around Micro-OD
          </h2>
          <p className="text-sm text-white/60 mt-2 leading-relaxed">
            Micro-OD provides the benchmark context used by JeevaDrishti to study vision-language cell detection across multiple microscopy sources.
          </p>
        </div>

        {/* 5 Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                className="rounded-2xl bg-[#0E060A] border border-white/[0.08] hover:border-white/20 p-5 text-center flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#170812] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-[#FF2A55]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                    {stat.val}
                  </div>
                  <div className="text-xs font-semibold text-white/90 mt-1">{stat.label}</div>
                </div>
                <div className="text-[10px] font-mono text-white/40 mt-3 pt-2 border-t border-white/[0.04]">
                  {stat.sub}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 4 Compact Dataset Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DATASET_CARDS.map((ds, idx) => (
            <motion.div
              key={ds.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              className="rounded-2xl bg-[#0B0408] border border-white/[0.08] hover:border-[#FF2A55]/40 p-6 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-black font-mono text-white group-hover:text-[#FF2A55] transition-colors">
                    {ds.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] border border-white/10 text-white/50">
                    {ds.sub}
                  </span>
                </div>

                <p className="text-xs text-white/60 leading-relaxed font-sans mb-5">{ds.desc}</p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-white/[0.06] text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Test Images:</span>
                  <span className="text-white font-semibold">{ds.testImages} test images</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Test Boxes:</span>
                  <span className="text-white font-semibold">{ds.testBoxes} test boxes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Classes:</span>
                  <span className="text-[#FF2A55] font-semibold">{ds.classes} classes</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
