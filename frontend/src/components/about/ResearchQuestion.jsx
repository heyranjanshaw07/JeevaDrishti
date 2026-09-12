import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Activity } from 'lucide-react';

const SHOT_CHIPS = ['0 SHOT', '1 SHOT', '3 SHOTS', '6 SHOTS'];

export default function ResearchQuestion() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] bg-[#060205] overflow-hidden">
      {/* Background ambient crimson */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[350px] bg-[#FF2A55]/06 rounded-full blur-[170px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl bg-gradient-to-b from-[#14080F] via-[#090306] to-[#10050D] border-2 border-[#FF2A55]/40 p-8 sm:p-14 lg:p-16 text-center space-y-8 shadow-2xl shadow-[#FF2A55]/15 relative overflow-hidden"
        >
          {/* Subtle animated scan beam on card header */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/[0.04] overflow-hidden">
            <motion.div
              className="h-full w-44 bg-gradient-to-r from-transparent via-[#FF2A55] to-transparent shadow-[0_0_12px_#FF2A55]"
              animate={{ x: ['-100%', '600%'] }}
              transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut' }}
            />
          </div>

          {/* Section Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF2A55]/15 border border-[#FF2A55]/30 text-xs font-mono font-bold tracking-widest text-[#FF2A55] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#FF2A55] animate-ping" />
            THE QUESTION
          </div>

          {/* Main Question Display */}
          <blockquote className="text-2xl sm:text-4xl lg:text-5xl font-black font-heading text-white tracking-tight leading-tight max-w-4xl mx-auto">
            &ldquo;Can a Vision-Language Model detect previously unseen cell types from only a few visual examples?&rdquo;
          </blockquote>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto font-sans leading-relaxed">
            JeevaDrishti explores this question through zero-shot and few-shot visual context configurations.
          </p>

          {/* 4 Chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {SHOT_CHIPS.map((chip, idx) => (
              <span
                key={chip}
                className="px-4 py-2 rounded-xl bg-[#1A0914] border border-[#FF2A55]/30 text-xs font-mono font-bold text-white tracking-wider hover:border-[#FF2A55] hover:text-[#FF2A55] transition-colors"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="text-[11px] font-mono text-white/40 pt-4 border-t border-white/[0.06] flex items-center justify-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#FF2A55]" />
            <span>Standardized Micro-OD Evaluation Protocol</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
