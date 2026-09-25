import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Eye, Layers, Compass, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const SHOT_CONFIGS = [
  {
    id: '0-shot',
    shots: 0,
    title: '0 Shot',
    subtitle: 'Zero-shot detection',
    badge: 'Semantic Prior Only',
    tagline: 'Generalized semantic zero-shot reasoning',
    concept:
      'The vision-language model evaluates proposed microscopy regions relying solely on natural language cellular descriptions, morphological priors, and pre-trained domain semantics without any exemplar images in the prompt context.',
    properties: [
      { label: 'Exemplar Memory', val: 'None (Pure linguistic & visual prior)' },
      { label: 'Inductive Bias', val: 'Base VLM pretraining representation' },
      { label: 'Cold-Start Viability', val: 'Immediate deployment across novel specimens' },
      { label: 'Computational Overhead', val: 'Minimal token usage per candidate patch' }
    ]
  },
  {
    id: '6-shot',
    shots: 6,
    title: '6 Shots',
    subtitle: 'Six visual examples',
    badge: 'Maximum Context',
    tagline: 'Deep visual calibration across the optical field',
    concept:
      'Six representative exemplar patches deliver broad coverage across optical focal depths, high-density cell clusters, partial occlusions, and staining inconsistencies across distinct preparation protocols.',
    properties: [
      { label: 'Exemplar Memory', val: '6 reference patches per target class' },
      { label: 'Inductive Bias', val: 'Comprehensive morphological envelope' },
      { label: 'Cold-Start Viability', val: 'Requires diverse curated ground-truth gallery' },
      { label: 'Computational Overhead', val: 'Expanded context window consumption' }
    ]
  }
];

export default function FewShotFlow() {
  const [selectedShot, setSelectedShot] = useState(SHOT_CONFIGS[0]);

  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#FF2A55]/05 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A55]/10 border border-[#FF2A55]/30 text-xs font-mono uppercase tracking-widest text-[#FF2A55] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Adaptive In-Context Learning
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            Context Changes the Vision
          </h2>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
            By shifting from zero-shot evaluation to guided few-shot prompts, the vision-language model anchors its morphological understanding to concrete specimen characteristics without parameter fine-tuning.
          </p>
        </div>

        {/* 4 Interactive Shot Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {SHOT_CONFIGS.map((config, index) => {
            const isSelected = selectedShot.id === config.id;
            return (
              <motion.button
                key={config.id}
                onClick={() => setSelectedShot(config)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-5 sm:p-6 rounded-2xl text-left transition-all duration-300 border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#FF2A55]/15 to-[#060205] border-[#FF2A55] shadow-lg shadow-[#FF2A55]/20 ring-1 ring-[#FF2A55]/50'
                    : 'bg-[#0E060A]/80 hover:bg-[#14080F] border-white/[0.08] hover:border-white/20'
                }`}
              >
                {/* Active Indicator pip */}
                {isSelected && (
                  <motion.div
                    layoutId="active-shot-indicator"
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-[#FF2A55] ring-4 ring-[#060205]"
                  />
                )}

                <div>
                  {/* Top Bar: Shots count + Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`text-2xl font-black font-mono tracking-tight ${
                        isSelected ? 'text-[#FF2A55]' : 'text-white'
                      }`}
                    >
                      {config.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? 'border-[#FF2A55]/40 text-[#FF2A55] bg-[#FF2A55]/10'
                          : 'border-white/10 text-white/50 bg-white/[0.02]'
                      }`}
                    >
                      {config.badge}
                    </span>
                  </div>

                  {/* Subtitle */}
                  <h3 className="text-base font-semibold text-white mb-2">{config.subtitle}</h3>
                  <p className="text-xs text-white/50 leading-relaxed mb-4">{config.tagline}</p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <span className={isSelected ? 'text-[#FF2A55]' : 'text-white/40'}>
                    {isSelected ? 'Currently Viewing' : 'Click to Inspect'}
                  </span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isSelected ? 'text-[#FF2A55] translate-x-1' : 'text-white/30'
                    }`}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Conceptual Explanation Panel (No fake metrics) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedShot.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl bg-gradient-to-br from-[#0E060A] via-[#080306] to-[#0E060A] border border-[#FF2A55]/30 p-6 sm:p-8 relative overflow-hidden"
          >
            {/* Subtle corner graphic */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF2A55]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* Left explanation: 7 cols */}
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF2A55]/20 text-[#FF2A55] font-mono text-[11px] uppercase tracking-wider font-semibold">
                    {selectedShot.title} Protocol
                  </span>
                  <span className="text-xs text-white/40 font-mono">In-Context Prompting Configuration</span>
                </div>

                <h4 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">
                  {selectedShot.subtitle}
                </h4>

                <p className="text-sm text-white/70 leading-relaxed mb-6">{selectedShot.concept}</p>

                <div className="flex items-center gap-3 text-xs text-white/50 font-mono bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                  <ShieldCheck className="w-4 h-4 text-[#FF2A55] shrink-0" />
                  <span>
                    Architecture standard: Context is delivered to the VLM reasoning engine at runtime with frozen model parameters.
                  </span>
                </div>
              </div>

              {/* Right technical properties: 5 cols */}
              <div className="lg:col-span-5 bg-[#060205]/90 border border-white/[0.08] rounded-xl p-5 space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-white/40 pb-2 border-b border-white/[0.06] flex items-center justify-between">
                  <span>Configuration Profile</span>
                  <span className="text-[#FF2A55]">{selectedShot.shots} EXEMPLARS</span>
                </div>

                {selectedShot.properties.map((prop, idx) => (
                  <div key={idx} className="flex flex-col gap-0.5 text-xs py-1">
                    <span className="text-white/40 font-mono">{prop.label}</span>
                    <span className="text-white/90 font-medium">{prop.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Compact Requirement Note */}
        <div className="mt-8 text-center">
          <p className="inline-flex items-center gap-2 text-xs font-mono text-white/50 bg-[#0E060A] px-4 py-2 rounded-full border border-white/[0.06]">
            <HelpCircle className="w-3.5 h-3.5 text-[#FF2A55]" />
            Few-shot configuration represents the amount of visual context provided to the vision-language model.
          </p>
        </div>
      </div>
    </section>
  );
}
