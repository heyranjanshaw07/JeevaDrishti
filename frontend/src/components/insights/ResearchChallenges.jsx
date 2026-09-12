import React from 'react';
import { motion } from 'framer-motion';
import { Microscope, Users, Shuffle, EyeOff, AlertCircle } from 'lucide-react';

const CHALLENGES = [
  {
    num: '01',
    title: 'Fine-Grained Appearance',
    icon: Microscope,
    desc: 'Subtle intracellular textures, nuclear-to-cytoplasmic ratios, and border distinctions require high-resolution discrimination often lost in standard downsampled vision backbones.',
    note: 'Morphological subtlety'
  },
  {
    num: '02',
    title: 'Dense Cellular Scenes',
    icon: Users,
    desc: 'Hundreds of overlapping or clustered cells within a single field of view create severe occlusion and ambiguous boundary delineation.',
    note: 'Spatial clustering'
  },
  {
    num: '03',
    title: 'Domain Shift',
    icon: Shuffle,
    desc: 'Variations in staining reagents (Giemsa, Wright, fluorescent markers), optical lenses, magnification factors, and illumination introduce stark visual disparities across slide preparations.',
    note: 'Optical preparation variance'
  },
  {
    num: '04',
    title: 'Previously Unseen Categories',
    icon: EyeOff,
    desc: 'Clinical environments encounter novel pathologies, rare cellular anomalies, or specimen types entirely absent from the model’s pretraining distribution.',
    note: 'Open-vocabulary challenge'
  }
];

export default function ResearchChallenges() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-widest text-white/70 mb-3">
            <AlertCircle className="w-3.5 h-3.5 text-[#FF2A55]" />
            Domain Complexities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Challenges in Microscopy Detection
          </h2>
          <p className="text-sm text-white/60 mt-2">
            Key physical and computational hurdles encountered when detecting cellular structures with generalist models.
          </p>
        </div>

        {/* 4 Challenge Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CHALLENGES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.07 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl bg-[#0E060A]/80 hover:bg-[#150811] border border-white/[0.08] hover:border-[#FF2A55]/40 p-6 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-[#FF2A55] px-2 py-0.5 rounded bg-[#FF2A55]/10 border border-[#FF2A55]/20">
                      CHALLENGE {item.num}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#170812] border border-white/[0.08] flex items-center justify-center text-white/60 group-hover:text-[#FF2A55] group-hover:border-[#FF2A55]/30 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 tracking-tight group-hover:text-white transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-white/60 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-white/40">
                  <span>{item.note}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A55]/60 group-hover:bg-[#FF2A55]" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
