import React from 'react';

export default function LoadingSkeleton({ className = '', lines = 1 }) {
  if (lines > 1) {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className="h-4 rounded-lg bg-white/[0.04] animate-pulse border border-white/[0.04]"
            style={{ width: `${Math.max(40, 100 - idx * 15)}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl bg-white/[0.04] animate-pulse border border-white/[0.04] ${className}`}
    />
  );
}
