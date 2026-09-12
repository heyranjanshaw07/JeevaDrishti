import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, BarChart3, ScanLine, ArrowRight } from 'lucide-react';

export default function NavigationCTA() {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 sm:py-28 border-t border-white/[0.08] bg-gradient-to-b from-[#060205] via-[#0E050B] to-[#060205] overflow-hidden">
      {/* Background ambient crimson */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#FF2A55]/08 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A55]/10 border border-[#FF2A55]/30 text-xs font-mono uppercase tracking-widest text-[#FF2A55]">
            Next Research Steps
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-heading text-white tracking-tight">
            Go Deeper.
          </h2>

          <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto font-sans leading-relaxed">
            Explore the research, inspect the benchmark, or run a microscopy analysis.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {/* Research */}
            <button
              onClick={() => navigate('/research')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 font-semibold text-sm transition-all transform hover:-translate-y-0.5"
            >
              <BookOpen className="w-4 h-4 text-[#FF2A55]" />
              Research
              <ArrowRight className="w-4 h-4 text-white/40" />
            </button>

            {/* Benchmark */}
            <button
              onClick={() => navigate('/benchmark')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 font-semibold text-sm transition-all transform hover:-translate-y-0.5"
            >
              <BarChart3 className="w-4 h-4 text-[#FF2A55]" />
              Benchmark
              <ArrowRight className="w-4 h-4 text-white/40" />
            </button>

            {/* Analyze */}
            <button
              onClick={() => navigate('/analyze')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#FF2A55] hover:bg-[#DC2626] text-white font-semibold text-sm shadow-xl shadow-[#FF2A55]/25 transition-all transform hover:-translate-y-0.5"
            >
              <ScanLine className="w-4 h-4" />
              Analyze
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
