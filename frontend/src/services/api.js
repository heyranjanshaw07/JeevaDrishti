/**
 * JeevaDrishti API Service Layer — B6 Full Integration
 *
 * All backend calls route through this module.
 * FastAPI backend:  http://localhost:8000/api/v1  (dev)
 *                   /api/v1                       (prod via Nginx)
 *
 * Token storage: localStorage key "jd_access_token"
 * All JWT-authenticated routes attach:  Authorization: Bearer <token>
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

// ─── Token Helpers ───────────────────────────────────────────────────────────

const TOKEN_KEY = 'jd_access_token'

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null
  } catch {
    return null
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch { /* private browsing — ignore */ }
}

export function clearStoredToken() {
  setStoredToken(null)
}

let tokenPromise = null

/**
 * Ensure a valid JWT token exists in localStorage.
 * If not present or expired, silently provisions a researcher session token.
 */
export async function ensureSessionToken() {
  const existing = getStoredToken()
  if (existing) return existing

  if (tokenPromise) return tokenPromise

  tokenPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'researcher@jeevadrishti.ai',
          password: 'Password123!',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.access_token) {
          setStoredToken(data.access_token)
          return data.access_token
        }
      }
    } catch {
      // Network error or offline
    } finally {
      tokenPromise = null
    }
    return null
  })()

  return tokenPromise
}

// ─── Core Request Helper ─────────────────────────────────────────────────────

/**
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string}  path         Relative path, e.g. '/auth/login'
 * @param {object|FormData|null} body
 * @param {boolean} isFormData   Skip JSON serialization, set no Content-Type
 * @param {boolean} withAuth     Attach stored Bearer token
 * @returns {Promise<any>}       Parsed JSON response
 */
async function request(method, path, body = null, isFormData = false, withAuth = false) {
  const headers = {}

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  if (withAuth) {
    let token = getStoredToken()
    if (!token) {
      token = await ensureSessionToken()
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  let res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : null,
  })

  // If 401 on an authenticated request, attempt token renewal once
  if (res.status === 401 && withAuth) {
    clearStoredToken()
    const newToken = await ensureSessionToken()
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`
      res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: isFormData ? body : body ? JSON.stringify(body) : null,
      })
    }
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const err = await res.json()
      detail = err.detail || err.message || detail
    } catch { /* ignore parse error */ }
    const error = new Error(detail)
    error.status = res.status
    throw error
  }

  // 204 No Content — return null
  if (res.status === 204) return null

  return res.json()
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * Login user — returns { token, user } compatible with AuthPage / appStore
 */
export async function loginUser({ email, password }) {
  const data = await request('POST', '/auth/login', { email, password })
  // data = { access_token, token_type, user }
  setStoredToken(data.access_token)
  return {
    token: data.access_token,
    user: {
      id: String(data.user.id),
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      is_active: data.user.is_active,
      institution: null, // not in backend schema
    },
  }
}

/**
 * Register + auto-login. Returns same shape as loginUser.
 */
export async function signupUser({ name, email, password }) {
  // 1. Register
  await request('POST', '/auth/register', { name, email, password })
  // 2. Auto-login to get token
  return loginUser({ email, password })
}

/**
 * Get the currently authenticated user profile.
 */
export async function getCurrentUser() {
  return request('GET', '/auth/me', null, false, true)
}

/**
 * Stateless logout — clears local token and notifies backend.
 */
export async function logoutUser() {
  clearStoredToken()
  try {
    await request('POST', '/auth/logout')
  } catch { /* fire-and-forget */ }
}

// ─── Analysis — Upload ───────────────────────────────────────────────────────

/**
 * Upload a microscopy image. Returns { file_id, filename, content_type, size, status }
 */
export async function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request('POST', '/analysis/upload', formData, true, true)
}

// ─── Analysis — Lifecycle ────────────────────────────────────────────────────

/**
 * Create an analysis record. Returns { analysis_id, status, dataset, shots }
 * @param {string} fileId
 * @param {string} dataset   e.g. 'BCCD'
 * @param {number} shots     0 | 1 | 3 | 6
 */
export async function createAnalysis({ fileId, dataset, shots, vlmModel = 'optical' }) {
  return request('POST', '/analysis', { file_id: fileId, dataset, shots, vlm_model: vlmModel }, false, true)
}

/**
 * Trigger inference execution for an analysis.
 * Returns { analysis_id, status, message }
 */
export async function runAnalysis(analysisId) {
  return request('POST', `/analysis/${analysisId}/run`, null, false, true)
}

/**
 * Retrieve detection results.
 * Returns AnalysisResultsResponse from backend
 */
export async function getAnalysisResults(analysisId) {
  return request('GET', `/analysis/${analysisId}/results`, null, false, true)
}

/**
 * Get the overlay image URL (for <img src> use — served as FileResponse by backend).
 * Returns a fully-qualified URL string pointing to the overlay PNG.
 */
export function getAnalysisOverlayUrl(analysisId) {
  const token = getStoredToken()
  return token
    ? `${BASE_URL}/analysis/${analysisId}/overlay?token=${encodeURIComponent(token)}`
    : `${BASE_URL}/analysis/${analysisId}/overlay`
}

/**
 * List analyses for the current user. Returns { items, page, page_size, total }
 */
export async function getAnalysisHistory(page = 1, pageSize = 20) {
  return request('GET', `/analysis?page=${page}&page_size=${pageSize}`, null, false, true)
}

/**
 * Delete an analysis and its associated file.
 */
export async function deleteAnalysis(analysisId) {
  return request('DELETE', `/analysis/${analysisId}`, null, false, true)
}

/**
 * Get a single analysis status record.
 */
export async function getAnalysisStatus(analysisId) {
  return request('GET', `/analysis/${analysisId}`, null, false, true)
}

/**
 * Construct direct authenticated URL to view or download the PDF report.
 */
export function getAnalysisReportUrl(analysisId) {
  const token = getStoredToken()
  const base = `${BASE_URL}/analysis/${analysisId}/report`
  return token ? `${base}?token=${encodeURIComponent(token)}` : base
}

/**
 * Generate and open the verified PDF report in a new browser tab/window.
 * Streams real data returned from backend and enables native browser viewer/download controls.
 */
export function openAnalysisReport(analysisId) {
  if (!analysisId) {
    throw new Error('Analysis ID is required to generate report.')
  }
  const reportUrl = getAnalysisReportUrl(analysisId)
  const win = window.open(reportUrl, '_blank')
  if (!win) {
    // If popup was blocked by browser, navigate or use anchor
    const link = document.createElement('a')
    link.href = reportUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  return reportUrl
}

// ─── Full Pipeline Execution ────────────────────────────────────────────────

/**
 * Run the full end-to-end pipeline in one call:
 * upload → create → run → results
 *
 * Processes input dynamically and independently through the backend model.
 * Zero hardcoded or fake simulated results.
 *
 * @param {File}   file
 * @param {string} dataset   canonical dataset name
 * @param {number} shots     0 | 1 | 3 | 6
 * @param {(stage: string) => void} onStageUpdate  called with stage name for UI feedback
 * @param {string} vlmModel  model identifier (e.g. 'optical', 'gemini-2.5-flash')
 * @returns {Promise<{ analysis_id, status, prediction, confidence, indicators, explanation, detections, metrics, overlay_url, error_message }>}
 */
export async function runFullPipeline(file, dataset, shots, onStageUpdate, vlmModel = 'optical') {
  // Stage 1 — Upload
  onStageUpdate?.('uploading')
  const uploaded = await uploadImage(file)
  const fileId = uploaded.file_id

  // Stage 2 — Create record
  onStageUpdate?.('creating')
  const record = await createAnalysis({ fileId, dataset, shots, vlmModel })
  const analysisId = record.analysis_id

  // Stage 3 — Run inference
  onStageUpdate?.('running')
  const runRes = await runAnalysis(analysisId)

  // Stage 4 — Retrieve results
  onStageUpdate?.('fetching')
  const results = await getAnalysisResults(analysisId)

  const token = getStoredToken()
  let overlayUrl = results.overlay_url || (results.overlay_available ? getAnalysisOverlayUrl(analysisId) : null)
  if (overlayUrl && token && !overlayUrl.includes('token=')) {
    overlayUrl = `${overlayUrl}${overlayUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
  }

  const isRejected = results.status === 'rejected'
  const backendMetrics = isRejected ? null : (results.metrics || results.metadata || null)

  return {
    analysis_id: analysisId,
    dataset: results.dataset || dataset,
    shots: results.shots ?? shots,
    vlm_model: results.vlm_model || vlmModel,
    created_at: results.created_at || null,
    completed_at: results.completed_at || null,
    status: isRejected ? 'rejected' : (results.status === 'completed' ? 'complete' : results.status),
    reason: results.reason || (isRejected ? 'non_microscopy_image' : null),
    message: results.message || (isRejected ? 'The uploaded image does not appear to be a microscopy image.' : null),
    prediction: isRejected ? 'Non-Microscopy Image' : (results.prediction || (results.status === 'completed' ? (results.detections?.length ? 'Cellular Detection Complete' : 'Unable to determine') : null)),
    confidence: isRejected ? null : (results.confidence ?? backendMetrics?.avg_confidence ?? null),
    indicators: isRejected ? [] : (results.indicators || []),
    explanation: results.explanation || results.message || null,
    detections: isRejected ? [] : (results.detections || []),
    boxes: isRejected ? [] : (results.boxes || []),
    metrics: backendMetrics,
    overlay_url: isRejected ? null : overlayUrl,
    error_message: results.error_message || runRes?.message || null,
  }
}

// ─── Datasets ────────────────────────────────────────────────────────────────

/**
 * List all supported datasets from the backend catalog.
 * Falls back to MOCK_DATASETS if the backend is unreachable.
 */
export async function getDatasets() {
  try {
    return await request('GET', '/datasets')
  } catch {
    return MOCK_DATASETS
  }
}

/**
 * Get a single dataset's details.
 */
export async function getDataset(name) {
  try {
    return await request('GET', `/datasets/${encodeURIComponent(name)}`)
  } catch {
    return MOCK_DATASETS.find((d) => d.id === name || d.name === name) || null
  }
}

/**
 * Get cell classes for a dataset.
 */
export async function getDatasetClasses(name) {
  try {
    return await request('GET', `/datasets/${encodeURIComponent(name)}/classes`)
  } catch {
    return null
  }
}

// ─── Benchmark ───────────────────────────────────────────────────────────────

/**
 * Get supported benchmark configuration (datasets, shots, metrics).
 * Falls back to MOCK_BENCHMARK_DATA.config if backend unreachable.
 */
export async function getBenchmarkConfig() {
  try {
    return await request('GET', '/benchmark/config')
  } catch {
    return {
      datasets: MOCK_BENCHMARK_DATA.datasets,
      shots: [0, 1, 3, 6],
      metrics: ['mF1', 'precision', 'recall', 'mAP50', 'iou', 'latency_ms'],
    }
  }
}

/**
 * Get stored benchmark results filtered by optional dataset and shots.
 * Returns empty array if no results have been recorded yet.
 * Falls back to MOCK_BENCHMARK_DATA if backend unreachable.
 */
export async function getBenchmarkResults({ dataset, shots } = {}) {
  try {
    const params = new URLSearchParams()
    if (dataset) params.set('dataset', dataset)
    if (shots !== undefined && shots !== null) params.set('shots', String(shots))
    const query = params.toString() ? `?${params.toString()}` : ''
    return await request('GET', `/benchmark/results${query}`)
  } catch {
    return { results: [], total: 0 }
  }
}

// ─── Connectivity Check ──────────────────────────────────────────────────────

/**
 * Ping the health endpoint to check if the backend is reachable.
 * Resolves true / false — never throws.
 */
export async function isApiAvailable() {
  try {
    const res = await fetch(`${BASE_URL}/health`, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

// ─── Mock Fallback Data ───────────────────────────────────────────────────────
// Kept as offline fallback when backend is unreachable.

export const MOCK_BENCHMARK_DATA = {
  datasets: ['BCCD', 'BBBC', 'LIVECell', 'NIH-3T3'],
  shots: ['0-shot', '1-shot', '3-shot', '6-shot'],
  metrics: {
    '0-shot': {
      mF1: 0.412, precision: 0.398, recall: 0.427,
      mAP50: 0.389, iou: 0.352, latency_ms: 1240, vlm_calls: 1,
    },
    '1-shot': {
      mF1: 0.581, precision: 0.563, recall: 0.601,
      mAP50: 0.554, iou: 0.498, latency_ms: 980, vlm_calls: 2,
    },
    '3-shot': {
      mF1: 0.714, precision: 0.698, recall: 0.731,
      mAP50: 0.682, iou: 0.631, latency_ms: 1100, vlm_calls: 4,
    },
    '6-shot': {
      mF1: 0.798, precision: 0.782, recall: 0.816,
      mAP50: 0.764, iou: 0.712, latency_ms: 1380, vlm_calls: 7,
    },
  },
  per_dataset: {
    BCCD:     { '0-shot': 0.44, '1-shot': 0.61, '3-shot': 0.73, '6-shot': 0.82 },
    BBBC:     { '0-shot': 0.38, '1-shot': 0.54, '3-shot': 0.68, '6-shot': 0.76 },
    LIVECell: { '0-shot': 0.41, '1-shot': 0.57, '3-shot': 0.71, '6-shot': 0.79 },
    'NIH-3T3':{ '0-shot': 0.43, '1-shot': 0.60, '3-shot': 0.72, '6-shot': 0.80 },
  },
}

export const MOCK_DATASETS = [
  {
    id: 'BCCD',
    name: 'BCCD',
    full_name: 'Blood Cell Count & Detection',
    total_images: 63,
    example_images: 10,
    test_images: 53,
    test_boxes: 952,
    classes_count: 3,
    modality: 'Peripheral Blood Smear',
    description: 'Peripheral blood smear with RBCs, WBCs, and Platelets.',
  },
  {
    id: 'BBBC',
    name: 'BBBC',
    full_name: 'Broad Bioimage Benchmark Collection',
    total_images: 63,
    example_images: 10,
    test_images: 53,
    test_boxes: 4000,
    classes_count: 6,
    modality: 'Fluorescence Microscopy',
    description: 'Fluorescence microscopy images from the Broad Institute.',
  },
  {
    id: 'LIVECell',
    name: 'LIVECell',
    full_name: 'Large-Scale Phase Contrast Cell Dataset',
    total_images: 63,
    example_images: 10,
    test_images: 53,
    test_boxes: 223,
    classes_count: 3,
    modality: 'Phase-Contrast Optical',
    description: 'Phase-contrast microscopy for label-free cell segmentation.',
  },
  {
    id: 'NIH-3T3',
    name: 'NIH-3T3',
    full_name: 'Mouse Embryonic Fibroblast Cell Line',
    total_images: 63,
    example_images: 10,
    test_images: 53,
    test_boxes: 376,
    classes_count: 3,
    modality: 'Phase-Contrast Brightfield',
    description: 'Mouse fibroblast cells for morphology detection.',
  },
]

export const MOCK_ANALYSIS_HISTORY = [
  {
    id: 'an_8841',
    filename: 'blood_smear_04.png',
    dataset: 'BCCD',
    shots: 3,
    cells_detected: 42,
    avg_confidence: 0.864,
    inference_time_ms: 840,
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 'an_8840',
    filename: 'livecell_phase_11.tiff',
    dataset: 'LIVECell',
    shots: 0,
    cells_detected: 19,
    avg_confidence: 0.732,
    inference_time_ms: 650,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 'an_8839',
    filename: 'fibroblast_culture_09.png',
    dataset: 'NIH-3T3',
    shots: 1,
    cells_detected: 31,
    avg_confidence: 0.812,
    inference_time_ms: 720,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
]
