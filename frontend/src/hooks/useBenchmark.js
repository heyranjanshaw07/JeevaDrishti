import { useState, useEffect } from 'react'
import { getBenchmark, MOCK_BENCHMARK_DATA } from '@/services/api'
import { useAppStore } from '@/store/appStore'

/**
 * useBenchmark — fetches and manages benchmark data and filter state
 */
export function useBenchmark() {
  const { benchmark, setBenchmarkConfig } = useAppStore()
  const [data, setData] = useState(MOCK_BENCHMARK_DATA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getBenchmark()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const setSelectedShots = (shots) => setBenchmarkConfig({ selectedShots: shots })
  const setSelectedDataset = (ds) => setBenchmarkConfig({ selectedDataset: ds })

  // Computed: filtered chart data
  const filteredMetrics = Object.fromEntries(
    benchmark.selectedShots.map((shot) => [shot, data.metrics[shot]])
  )

  return {
    data,
    loading,
    error,
    selectedShots: benchmark.selectedShots,
    selectedDataset: benchmark.selectedDataset,
    filteredMetrics,
    setSelectedShots,
    setSelectedDataset,
  }
}
