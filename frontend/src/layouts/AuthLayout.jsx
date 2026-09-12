import { Outlet } from 'react-router-dom'

/**
 * Auth layout — just renders the child page (Login/Signup handle their own split layout)
 */
export default function AuthLayout() {
  return <Outlet />
}
