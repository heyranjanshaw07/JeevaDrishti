/**
 * JeevaDrishti Dashboard Data Foundation
 * 
 * CLEAR SEPARATION:
 * 1. PROJECT DATA — Real benchmark specifications, supported dataset schemas, pipeline architecture.
 * 2. DEMO DATA — Illustrative demo figures, sample histories, and interactive few-shot trajectories.
 * 
 * Strict Colors: #060205, #FF2A55, #DC2626, #FFFFFF
 */

// ============================================================================
// 1. PROJECT DATA (Specifications & Benchmark Metadata)
// ============================================================================

export const PROJECT_METRICS = [
  {
    id: 'images',
    label: 'MICROSCOPY IMAGES',
    value: '21,756',
    description: 'Across 5 clinical suites & benchmark',
  },
  {
    id: 'cells',
    label: 'ANNOTATED CELLS',
    value: '5,551+',
    description: 'Test-set & clinical annotations',
  },
  {
    id: 'datasets',
    label: 'SUPPORTED DATASETS',
    value: '5',
    description: 'Leukemia · Cervical · Malaria · Micro-OD · SCD',
  },
  {
    id: 'shots',
    label: 'SHOT CONFIGURATIONS',
    value: '0 / 6',
    description: 'Zero-shot vs 6-Shot',
  },
]

export const PROJECT_DATASET_ECOSYSTEM = [
  {
    id: 'C-NMC',
    name: 'C-NMC 2019 B-ALL Leukemia',
    code: 'C-NMC-2019',
    modality: 'Peripheral Blood Smear',
    cellTypes: 'ALL Blasts vs Healthy Hematopoietic',
    samples: 15114,
  },
  {
    id: 'SIPaKMeD',
    name: 'SIPaKMeD Cervical Cytology',
    code: 'SIPaKMeD-Pap',
    modality: 'Pap Smear Optical Cytology',
    cellTypes: '5 Morphological Cytological Classes',
    samples: 5015,
  },
  {
    id: 'NIH-Malaria',
    name: 'NIH-NLM Thin Blood Smears',
    code: 'NIH-Pf-Thin',
    modality: 'Thin Blood Smear Giemsa',
    cellTypes: 'P. falciparum Trophozoite & Ring Cells',
    samples: 965,
  },
  {
    id: 'Micro-OD',
    name: 'Micro-OD Multi-Domain Benchmark',
    code: 'Micro-OD-Suite',
    modality: 'Multi-Modal Optical (Fluo/Phase/BF)',
    cellTypes: '10 Cell Categories (BBBC, BCCD, LIVECell, NIH-3T3)',
    samples: 504,
  },
  {
    id: 'RedTell',
    name: 'RedTell Sickle Cell & Anemia',
    code: 'RedTell-RBC',
    modality: 'Brightfield & Fluo-4 RBC Morphology',
    cellTypes: 'Sickle Cell Disease, Thalassemia & Control',
    samples: 158,
  },
]

export const PROJECT_VISION_PIPELINE = [
  {
    step: '01',
    title: 'IMAGE INPUT',
    detail: 'Raw microscopy slide ingestion & stain normalization',
  },
  {
    step: '02',
    title: 'SAM / OBJECT PROPOSALS',
    detail: 'Segment Anything Model sub-pixel boundary proposals',
  },
  {
    step: '03',
    title: 'CANDIDATE REGIONS',
    detail: 'High-confidence bounding box & mask extraction',
  },
  {
    step: '04',
    title: 'VLM CLASSIFICATION',
    detail: 'Vision-Language Model few-shot semantic verification',
  },
  {
    step: '05',
    title: 'CELL DETECTION',
    detail: 'Final calibrated cell coordinates & phenotype classification',
  },
]

export const PROJECT_PIPELINE_STATUS = [
  { label: 'LOCALIZATION ENGINE READY', active: true },
  { label: 'VISION-LANGUAGE ENGINE READY', active: true },
  { label: 'HYBRID PIPELINE READY', active: true },
]

export const PROJECT_RESEARCH_INSIGHT = {
  tag: 'RESEARCH QUESTION',
  question: 'Can a Vision-Language Model detect previously unseen cell types from only a few visual examples?',
  abstract:
    'Cytological microscopy analysis historically requires extensive per-laboratory manual re-annotation. JeevaDrishti explores whether hybrid foundation models conditioned on 1-to-6 visual exemplars can bridge domain shift across staining protocols and optical modalities without parameter fine-tuning.',
  targetRoute: '/research',
}

// ============================================================================
// 2. DEMO DATA (Illustrative Telemetry & Interactive Visualizations)
// ============================================================================

export const DEMO_ANALYSIS_CHART = [
  {
    shot: '0-SHOT',
    overall: 52.4,
    bccd: 58.2,
    bbbc: 49.1,
    livecell: 46.5,
    nih3t3: 55.8,
  },
  {
    shot: '6-SHOT',
    overall: 79.8,
    bccd: 84.6,
    bbbc: 77.2,
    livecell: 74.1,
    nih3t3: 83.3,
  },
]

export const DEMO_RECENT_ANALYSIS = [
  {
    id: 'ana-001',
    fileName: 'blood_smear_042.png',
    dataset: 'BCCD',
    shotMode: '6-shot',
    cellCount: 18,
    timestamp: '12 min ago',
    status: 'COMPLETED',
    confidence: '98.4%',
  },
  {
    id: 'ana-002',
    fileName: 'microscopy_sample_017.png',
    dataset: 'BBBC',
    shotMode: '6-shot',
    cellCount: 42,
    timestamp: '48 min ago',
    status: 'COMPLETED',
    confidence: '95.1%',
  },
  {
    id: 'ana-003',
    fileName: 'cell_sample_008.png',
    dataset: 'LIVECell',
    shotMode: '0-shot',
    cellCount: 7,
    timestamp: '2 hours ago',
    status: 'COMPLETED',
    confidence: '91.8%',
  },
]

export const DEMO_FEW_SHOT_CONFIGS = {
  '0-SHOT': {
    mode: '0-SHOT',
    label: 'Zero-Shot Foundation',
    mF1: '52.4%',
    accuracyNum: 52.4,
    latency: '820ms',
    exemplars: '0 images',
    confidence: '71.2%',
    description: 'Direct zero-shot semantic query without visual exemplars',
    datasetScores: [
      { dataset: 'BCCD', score: 58.2 },
      { dataset: 'BBBC', score: 49.1 },
      { dataset: 'LIVECell', score: 46.5 },
      { dataset: 'NIH-3T3', score: 55.8 },
    ],
  },
  '6-SHOT': {
    mode: '6-SHOT',
    label: '6-Shot Clinical Precision',
    mF1: '79.8%',
    accuracyNum: 79.8,
    latency: '1,380ms',
    exemplars: '6 visual prompts',
    confidence: '95.7%',
    description: 'Full few-shot prompt bank achieving maximum cytology detection precision',
    datasetScores: [
      { dataset: 'BCCD', score: 84.6 },
      { dataset: 'BBBC', score: 77.2 },
      { dataset: 'LIVECell', score: 74.1 },
      { dataset: 'NIH-3T3', score: 83.3 },
    ],
  },
}
