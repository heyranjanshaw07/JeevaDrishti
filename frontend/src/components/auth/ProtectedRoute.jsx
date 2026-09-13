import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'

/**
 * ProtectedRoute Guard
 * 
 * Intercepts unauthenticated navigation attempts to protected application routes
 * (such as /dashboard, /analyze).
 * 
 * If unauthenticated:
 * - Redirects to /login (which hosts the full-screen Iris experience).
 * - Uses replace={true} so browser history does not keep the protected URL,
 *   preventing back/forward button navigation from exposing protected views.
 * 
 * If authenticated:
 * - Renders children.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAppStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
