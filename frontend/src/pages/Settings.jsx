import PlaceholderPage from './PlaceholderPage'
import { Settings as SettingsIcon } from 'lucide-react'

export default function Settings() {
  return (
    <PlaceholderPage
      title="Laboratory Settings"
      route="/settings"
      systemTag="SYSTEM CONFIG"
      description="API endpoints, inference threshold calibration, foundation model weights selection, and display telemetry preferences."
      icon={SettingsIcon}
    />
  )
}
