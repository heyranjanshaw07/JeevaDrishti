import { getDemoAuthCredentials } from '@/services/api'

const FALLBACK_DEMO_AUTH = {
  login: {
    email: 'dr.sharma@aiims.edu',
    password: 'microscopy-lab-key-2026',
  },
  signup: {
    name: 'Dr. Evelyn Sharma',
    email: 'dr.evelyn.researcher@aiims.edu',
    password: 'microscopy-lab-key-2026',
    confirmPassword: 'microscopy-lab-key-2026',
  },
}

export async function loadDemoAuthData(mode = 'login') {
  const normalizedMode = mode === 'signup' || mode === 'register' ? 'signup' : 'login'

  try {
    const data = await getDemoAuthCredentials()
    if (data && data[normalizedMode]) {
      return { ...data[normalizedMode] }
    }
  } catch {
    // Graceful fallback to verified local research credentials
  }

  return { ...FALLBACK_DEMO_AUTH[normalizedMode] }
}

