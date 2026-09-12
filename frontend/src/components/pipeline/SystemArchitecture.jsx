import React from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Layout,
  Server,
  Scan,
  Cpu,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowDown,
  Sparkles,
  Info
} from 'lucide-react';

const ARCHITECTURE_TIERS = [
  {
    tier: 'Tier 01',
    layer: 'Frontend Interface',
    tech: 'React + Vite + Tailwind',
    purpose: 'Interactive hematology exploration, benchmark dashboard, and research visualizations.',
    status: 'READY',
    statusType: 'ready',
    icon: Layout,
    details: 'Pure white & crimson design system, zero-dependency client state, and responsive viewport orchestration.'
  },
  {
    tier: 'Tier 02',
    layer: 'Analysis API',
    tech: 'FastAPI',
    purpose: 'High-throughput asynchronous image dispatch, batch queuing, and coordinate aggregation.',
    status: 'PENDING INTEGRATION',
    statusType: 'pending',
    icon: Server,
    details: 'RESTful endpoints for slide ingest, proposal streaming, and structured response schema validation.'
  },
  {
    tier: 'Tier 03',
    layer: 'Vision Layer',
    tech: 'SAM / Object Proposal Engine',
    purpose: 'Unsupervised mask generation and spatial bounding box proposals over cellular bodies.',
    status: 'PENDING INTEGRATION',
    statusType: 'pending',
    icon: Scan,
    details: 'Segment Anything Model (SAM) backbone with automated prompt-grid generation tailored for optical microscopy.'
  },
  {
    tier: 'Tier 04',
    layer: 'Reasoning Layer',
    tech: 'Vision-Language Model',
    purpose: 'Zero-shot and few-shot in-context semantic verification of candidate proposal crops.',
    status: 'PENDING INTEGRATION',
    statusType: 'pending',
    icon: Cpu,
    details: 'Multimodal transformer evaluating morphological visual evidence against biomedical class queries.'
  },
  {
    tier: 'Tier 05',
    layer: 'Evaluation Engine',
    tech: 'Micro-OD Benchmark',
    purpose: 'Standardized evaluation protocols measuring Precision, Recall, F1, and mean IoU across datasets.',
    status: 'READY FOR INTEGRATION',
    statusType: 'ready-integration',
    icon: BarChart3,
    details: 'Calibrated dataset splits (252 images, 4 cohorts) with deterministic ground-truth comparison algorithms.'
  }
];

export default function SystemArchitecture() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.08] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A55]/10 border border-[#FF2A55]/30 text-xs font-mono uppercase tracking-widest text-[#FF2A55] mb-4">
            <Layers className="w-3.5 h-3.5" />
            Infrastructure Topology
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            System Architecture
          </h2>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
            Modular multi-tier blueprint decoupling the presentation client, asynchronous API gateway, visual proposal engine, and multimodal reasoning backbone.
          </p>
        </div>

        {/* Architecture Stack (Vertical connected cards) */}
        <div className="max-w-4xl mx-auto space-y-4 relative">
          {ARCHITECTURE_TIERS.map((tier, idx) => {
            const Icon = tier.icon;
            const isReady = tier.statusType === 'ready';
            const isReadyIntegration = tier.statusType === 'ready-integration';
            const isPending = tier.statusType === 'pending';

            return (
              <React.Fragment key={tier.layer}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                  className="rounded-2xl bg-[#0E060A]/80 border border-white/[0.08] hover:border-white/20 p-5 sm:p-6 transition-all relative group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Icon + Layer Info */}
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#170912] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:border-[#FF2A55]/40 transition-colors">
                        <Icon className="w-6 h-6 text-[#FF2A55]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-white/40 tracking-wider uppercase">
                            {tier.tier}
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-xs font-mono text-[#FF2A55] font-semibold">{tier.tech}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">{tier.layer}</h3>
                        <p className="text-xs text-white/60 mt-1 max-w-xl">{tier.purpose}</p>
                      </div>
                    </div>

                    {/* Right: Status Badge */}
                    <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-white/[0.06]">
                      {isReady && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/30 text-white font-mono text-[11px] font-semibold uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Frontend: READY
                        </span>
                      )}

                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-crimson/10 border border-crimson/30 text-crimson font-mono text-[11px] font-semibold uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5" />
                          {tier.layer.includes('API') ? 'Backend' : 'AI Inference'}: PENDING INTEGRATION
                        </span>
                      )}

                      {isReadyIntegration && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF2A55]/15 border border-[#FF2A55]/40 text-[#FF2A55] font-mono text-[11px] font-semibold uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" />
                          Benchmark: READY FOR INTEGRATION
                        </span>
                      )}

                      <span className="text-[10px] text-white/40 font-mono mt-1 hidden sm:block">
                        Target: Micro-OD Standard
                      </span>
                    </div>
                  </div>

                  {/* Micro Detail Row */}
                  <div className="mt-4 pt-3 border-t border-white/[0.04] text-[11px] font-mono text-white/40 flex items-center gap-2">
                    <span className="text-white/20">SPECS:</span>
                    <span>{tier.details}</span>
                  </div>
                </motion.div>

                {/* Connector Arrow between cards */}
                {idx < ARCHITECTURE_TIERS.length - 1 && (
                  <div className="flex justify-center -my-1 py-1">
                    <div className="w-6 h-6 rounded-full bg-[#12070D] border border-white/[0.1] flex items-center justify-center text-white/40">
                      <ArrowDown className="w-3 h-3 text-[#FF2A55]" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Informational Disclaimer Box */}
        <div className="mt-12 max-w-4xl mx-auto rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 flex items-start gap-3 text-xs font-mono text-white/50">
          <Info className="w-4 h-4 text-[#FF2A55] shrink-0 mt-0.5" />
          <p>
            Notice: This section outlines the documented system architecture of JeevaDrishti. In accordance with the frontend-only research milestone, no live inference backend services are connected on this route.
          </p>
        </div>
      </div>
    </section>
  );
}
