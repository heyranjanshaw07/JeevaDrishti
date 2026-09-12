import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner({ message, onDismiss, className = '' }) {
  if (!message) return null;

  return (
    <div
      className={`rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 px-4 py-3 flex items-center justify-between gap-3 text-xs font-mono text-white/90 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertCircle className="w-4 h-4 text-[#FF2A55] shrink-0" />
        <span className="truncate">{message}</span>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-white/40 hover:text-white p-1 rounded transition-colors"
          aria-label="Dismiss message"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
