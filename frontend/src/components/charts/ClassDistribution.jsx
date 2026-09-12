import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const SHOT_COLORS = {
  '0-shot': '#64748b',
  '1-shot': '#FFA0B4',
  '3-shot': '#FFFFFF',
  '6-shot': '#FF2A55',
}

const METRIC_LABELS = {
  mF1: 'mF1',
  precision: 'Precision',
  recall: 'Recall',
  mAP50: 'mAP@50',
  iou: 'IoU',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 rounded-lg text-xs space-y-1">
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium font-mono">
          {p.name}: {(p.value * 100).toFixed(1)}%
        </p>
      ))}
    </div>
  )
}

/**
 * ClassDistribution — radar chart comparing all shot modes across core metrics
 */
export default function ClassDistribution({ data }) {
  const chartData = Object.entries(METRIC_LABELS).map(([key, label]) => ({
    metric: label,
    ...Object.fromEntries(
      Object.entries(data.metrics).map(([shot, vals]) => [shot, vals[key]])
    ),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 1]}
          tickCount={4}
          tick={{ fill: '#475569', fontSize: 9 }}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#475569' }}
        />
        {Object.entries(SHOT_COLORS).map(([shot, color]) => (
          <Radar
            key={shot}
            name={shot}
            dataKey={shot}
            stroke={color}
            fill={color}
            fillOpacity={0.08}
            strokeWidth={1.5}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  )
}
