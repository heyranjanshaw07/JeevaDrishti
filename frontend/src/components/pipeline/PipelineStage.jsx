import { motion } from 'framer-motion'
import {
  Microscope,
  Focus,
  Crop,
  Cpu,
  Target,
  BarChart3,
  CheckCircle2,
} from 'lucide-react'

export const PIPELINE_STAGES = [
  {
    step: '01',
    id: 'image-input',
    title: 'Microscopy Image',
    shortTitle: 'Image Input',
    description: 'An optical microscopy image enters the JeevaDrishti analysis workflow.',
    technicalDetails:
      'High-resolution raw optical slide ingestion. Stain normalization, dimension calibration, and tiled sub-field extraction prepare multi-gigapixel cytological fields for downstream proposal generation.',
    icon: Microscope,
    input: 'Raw Specimen (PNG/JPG)',
    output: 'Normalized RGB Field',
  },
  {
    step: '02',
    id: 'object-proposals',
    title: 'SAM / Object Proposals',
    shortTitle: 'SAM Proposals',
    description: 'Object proposals identify visually meaningful regions that may contain cells.',
    technicalDetails:
      'Zero-shot foundation segmentation (Segment Anything Model) generates class-agnostic candidate boundary proposals, capturing diverse circular, polygonal, and elongated cell contours without needing prior task annotations.',
    icon: Focus,
    input: 'Normalized Field',
    output: 'Spatial Boundary Contours',
  },
  {
    step: '03',
    id: 'candidate-regions',
    title: 'Candidate Regions',
    shortTitle: 'Candidate RoIs',
    description: 'Proposed regions are converted into candidate cell areas for downstream reasoning.',
    technicalDetails:
      'Bounding coordinates are extracted from spatial proposals with context-padding buffers. Bounding boxes isolate candidate cellular patches into standard tensor crops ready for vision-language semantic verification.',
    icon: Crop,
    input: 'Spatial Contours',
    output: 'Cropped RoI Patches',
  },
  {
    step: '04',
    id: 'vlm-classification',
    title: 'Vision-Language Classification',
    shortTitle: 'VLM Reasoning',
    description: 'A vision-language model evaluates candidate regions using visual evidence and few-shot contextual examples.',
    technicalDetails:
      'Multimodal transformer cross-attention computes joint embeddings between visual candidate patches, biomedical phenotype definitions, and 0-to-6 visual reference exemplars from the Micro-OD bank.',
    icon: Cpu,
    input: 'RoI Patches + Exemplars',
    output: 'Phenotype Probabilities',
  },
  {
    step: '05',
    id: 'cell-detection',
    title: 'Cell Detection',
    shortTitle: 'Cell Detection',
    description: 'Classified candidate regions become structured cell detections with their associated categories.',
    technicalDetails:
      'Confidence calibration, non-maximum suppression (NMS), and bounding coordinate mapping resolve overlapping proposals into structured detection records with verified category labels.',
    icon: Target,
    input: 'Classified Patches',
    output: 'Structured Cell Detections',
  },
  {
    step: '06',
    id: 'evaluation',
    title: 'Evaluation',
    shortTitle: 'Evaluation',
    description: 'Predictions can be evaluated using detection and classification metrics such as Precision, Recall, F1 and IoU.',
    technicalDetails:
      'Detections are scored against standardized ground-truth benchmark partitions (BBBC, BCCD, LIVECell, NIH-3T3) across mF1, Precision, Recall, IoU, inference latency, and VLM call budgets.',
    icon: BarChart3,
    input: 'Structured Detections',
    output: 'Scientific Verification Score',
  },
]

/**
 * PipelineStage — Individual interactive stage card
 */
export default function PipelineStage({
  stage,
  isSelected,
  onSelect,
  isSubdued,
}) {
  const Icon = stage.icon

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(stage.step)}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        scale: isSelected ? 1.03 : 1,
        opacity: isSubdued ? 0.65 : 1,
      }}
      transition={{ duration: 0.2 }}
      className={`p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden group w-full ${
        isSelected
          ? 'bg-crimson/15 border-2 border-crimson shadow-[0_0_30px_rgba(255,42,85,0.25)]'
          : 'bg-black/60 border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]'
      }`}
    >
      {/* Active corner glow */}
      {isSelected && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-crimson/25 rounded-full blur-2xl pointer-events-none" />
      )}

      <div>
        {/* Step indicator & Icon */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-xs font-mono font-extrabold tracking-wider ${
              isSelected ? 'text-crimson' : 'text-text-muted'
            }`}
          >
            STAGE {stage.step}
          </span>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform ${
              isSelected
                ? 'bg-crimson text-white shadow-[0_0_12px_#FF2A55] scale-110'
                : 'bg-white/[0.04] text-text-muted group-hover:text-white group-hover:scale-105'
            }`}
          >
            <Icon size={17} />
          </div>
        </div>

        {/* Title */}
        <h3
          className={`text-sm font-heading font-extrabold tracking-tight mb-1.5 transition-colors ${
            isSelected ? 'text-white' : 'text-white/90 group-hover:text-white'
          }`}
        >
          {stage.title}
        </h3>

        {/* Description */}
        <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
          {stage.description}
        </p>
      </div>

      {/* Footer Indicator */}
      <div className="mt-4 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
        <span className={isSelected ? 'text-crimson font-bold' : 'text-text-muted'}>
          {isSelected ? 'ACTIVE INSPECTION' : 'CLICK TO EXPAND'}
        </span>
        {isSelected && (
          <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_6px_#FF2A55]" />
        )}
      </div>
    </motion.button>
  )
}
