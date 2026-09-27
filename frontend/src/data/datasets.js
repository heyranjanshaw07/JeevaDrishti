/**
 * Centralized Microscopy Dataset Metadata
 * 
 * Unified multi-dataset framework supporting 5 distinct optical domains:
 * 1. Micro-OD — Object Detection (BBBC, BCCD, LIVECell, NIH-3T3)
 * 2. NIH-NLM Malaria — Object Detection (Thin Blood Smears Pf)
 * 3. C-NMC 2019 — Cell Classification (Leukemia ALL Blasts vs Normal)
 * 4. RedTell — Cell Classification (Sickle Cell & Anemia RBC Morphology)
 * 5. SIPaKMeD — Cell Classification (Cervical Cytology Pap Smear)
 */

export const MICRO_OD_OVERVIEW = {
  totalImages: 21756,
  benchmarkImages: 252,
  exampleImages: 40,
  testImages: 212,
  datasetCount: 5,
  annotatedTestCells: 5551,
}

export const DATASETS = [
  // ─── 1. Micro-OD Benchmark ───────────────────────────────────────────────
  {
    id: 'micro_od',
    name: 'Micro-OD',
    fullName: 'Micro-OD Multi-Domain Optical Microscopy Benchmark',
    description: 'Standardized multi-domain optical microscopy benchmark aggregating BBBC, BCCD, LIVECell, and NIH-3T3.',
    purpose: 'Multi-domain optical microscopy cell detection across fluorescence, phase-contrast, and brightfield.',
    modality: 'Multi-Modal Optical (Fluorescence, Phase-Contrast, Brightfield)',
    domain: 'General Cell Detection',
    taskType: 'object_detection',
    annotationType: 'Bounding Box (JSONL)',
    supportedShots: [0, 6],
    imageCount: 504,
    exampleImages: 40,
    testImages: 212,
    testBoxes: 5551,
    annotatedCells: '5,551',
    classesCount: 10,
    classes: [
      'Gametocyte Cells',
      'Platelets',
      'Polygonal Cells',
      'Red Blood Cells',
      'Ring Cells',
      'Round Cells',
      'Schizont Cells',
      'Spindle Cells',
      'Trophozoite Cells',
      'White Blood Cells',
    ],
    sampleImages: [
      {
        url: '/samples/datasets/bbbc_sample.jpg',
        caption: 'BBBC041 Fluorescence Staining Exemplar Field',
        tag: 'Fluorescence',
      },
      {
        url: '/samples/datasets/bccd_sample.jpg',
        caption: 'BCCD Blood Smear Optical Cytology Field',
        tag: 'Brightfield',
      },
      {
        url: '/samples/datasets/livecell_sample.jpg',
        caption: 'LIVECell Label-Free Phase-Contrast Microscopy',
        tag: 'Phase-Contrast',
      },
      {
        url: '/samples/datasets/nih3t3_sample.jpg',
        caption: 'NIH-3T3 Fibroblast Proliferation Cell Culture',
        tag: 'Cell Culture',
      },
    ],
  },

  // ─── 2. NIH-NLM Malaria ──────────────────────────────────────────────────
  {
    id: 'nih_nlm_malaria',
    name: 'NIH-NLM Malaria',
    fullName: 'NIH-NLM Thin Blood Smears Pf (Plasmodium falciparum)',
    description: 'Field-acquired thin blood smear microscopy images for automated Plasmodium falciparum malaria parasite detection.',
    purpose: 'Malaria parasitology detection on clinical thin blood smears.',
    modality: 'Thin Blood Smear Microscopy',
    domain: 'Malaria Parasitology',
    taskType: 'object_detection',
    annotationType: 'Polygon (converted to Bounding Box)',
    supportedShots: [0, 6],
    imageCount: 965,
    exampleImages: 12,
    testImages: 953,
    testBoxes: null,
    annotatedCells: 'Real Polygon Ground Truth',
    classesCount: 2,
    classes: [
      'Infected RBC',
      'Uninfected RBC',
    ],
    sampleImages: [
      {
        url: '/samples/datasets/malaria_sample_1.jpg',
        caption: 'NIH-NLM Thin Blood Smear — P. falciparum Trophozoite Field',
        tag: 'Thin Smear',
      },
      {
        url: '/samples/datasets/malaria_sample_2.jpg',
        caption: 'NIH-NLM Clinical Microscopy — Erythrocyte Parasitology Field',
        tag: 'Giemsa Stained',
      },
    ],
  },

  // ─── 3. C-NMC 2019 Leukemia ──────────────────────────────────────────────
  {
    id: 'c_nmc_2019',
    name: 'C-NMC 2019 Leukemia',
    fullName: 'C-NMC 2019 B-lineage Acute Lymphoblastic Leukemia',
    description: 'Peripheral blood smear cell classification: malignant ALL blast cells versus healthy normal hematopoietic cells.',
    purpose: 'Acute lymphoblastic leukemia cell classification for clinical hematology support.',
    modality: 'Peripheral Blood Smear Microscopy',
    domain: 'Hematologic Oncology',
    taskType: 'cell_classification',
    annotationType: 'Cell-level Class Labels (ALL / HEM)',
    supportedShots: [0, 6],
    imageCount: 15114,
    exampleImages: 12,
    testImages: 15102,
    testBoxes: null,
    annotatedCells: 'Cell-level Crops',
    classesCount: 2,
    classes: [
      'ALL Blast',
      'Healthy Hematopoietic',
    ],
    sampleImages: [
      {
        url: '/samples/datasets/leukemia_sample_1.jpg',
        caption: 'C-NMC 2019 Malignant B-ALL Lymphoblast Cell Specimen',
        tag: 'ALL Blast',
      },
      {
        url: '/samples/datasets/leukemia_sample_2.jpg',
        caption: 'C-NMC 2019 Normal Hematopoietic Cell Specimen',
        tag: 'Normal Cell',
      },
    ],
  },

  // ─── 4. RedTell Anemia ───────────────────────────────────────────────────
  {
    id: 'redtell_anemia',
    name: 'RedTell Anemia',
    fullName: 'RedTell Sickle Cell & Anemia RBC Morphology Dataset',
    description: 'Microscopy cell classification across Healthy Control, Sickle Cell Disease (SCD), and Thalassemia red blood cells.',
    purpose: 'Red blood cell morphology classification for hemoglobinopathy screening.',
    modality: 'Peripheral Blood Smear Microscopy',
    domain: 'RBC Morphology / Hemoglobinopathy',
    taskType: 'cell_classification',
    annotationType: 'Class-Folder Derived Labels',
    supportedShots: [0, 6],
    imageCount: 158,
    exampleImages: 6,
    testImages: 152,
    testBoxes: null,
    annotatedCells: 'Individual Cell Fields',
    classesCount: 3,
    classes: [
      'Healthy Control',
      'Sickle Cell Disease',
      'Thalassemia',
    ],
    sampleImages: [
      {
        url: '/samples/datasets/anemia_sample_1.jpg',
        caption: 'RedTell RBC Morphology — Sickle Cell & Thalassemia Specimen',
        tag: 'Fluo-4 Stained',
      },
      {
        url: '/samples/datasets/anemia_sample_2.jpg',
        caption: 'RedTell RBC Field — Erythrocyte Morphology Analysis',
        tag: 'Brightfield Optical',
      },
    ],
  },

  // ─── 5. SIPaKMeD Cervical ────────────────────────────────────────────────
  {
    id: 'sipakmed',
    name: 'SIPaKMeD Cervical',
    fullName: 'SIPaKMeD Cervical Cytology Pap Smear Dataset',
    description: 'Cervical Pap smear cell classification into 5 morphological categories: dyskeratotic, koilocytotic, metaplastic, parabasal, and superficial-intermediate.',
    purpose: 'Cervical cytology screening and automated dysplasia triage.',
    modality: 'Pap Smear Optical Cytology',
    domain: 'Cervical Cytology & Screening',
    taskType: 'cell_classification',
    annotationType: 'Cytological Morphological Categories',
    supportedShots: [0, 6],
    imageCount: 5015,
    exampleImages: 10,
    testImages: 5005,
    testBoxes: null,
    annotatedCells: 'Isolated Cell Morphology',
    classesCount: 5,
    classes: [
      'Dyskeratotic',
      'Koilocytotic',
      'Metaplastic',
      'Parabasal',
      'Superficial-Intermediate',
    ],
    sampleImages: [
      {
        url: '/samples/datasets/cervical_sample_1.jpg',
        caption: 'SIPaKMeD Pap Smear — Dyskeratotic Cell Morphology Specimen',
        tag: 'Pap Smear Cytology',
      },
      {
        url: '/samples/datasets/cervical_sample_2.jpg',
        caption: 'SIPaKMeD Pap Smear — Squamous Epithelial Isolated Cell Field',
        tag: 'Epithelial Cell',
      },
    ],
  },

  // ─── Micro-OD Sub-Datasets (for backward compatibility & deep inspection) ─
  {
    id: 'BBBC',
    name: 'BBBC',
    fullName: 'Broad Bioimage Benchmark Collection (BBBC041)',
    description: 'Microscopy images containing multiple blood-cell and malaria-related cell categories.',
    purpose: 'Blood-cell and malaria-related microscopy.',
    modality: 'Fluorescence Microscopy',
    domain: 'Fluorescence Staining & Malaria Stages',
    taskType: 'object_detection',
    annotationType: 'Bounding Box',
    supportedShots: [0, 6],
    imageCount: 63,
    exampleImages: 10,
    testImages: 53,
    testBoxes: 4000,
    annotatedCells: '4,000',
    classesCount: 6,
    classes: [
      'Ring Cells',
      'Trophozoite Cells',
      'Gametocyte Cells',
      'Schizont Cells',
      'Red Blood Cells',
      'White Blood Cells',
    ],
    sampleImages: [
      {
        url: '/samples/datasets/bbbc_sample.jpg',
        caption: 'BBBC Fluorescence Microscopy - Blood Cell Specimen',
        tag: 'Exemplar Set',
      },
    ],
  },
  {
    id: 'BCCD',
    name: 'BCCD',
    fullName: 'Blood Cell Count and Detection',
    description: 'Peripheral blood smear microscopy containing blood-cell categories.',
    purpose: 'Peripheral blood-cell detection.',
    modality: 'Peripheral Blood Smear',
    domain: 'Clinical Cytology Smears',
    taskType: 'object_detection',
    annotationType: 'Bounding Box',
    supportedShots: [0, 6],
    imageCount: 63,
    exampleImages: 10,
    testImages: 53,
    testBoxes: 952,
    annotatedCells: '952',
    classesCount: 3,
    classes: [
      'Red Blood Cells',
      'White Blood Cells',
      'Platelets',
    ],
    sampleImages: [
      {
        url: '/samples/datasets/bccd_sample.jpg',
        caption: 'BCCD Peripheral Cytology Smear Field',
        tag: 'Standard Evaluation',
      },
    ],
  },
  {
    id: 'LIVECell',
    name: 'LIVECell',
    fullName: 'Large-scale Phase Contrast Cell Dataset',
    description: 'Phase-contrast microscopy images representing cellular morphology across distinct cell populations.',
    purpose: 'Phase-contrast cellular morphology.',
    modality: 'Phase-Contrast Optical',
    domain: 'Label-free Optical Segmentation',
    taskType: 'object_detection',
    annotationType: 'Bounding Box',
    supportedShots: [0, 6],
    imageCount: 63,
    exampleImages: 10,
    testImages: 53,
    testBoxes: 223,
    annotatedCells: '223',
    classesCount: 3,
    classes: [
      'Spindle Cells',
      'Polygonal Cells',
      'Round Cells',
    ],
    sampleImages: [
      {
        url: '/samples/datasets/livecell_sample.jpg',
        caption: 'LIVECell Phase-Contrast Optical Specimen',
        tag: 'Phase-Contrast',
      },
    ],
  },
  {
    id: 'NIH-3T3',
    name: 'NIH-3T3',
    fullName: 'Mouse Embryonic Fibroblast Cell Line',
    description: 'Phase-contrast brightfield microscopy images used for cellular morphology detection.',
    purpose: 'Phase-contrast cellular morphology.',
    modality: 'Phase-Contrast Brightfield',
    domain: 'Fibroblast Culture Morphology',
    taskType: 'object_detection',
    annotationType: 'Bounding Box',
    supportedShots: [0, 6],
    imageCount: 63,
    exampleImages: 10,
    testImages: 53,
    testBoxes: 376,
    annotatedCells: '376',
    classesCount: 3,
    classes: [
      'Spindle Cells',
      'Polygonal Cells',
      'Round Cells',
    ],
    sampleImages: [
      {
        url: '/samples/datasets/nih3t3_sample.jpg',
        caption: 'NIH-3T3 Fibroblast Phase-Contrast Culture',
        tag: 'Culture Line',
      },
    ],
  },
]

export const KNOWN_CELL_CATEGORIES = [
  { name: 'Red Blood Cells', group: 'Hematology', datasets: ['BBBC', 'BCCD', 'micro_od'] },
  { name: 'White Blood Cells', group: 'Hematology', datasets: ['BBBC', 'BCCD', 'micro_od'] },
  { name: 'Platelets', group: 'Hematology', datasets: ['BCCD', 'micro_od'] },
  { name: 'Infected RBC', group: 'Parasitology', datasets: ['nih_nlm_malaria'] },
  { name: 'Uninfected RBC', group: 'Parasitology', datasets: ['nih_nlm_malaria'] },
  { name: 'ALL Blast', group: 'Leukemia', datasets: ['c_nmc_2019'] },
  { name: 'Healthy Hematopoietic', group: 'Leukemia', datasets: ['c_nmc_2019'] },
  { name: 'Healthy Control', group: 'Anemia', datasets: ['redtell_anemia'] },
  { name: 'Sickle Cell Disease', group: 'Anemia', datasets: ['redtell_anemia'] },
  { name: 'Thalassemia', group: 'Anemia', datasets: ['redtell_anemia'] },
  { name: 'Dyskeratotic', group: 'Cervical', datasets: ['sipakmed'] },
  { name: 'Koilocytotic', group: 'Cervical', datasets: ['sipakmed'] },
  { name: 'Metaplastic', group: 'Cervical', datasets: ['sipakmed'] },
  { name: 'Parabasal', group: 'Cervical', datasets: ['sipakmed'] },
  { name: 'Superficial-Intermediate', group: 'Cervical', datasets: ['sipakmed'] },
  { name: 'Ring Cells', group: 'Parasitology', datasets: ['BBBC', 'micro_od'] },
  { name: 'Trophozoite Cells', group: 'Parasitology', datasets: ['BBBC', 'micro_od'] },
  { name: 'Gametocyte Cells', group: 'Parasitology', datasets: ['BBBC', 'micro_od'] },
  { name: 'Schizont Cells', group: 'Parasitology', datasets: ['BBBC', 'micro_od'] },
  { name: 'Spindle Cells', group: 'Morphology', datasets: ['LIVECell', 'NIH-3T3', 'micro_od'] },
  { name: 'Polygonal Cells', group: 'Morphology', datasets: ['LIVECell', 'NIH-3T3', 'micro_od'] },
  { name: 'Round Cells', group: 'Morphology', datasets: ['LIVECell', 'NIH-3T3', 'micro_od'] },
]

export const DATASET_PURPOSES = [
  {
    name: 'Micro-OD',
    summary: 'Standardized multi-domain optical microscopy benchmark.',
    domain: 'Multi-modal fluorescence, phase-contrast, brightfield',
  },
  {
    name: 'NIH-NLM Malaria',
    summary: 'Plasmodium falciparum thin blood smear detection.',
    domain: 'Parasitic stage detection and infected RBC identification',
  },
  {
    name: 'C-NMC 2019 Leukemia',
    summary: 'B-lineage ALL blast versus normal cell classification.',
    domain: 'Clinical peripheral blood smear hematologic triage',
  },
  {
    name: 'RedTell Anemia',
    summary: 'Sickle cell disease and thalassemia morphological triage.',
    domain: 'RBC morphology and hemoglobinopathy screening',
  },
  {
    name: 'SIPaKMeD Cervical',
    summary: 'Pap smear cell cytology classification into 5 morphological classes.',
    domain: 'Automated cervical cancer cytology triage',
  },
]
