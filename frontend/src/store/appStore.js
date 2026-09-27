import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setStoredToken, clearStoredToken, logoutUser, verifyStoredToken } from '@/services/api'

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ─── Auth ─────────────────────────────────────────────────────────────
      isAuthenticated: false,
      user: null,

      /**
       * Store user data + JWT token.
       * userData should include a `token` field returned by loginUser / signupUser.
       */
      login: (userData) => {
        if (userData?.token) {
          setStoredToken(userData.token)
        }
        set({ isAuthenticated: true, user: userData })
      },

      /**
       * Clear auth state + remove token from localStorage + notify backend.
       */
      logout: () => {
        clearStoredToken()
        // Fire-and-forget backend logout (stateless JWT, so this is a best-effort call)
        logoutUser().catch(() => {})
        set({ isAuthenticated: false, user: null })
      },

      // ─── Detection State ───────────────────────────────────────────────────
      detection: {
        results: null,
        isRunning: false,
        dataset: 'BCCD',
        shotMode: '0-shot',
        image: null,
        imagePreview: null,
      },

      setDetectionConfig: (config) =>
        set((state) => ({ detection: { ...state.detection, ...config } })),

      setDetectionResults: (results) =>
        set((state) => ({ detection: { ...state.detection, results, isRunning: false } })),

      setDetectionRunning: (isRunning) =>
        set((state) => ({ detection: { ...state.detection, isRunning } })),

      // ─── Benchmark State ───────────────────────────────────────────────────
      benchmark: {
        selectedShots: ['0-shot', '6-shot'],
        selectedDataset: 'all',
      },

      setBenchmarkConfig: (config) =>
        set((state) => ({ benchmark: { ...state.benchmark, ...config } })),

      // ─── UI State ──────────────────────────────────────────────────────────
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      // ─── Logout Modal State ────────────────────────────────────────────────
      isLogoutModalOpen: false,
      openLogoutModal: () => set({ isLogoutModalOpen: true }),
      closeLogoutModal: () => set({ isLogoutModalOpen: false }),
    }),
    {
      name: 'jeevadrishi-store',
      // Persist auth state only — detection/benchmark is session-transient
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
)

// ─── Auto-logout on expired JWT ─────────────────────────────────────────────
// When api.js detects a 401, it fires 'jd:auth-expired'.
// We listen here to clear the store so the navbar shows "Sign In" immediately.
if (typeof window !== 'undefined') {
  window.addEventListener('jd:auth-expired', () => {
    useAppStore.getState().logout()
  })
}

// ─── Validate stored token on app start ─────────────────────────────────────
// If the persisted isAuthenticated=true but the JWT has expired, auto-logout.
export async function validateAuthOnStartup() {
  const { isAuthenticated, logout } = useAppStore.getState()
  if (!isAuthenticated) return
  const valid = await verifyStoredToken()
  if (!valid) {
    logout()
  }
}
