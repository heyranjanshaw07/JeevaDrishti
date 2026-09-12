import React from 'react';
import { motion } from 'framer-motion';
import { Layers, ArrowRight } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Layers,
  title = 'No Data Available',
  description = 'There are currently no items or active telemetry in this view.',
  actionText,
  onAction,
  className = '',
  compact = false,
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-white/[0.1] bg-[#0E060A]/60 flex flex-col items-center justify-center text-center p-8 sm:p-12 transition-all hover:border-white/20 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#170812] border border-white/[0.08] flex items-center justify-center text-[#FF2A55] mb-4 shadow-sm">
        <Icon className="w-6 h-6" />
      </div>

      <h4 className="text-base sm:text-lg font-bold text-white tracking-tight mb-1.5 font-heading">
        {title}
      </h4>

      <p className="text-xs sm:text-sm text-white/50 max-w-sm leading-relaxed font-sans mb-5">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-[#FF2A55] text-white/80 hover:text-white border border-white/10 hover:border-transparent text-xs font-semibold font-mono tracking-wider transition-all"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
