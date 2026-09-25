/**
 * Centralized registry of local microscopy image assets for JeevaDrishti datasets.
 * 
 * Rules:
 * - Uses real local project assets only.
 * - No fake or fabricated images.
 * - If a dataset or split has no local assets, it returns an empty array,
 *   prompting the clean scientific empty state.
 */

export const LOCAL_DATASET_IMAGES = [
  {
    id: 'bbbc-sample-01',
    fileName: 'microscopy_cell_sample.jpg',
    url: '/samples/microscopy_cell_sample.jpg',
    dataset: 'BBBC',
    split: 'TEST',
    format: 'JPEG',
    hasAnnotations: false, // Honest flag: no fake bounding boxes fabricated
    annotations: [], // Ready for real [{ x, y, width, height, label }]
    caption: 'BBBC Blood Cell & Parasite Microscopy Field',
  },
  {
    id: 'bccd-sample-01',
    fileName: 'microscopy_field.jpg',
    url: '/images/microscopy_field.jpg',
    dataset: 'BCCD',
    split: 'TEST',
    format: 'JPEG',
    hasAnnotations: false,
    annotations: [],
    caption: 'BCCD Peripheral Blood Cytology Specimen',
  },
]

/**
 * Helper to fetch images for a specific dataset and split
 */
export function getDatasetImages(datasetName, split = 'ALL') {
  return LOCAL_DATASET_IMAGES.filter((img) => {
    const matchDataset = !datasetName || img.dataset.toUpperCase() === datasetName.toUpperCase()
    const matchSplit = split === 'ALL' || img.split.toUpperCase() === split.toUpperCase()
    return matchDataset && matchSplit
  })
}
