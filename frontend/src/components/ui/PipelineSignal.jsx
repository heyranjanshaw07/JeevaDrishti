import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ImageIcon,
  Scan,
  Layers,
  Cpu,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

const PIPELINE_NODES = [
  { id: 'img', label: 'Microscopy Image', icon: ImageIcon, sub: 'Optical Tensor' },
  { id: 'sam', label: 'Object Proposals', icon: Scan, sub: 'SAM Geometry' },
  { id: 'crops', label: 'Candidate Regions', icon: Layers, sub: 'Bounding Crops' },
  { id: 'vlm', label: 'VLM Reasoning', icon: Cpu, sub: 'Few-Shot Semantics' },
  { id: 'det', label: 'Cell Detection', icon: CheckCircle2, sub: 'Structured Coords' },
];

/**
 * Reusable PipelineSignal Component
 * Visualizes data flow with a subtle crimson signal traveling across stages.
 * Avoids neon effects; respects reduced motion.
 */
export default function PipelineSignal({ className = '', compact = false }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`relative rounded-2xl bg-[#090307] border border-white/[0.08] p-5 sm:p-6 ${className}`}>
      {/* Background Subtle Connector Line (Desktop) */}
      <div className="hidden md:block absolute top-[46px] left-12 right-12 h-[2px] bg-white/[0.08] overflow-hidden">
        {!shouldReduceMotion && (
          <motion.div
            animate={{ x: ['-100%', '600%'] }}
            transition={{
              repeat: Infinity,
              duration: 3.6,
              ease: 'linear',
            }}
            className="h-full w-28 bg-gradient-to-r from-transparent via-[#FF2A55] to-transparent shadow-[0_0_10px_#FF2A55]"
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4 relative">
        {PIPELINE_NODES.map((node, index) => {
          const Icon = node.icon;
          return (
            <div key={node.id} className="flex flex-col items-center text-center group relative">
              {/* Stage Node Icon */}
              <div className="relative w-12 h-12 rounded-xl bg-[#12060E] border border-white/[0.1] group-hover:border-crimson/50 flex items-center justify-center transition-all duration-300 shadow-sm mb-2.5 z-10">
                <Icon className="w-5 h-5 text-white/70 group-hover:text-crimson transition-colors" />
                
                {/* Node micro indicator */}
                <div className="absolute -bottom-1 w-2 h-2 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
              </div>

              {/* Title & Sub */}
              <span className="text-xs font-heading font-bold text-white tracking-wide group-hover:text-crimson transition-colors">
                {node.label}
              </span>
              {!compact && (
                <span className="text-[10px] font-mono text-white/50 mt-0.5">
                  {node.sub}
                </span>
              )}

              {/* Mobile / Tablet Connector */}
              {index < PIPELINE_NODES.length - 1 && (
                <div className="md:hidden absolute -right-2 top-4 text-white/20">
                  <ChevronRight size={14} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
