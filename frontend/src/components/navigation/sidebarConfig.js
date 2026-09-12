import {
  LayoutDashboard,
  ScanLine,
  GitFork,
  BarChart3,
  Settings,
} from 'lucide-react'

export const SIDEBAR_SECTIONS = [
  {
    category: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    category: 'ANALYSIS',
    items: [
      { label: 'Analyze', path: '/analyze', icon: ScanLine },
    ],
  },
  {
    category: 'RESEARCH',
    items: [
      { label: 'Pipeline', path: '/pipeline', icon: GitFork },
      { label: 'Benchmark', path: '/benchmark', icon: BarChart3 },
    ],
  },
]

export const SETTINGS_ITEM = {
  label: 'Settings',
  path: '/settings',
  icon: Settings,
}
