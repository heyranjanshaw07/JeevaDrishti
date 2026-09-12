import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const SHOT_LABELS = ['0-shot', '1-shot', '3-shot', '6-shot']
const DS_COLORS = { BCCD: '#FF2A55', BBBC: '#FFFFFF', LIVECell: '#DC2626', 'NIH-3T3': '#FFA0B4' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 rounded-lg text-xs space-y-1">
      <p className="text-text-secondary font-mono mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.dataKey}: {(p.value * 100).toFixed(1)}%
        </p>
      ))}
    </div>
  )
}

/**
 * ShotComparison — mF1 across shot modes per dataset (line chart)
 */
export default function ShotComparison({ data }) {
  const chartData = SHOT_LABELS.map((shot) => ({
    shot,
    ...Object.fromEntries(
      data.datasets.map((ds) => [ds, data.per_dataset[ds]?.[shot] || 0])
    ),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="shot"
          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          domain={[0.3, 0.9]}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#94a3b8' }}
        />
        {data.datasets.map((ds) => (
          <Line
            key={ds}
            type="monotone"
            dataKey={ds}
            stroke={DS_COLORS[ds] || '#FF2A55'}
            strokeWidth={2}
            dot={{ fill: DS_COLORS[ds] || '#FF2A55', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
