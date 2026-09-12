import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/ui/Sidebar'
import Navbar from '@/components/ui/Navbar'
import { motion } from 'framer-motion'

/**
 * Dashboard layout — sidebar + top nav + content area
 */
export default function DashboardLayout() {
  return (
    <div className="h-screen flex bg-void sci-grid overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
