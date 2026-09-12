import PlaceholderPage from './PlaceholderPage'
import { FlaskConical } from 'lucide-react'

export default function Experiments() {
  return (
    <PlaceholderPage
      title="Experiments Laboratory"
      route="/experiments"
      systemTag="EXPERIMENT MATRIX"
      description="Zero-shot and few-shot calibration runs, hyperparameter tuning, and ablation studies. Full experiment tracker will be built in subsequent phases."
      icon={FlaskConical}
    />
  )
}
