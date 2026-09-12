import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import GlobalBackground from '@/components/ui/GlobalBackground'
import LogoutModal from '@/components/ui/LogoutModal'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Dashboard from '@/pages/Dashboard'
import Analyze from '@/pages/Analyze'
import Benchmark from '@/pages/Benchmark'
import Dataset from '@/pages/Dataset'
import DatasetDetailPage from '@/pages/DatasetDetailPage'
import Research from '@/pages/Research'
import Pipeline from '@/pages/Pipeline'
import ResearchInsights from '@/pages/ResearchInsights'
import Experiments from '@/pages/Experiments'
import Settings from '@/pages/Settings'
import About from '@/pages/About'

export default function App() {
  const location = useLocation()

  return (
    <GlobalBackground>
        <LogoutModal />
        <Routes>
          {/* 1. Landing */}
          <Route path="/" element={<Landing />} />

          {/* 2. Login */}
          <Route path="/login" element={<Login />} />

          {/* 3. Signup */}
          <Route path="/signup" element={<Signup />} />

          {/* 4. Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* 5. Analyze */}
          <Route path="/analyze" element={<Analyze />} />

          {/* 6. Benchmark */}
          <Route path="/benchmark" element={<Benchmark />} />

          {/* 7. Datasets */}
          <Route path="/dataset" element={<Dataset />} />
          <Route path="/datasets" element={<Dataset />} />
          <Route path="/dataset/:datasetName" element={<DatasetDetailPage />} />
          <Route path="/datasets/:datasetName" element={<DatasetDetailPage />} />

          {/* 8. Research, Pipeline & Insights */}
          <Route path="/research" element={<Research />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/insights" element={<ResearchInsights />} />

          {/* 9. Experiments */}
          <Route path="/experiments" element={<Experiments />} />

          {/* 10. System */}
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </GlobalBackground>
  )
}
