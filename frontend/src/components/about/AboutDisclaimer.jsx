import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export default function AboutDisclaimer() {
  return (
    <section className="relative py-8 sm:py-12 border-t border-white/[0.08] overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-5 sm:p-6 flex items-start gap-4 text-xs font-mono text-white/50 leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-[#FF2A55] shrink-0 mt-0.5" />
          <div>
            <span className="text-white/80 font-semibold block mb-1 uppercase tracking-wider text-[11px]">
              Scientific Research Disclaimer
            </span>
            <p>
              JeevaDrishti is a research and demonstration platform. Its outputs are intended for experimentation and evaluation and should not be interpreted as clinical diagnosis or medical advice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
