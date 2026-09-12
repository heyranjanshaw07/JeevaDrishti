import React from 'react';
import { Link } from 'react-router-dom';
import { Microscope, ShieldCheck } from 'lucide-react';

export default function GlobalFooter({ className = '' }) {
  return (
    <footer className={`pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.08] ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
        {/* Brand & Purpose (6 cols) */}
        <div className="md:col-span-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FF2A55]/15 border border-[#FF2A55]/35 flex items-center justify-center text-[#FF2A55] shadow-[0_0_15px_rgba(255,42,85,0.3)]">
              <Microscope size={18} />
            </div>
            <span className="text-lg font-heading font-extrabold text-white tracking-tight">
              JeevaDrishti
            </span>
          </div>

          <p className="text-xs sm:text-sm text-white/60 max-w-md leading-relaxed font-sans">
            &ldquo;See Deeper. Understand Life.&rdquo; — An adaptive vision-language platform exploring hybrid object proposals and in-context multimodal reasoning for optical microscopy.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-mono text-white/70">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A55]" />
              MICRO-OD PROTOCOL
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-mono text-white/70">
              <ShieldCheck className="w-3 h-3 text-[#FF2A55]" />
              OPEN RESEARCH
            </span>
          </div>
        </div>

        {/* Navigation: Analysis (3 cols) */}
        <div className="md:col-span-3 space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold block">
            Analysis Suite
          </span>
          <ul className="space-y-2 text-xs font-mono text-white/60">
            <li>
              <Link to="/analyze" className="hover:text-[#FF2A55] transition-colors">
                Analyze Engine
              </Link>
            </li>
            <li>
              <Link to="/pipeline" className="hover:text-[#FF2A55] transition-colors">
                Vision Pipeline
              </Link>
            </li>
            <li>
              <Link to="/benchmark" className="hover:text-[#FF2A55] transition-colors">
                Research Benchmark
              </Link>
            </li>
            <li>
              <Link to="/dataset" className="hover:text-[#FF2A55] transition-colors">
                Dataset Explorer
              </Link>
            </li>
          </ul>
        </div>

        {/* Navigation: Research & Identity (3 cols) */}
        <div className="md:col-span-3 space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold block">
            Research & Platform
          </span>
          <ul className="space-y-2 text-xs font-mono text-white/60">
            <li>
              <Link to="/research" className="hover:text-[#FF2A55] transition-colors">
                Research Hub
              </Link>
            </li>
            <li>
              <Link to="/insights" className="hover:text-[#FF2A55] transition-colors">
                Research Insights
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-[#FF2A55] transition-colors">
                About JeevaDrishti
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-[#FF2A55] transition-colors">
                Overview Dashboard
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal & Research Disclaimer */}
      <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-white/40">
        <div>
          © {new Date().getFullYear()} JeevaDrishti. Research and demonstration platform.
        </div>
        <div>
          Outputs are intended for scientific evaluation and not clinical diagnosis.
        </div>
      </div>
    </footer>
  );
}
