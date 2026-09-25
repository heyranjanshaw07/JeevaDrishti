/**
 * JeevaDrishti Scientific Data Foundation
 * Centralized data exports for datasets, metrics, and models.
 */

export const LAB_METADATA = {
  name: 'JeevaDrishti',
  tagline: 'Empowering Microscopy with Intelligent Vision',
  version: '1.0.0-alpha',
  engine: 'Aurora Vision Lab Hybrid VLM',
  systemStatus: 'ONLINE',
  inferenceLatencyTargetMs: 850,
}

export const SUPPORTED_DATASETS = [
  { id: 'BCCD', name: 'Blood Cell Count & Detection', type: 'Brightfield', classes: 3 },
  { id: 'BBBC', name: 'Broad Bioimage Benchmark Collection', type: 'Fluorescence', classes: 4 },
  { id: 'LIVECell', name: 'Large-Scale Instance Segmentation', type: 'Phase Contrast', classes: 8 },
  { id: 'NIH-3T3', name: 'NIH 3T3 Fibroblast Cells', type: 'Brightfield', classes: 2 },
]

export const SHOT_MODES = [
  { id: '0-shot', label: 'Zero-Shot', desc: 'Direct foundation semantic reasoning' },
  { id: '1-shot', label: '1-Shot', desc: 'Single visual exemplar alignment' },
  { id: '3-shot', label: '3-Shot', desc: 'Multi-exemplar boundary adaptation' },
  { id: '6-shot', label: '6-Shot', desc: 'Comprehensive clinical calibration' },
]
