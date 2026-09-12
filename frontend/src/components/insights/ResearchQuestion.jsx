import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Sparkles, Activity } from 'lucide-react';

export default function ResearchQuestion() {
  return (
    <section className="relative py-12 sm:py-16 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="relative rounded-3xl bg-gradient-to-b from-[#14080F] via-[#0A0307] to-[#0E050B] border-2 border-[#FF2A55]/40 p-8 sm:p-12 lg:p-16 shadow-2xl shadow-[#FF2A55]/15 overflow-hidden"
        >
          {/* Subtle animated crimson scanning line across card top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/[0.05] overflow-hidden">
            <motion.div
              className="h-full w-48 bg-gradient-to-r from-transparent via-[#FF2A55] to-transparent shadow-[0_0_12px_#FF2A55]"
              animate={{ x: ['-100%', '600%'] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            />
          </div>

          {/* Background circular glow */}
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#FF2A55]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            {/* Tag / Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF2A55]/15 border border-[#FF2A55]/30 text-xs font-mono font-bold tracking-widest text-[#FF2A55] uppercase shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#FF2A55] animate-ping" />
              CORE RESEARCH QUESTION
            </div>

            {/* Visual Centerpiece Question */}
            <blockquote className="text-2xl sm:text-4xl lg:text-5xl font-black font-heading text-white tracking-tight leading-tight max-w-4xl">
              &ldquo;Can a Vision-Language Model detect previously unseen cell types from only a few visual examples?&rdquo;
            </blockquote>

            {/* Context footnote */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-white/50 pt-2 border-t border-white/[0.06] w-full max-w-2xl">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#FF2A55]" />
                Micro-OD Evaluation Paradigm
              </span>
              <span className="text-white/20">•</span>
              <span>Zero-Shot to 6-Shot Regime</span>
              <span className="text-white/20">•</span>
              <span>In-Context Prompting</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
