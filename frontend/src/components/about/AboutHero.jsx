import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, BookOpen, Microscope } from 'lucide-react';

export default function AboutHero() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 border-b border-white/[0.08] bg-gradient-to-b from-[#0A0407] via-[#060205] to-[#060205]">
      {/* Background ambient crimson */}
      <div className="absolute top-0 right-1/3 w-[550px] h-[320px] bg-[#FF2A55]/08 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-[450px] h-[300px] bg-[#DC2626]/05 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF2A55]/10 border border-[#FF2A55]/30 text-xs font-mono font-semibold uppercase tracking-widest text-[#FF2A55]"
          >
            <Microscope className="w-3.5 h-3.5" />
            ABOUT JEEVADRISHTI
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black font-heading text-white tracking-tight leading-tight"
          >
            See Deeper. Understand Life.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="text-base sm:text-lg text-white/80 leading-relaxed font-sans"
          >
            JeevaDrishti explores adaptive vision-language intelligence for cell detection in optical microscopy.
          </motion.p>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="text-xs sm:text-sm text-white/50 border-l-2 border-[#FF2A55]/60 pl-4 py-1 font-mono leading-relaxed"
          >
            Combining object proposals, visual context, and vision-language reasoning, JeevaDrishti is designed to investigate how intelligent systems can interpret complex microscopic imagery.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <button
              onClick={() => navigate('/analyze')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF2A55] hover:bg-[#DC2626] text-white font-semibold text-sm shadow-lg shadow-[#FF2A55]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Start Analysis
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/research')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/90 hover:text-white border border-white/10 font-semibold text-sm transition-all"
            >
              <BookOpen className="w-4 h-4 text-[#FF2A55]" />
              Explore Research
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
