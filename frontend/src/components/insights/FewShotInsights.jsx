import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Eye, Info, CheckCircle, ArrowRight } from 'lucide-react';

const SHOT_STATES = [
  {
    id: '0-shot',
    label: '0 SHOT',
    subtitle: 'No examples',
    summary: 'The model receives no task-specific visual examples.',
    detail:
      'In the zero-shot regime, the reasoning model relies purely on its general biomedical and linguistic representations to evaluate candidate visual crops without seeing prior reference crops of the target cell class.',
    supportLevel: 'Zero visual anchors (Semantic baseline)'
  },

  {
    id: '6-shot',
    label: '6 SHOTS',
    subtitle: 'Six visual examples',
    summary: 'A larger support set provides more visual context for the task.',
    detail:
      'A six-exemplar support set provides rich coverage of optical depths, clustering densities, and morphological edge-cases, maximizing in-context reasoning without parameter retraining.',
    supportLevel: 'Comprehensive support set (Micro-OD Standard)'
  }
];

export default function FewShotInsights() {
  const [selectedId, setSelectedId] = useState('0-shot');
  const activeState = SHOT_STATES.find((s) => s.id === selectedId) || SHOT_STATES[0];

  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] bg-[#060205] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-[#FF2A55]/05 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A55]/10 border border-[#FF2A55]/30 text-xs font-mono uppercase tracking-widest text-[#FF2A55] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            In-Context Adaptation
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            From Zero Context to Visual Context
          </h2>
          <p className="text-sm text-white/60 mt-2">
            Examining how progressive exemplar support guides the vision-language model without parameter fine-tuning.
          </p>
        </div>

        {/* 4 Interactive State Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {SHOT_STATES.map((state) => {
            const isSelected = state.id === selectedId;

            return (
              <button
                key={state.id}
                onClick={() => setSelectedId(state.id)}
                className={`relative p-5 sm:p-6 rounded-2xl text-left transition-all duration-300 border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#FF2A55]/20 to-[#0A0207] border-[#FF2A55] shadow-lg shadow-[#FF2A55]/20 ring-1 ring-[#FF2A55]'
                    : 'bg-[#0E060A] hover:bg-[#14080F] border-white/[0.08] hover:border-white/20'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="fewshot-insight-indicator"
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#FF2A55] ring-4 ring-[#060205]"
                  />
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                        isSelected ? 'text-[#FF2A55]' : 'text-white'
                      }`}
                    >
                      {state.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-[#FF2A55]/20 text-[#FF2A55] border border-[#FF2A55]/40'
                          : 'bg-white/[0.02] text-white/40 border border-white/10'
                      }`}
                    >
                      {state.subtitle}
                    </span>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed font-sans">{state.summary}</p>
                </div>

                <div className="mt-6 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <span className={isSelected ? 'text-[#FF2A55] font-semibold' : 'text-white/40'}>
                    {isSelected ? 'Active Selection' : 'Inspect Paradigm'}
                  </span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-[#FF2A55] translate-x-0.5' : 'text-white/30'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Explanation Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeState.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl bg-gradient-to-r from-[#0F060C] via-[#080205] to-[#0F060C] border border-[#FF2A55]/30 p-6 sm:p-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#FF2A55] uppercase tracking-wider">
                    {activeState.label} REGIME
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-xs font-mono text-white/50">{activeState.subtitle}</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {activeState.summary}
                </h3>

                <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
                  {activeState.detail}
                </p>
              </div>

              <div className="shrink-0 bg-[#060205] border border-white/[0.08] rounded-xl p-4 sm:p-5 lg:w-72 space-y-2">
                <div className="text-[10px] font-mono uppercase text-white/40 tracking-wider">
                  Support Specification
                </div>
                <div className="text-xs font-semibold text-white font-mono">
                  {activeState.supportLevel}
                </div>
                <div className="pt-2 border-t border-white/[0.06] text-[11px] text-white/50 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#FF2A55]" />
                  <span>Frozen Model Weights</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footnote statement */}
        <div className="mt-8 text-center">
          <p className="inline-flex items-center gap-2 text-xs font-mono text-white/50 bg-[#0E060A] px-4 py-2 rounded-full border border-white/[0.06]">
            <Info className="w-3.5 h-3.5 text-[#FF2A55]" />
            These configurations describe the amount of visual support provided during few-shot evaluation.
          </p>
        </div>
      </div>
    </section>
  );
}
