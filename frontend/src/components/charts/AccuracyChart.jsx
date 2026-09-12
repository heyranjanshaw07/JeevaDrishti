import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#FF2A55', '#FFFFFF', '#DC2626', '#FF6B8B']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 rounded-lg text-xs">
      <p className="text-text-secondary mb-1 font-mono">{label}</p>
      <p className="text-crimson font-bold">{(payload[0].value * 100).toFixed(1)}% mF1</p>
    </div>
  )
}

/**
 * AccuracyChart — mF1 per dataset for selected shot mode
 */
export default function AccuracyChart({ data, selectedShot }) {
  const chartData = data.datasets.map((ds, i) => ({
    name: ds,
    mF1: data.per_dataset[ds]?.[selectedShot] || 0,
    color: COLORS[i % COLORS.length],
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          domain={[0, 1]}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,42,85,0.06)' }} />
        <Bar dataKey="mF1" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
