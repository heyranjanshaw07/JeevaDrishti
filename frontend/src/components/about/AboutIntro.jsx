import React from 'react';
import { motion } from 'framer-motion';
import { Microscope, ShieldCheck, Sparkles, Binary, CheckCircle2 } from 'lucide-react';

export default function AboutIntro() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Visual / Typographic Identity Block (5 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl bg-gradient-to-br from-[#140810] via-[#0A0307] to-[#12050E] border border-white/[0.1] p-8 sm:p-10 shadow-2xl overflow-hidden group hover:border-[#FF2A55]/40 transition-colors">
              {/* Decorative radial blur */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF2A55]/15 rounded-full blur-3xl pointer-events-none" />

              {/* Monogram / Brand Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF2A55] to-[#DC2626] p-0.5 shadow-lg shadow-[#FF2A55]/30 mb-8 flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-[#060205] flex items-center justify-center">
                  <Microscope className="w-8 h-8 text-[#FF2A55]" />
                </div>
              </div>

              {/* Typographic Identity */}
              <h3 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight leading-tight mb-2">
                Jeeva + Drishti
              </h3>
              <p className="text-xs font-mono text-[#FF2A55] uppercase tracking-widest font-semibold mb-6">
                Seeing Life Through Intelligence
              </p>

              <p className="text-xs text-white/60 leading-relaxed font-sans mb-6">
                Synthesizing biological cytology with modern multimodal artificial intelligence to explore adaptive, zero-shot, and few-shot cellular reasoning.
              </p>

              {/* Status Spec Pills */}
              <div className="pt-4 border-t border-white/[0.06] flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-white/70">
                  Micro-OD Protocol
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-white/70">
                  Hybrid In-Context
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#FF2A55]/10 border border-[#FF2A55]/30 text-[#FF2A55]">
                  Open Research
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Narrative Description (7 cols) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-widest text-[#FF2A55]">
              <Sparkles className="w-3.5 h-3.5" />
              RESEARCH-ORIENTED PLATFORM
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              What is JeevaDrishti?
            </h2>

            <div className="space-y-4 text-base sm:text-lg text-white/80 leading-relaxed font-sans">
              <p>
                JeevaDrishti is a research-oriented microscopy intelligence platform focused on adaptive cell detection using vision-language models.
              </p>
              <p className="text-white/60 text-sm sm:text-base">
                The system combines microscopy image analysis with object proposals and vision-language classification to create a hybrid detection workflow.
              </p>
            </div>

            {/* Architecture Highlights */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0E060A] border border-white/[0.08] space-y-1.5">
                <div className="text-xs font-mono uppercase text-[#FF2A55] font-semibold">
                  Proposal Generation
                </div>
                <div className="text-xs text-white/60 leading-relaxed">
                  Class-agnostic mask proposals isolate candidate cell bodies from complex microscopy textures.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0E060A] border border-white/[0.08] space-y-1.5">
                <div className="text-xs font-mono uppercase text-[#FF2A55] font-semibold">
                  Multimodal Reasoning
                </div>
                <div className="text-xs text-white/60 leading-relaxed">
                  Vision-language models perform in-context semantic verification using exemplar image prompts.
                </div>
              </div>
            </div>

            {/* Clinical Guardrail Notice */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 text-xs font-mono text-white/50 flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-[#FF2A55] shrink-0" />
              <span>
                Research prototype notice: JeevaDrishti is designed strictly for scientific evaluation and experimentation, and is not certified for clinical or diagnostic healthcare decisions.
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
