import { useState, useCallback } from 'react'
import { runFullPipeline } from '@/services/api'
import { useAppStore } from '@/store/appStore'

/**
 * useDetection — manages the full image upload → detection flow.
 * Uses the real backend pipeline (B6 integration).
 */
export function useDetection() {
  const { detection, setDetectionConfig, setDetectionResults, setDetectionRunning } = useAppStore()

  const [file, setFileLocal] = useState(null)
  const [preview, setPreviewLocal] = useState(null)
  const [pipelineStage, setPipelineStage] = useState('idle')
  const [error, setError] = useState(null)

  const setFile = (f) => {
    setFileLocal(f)
    setDetectionConfig({ image: f ? f.name : null })
  }

  const setPreview = (url) => {
    setPreviewLocal(url)
    setDetectionConfig({ imagePreview: url })
  }

  const setDataset = (ds) => setDetectionConfig({ dataset: ds })
  const setShotMode = (mode) => setDetectionConfig({ shotMode: mode })

  // Map shot mode display strings → integer (e.g. '3-shot' → 3)
  const shotModeToInt = (mode) => {
    const normalized = String(mode).replace('-shot', '').replace(' Shot', '').trim()
    const n = parseInt(normalized, 10)
    return isNaN(n) ? 0 : n
  }

  const runDetectionFn = useCallback(async () => {
    if (!file) return
    setDetectionRunning(true)
    setDetectionResults(null)
    setError(null)
    setPipelineStage('starting')

    try {
      const shots = shotModeToInt(detection.shotMode)
      const result = await runFullPipeline(
        file,
        detection.dataset,
        shots,
        (stage) => setPipelineStage(stage)
      )
      setDetectionResults(result)
    } catch (err) {
      console.error('Detection failed:', err)
      setError(err.message || 'Analysis failed')
      setDetectionRunning(false)
    } finally {
      setPipelineStage('idle')
    }
  }, [file, detection.dataset, detection.shotMode, setDetectionRunning, setDetectionResults])

  return {
    // State
    dataset: detection.dataset,
    shotMode: detection.shotMode,
    file,
    preview,
    results: detection.results,
    isRunning: detection.isRunning,
    pipelineStage,
    error,
    // Setters
    setDataset,
    setShotMode,
    setFile,
    setPreview,
    // Actions
    runDetection: runDetectionFn,
  }
}
