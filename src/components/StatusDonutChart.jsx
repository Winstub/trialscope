import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { STATUS_CONFIG, STATUS_ORDER } from '../utils/constants.js'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-slate-800">{d.label}</p>
      <p className="text-slate-600">{d.value.toLocaleString()} studies</p>
      <p className="text-slate-400">{d.pct}% of total</p>
    </div>
  )
}

const CustomLegend = ({ payload }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
    {payload.map(({ value, color }) => (
      <span key={value} className="flex items-center gap-1.5 text-xs text-slate-600">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        {value}
      </span>
    ))}
  </div>
)

export default function StatusDonutChart({ statusCounts, totalStudies }) {
  const data = STATUS_ORDER
    .map(k => ({
      key: k,
      label: STATUS_CONFIG[k]?.label ?? k,
      value: statusCounts[k] ?? 0,
      color: STATUS_CONFIG[k]?.color ?? '#94a3b8',
      pct: totalStudies > 0 ? ((statusCounts[k] ?? 0) / totalStudies * 100).toFixed(1) : '0.0',
    }))
    .filter(d => d.value > 0)

  const innerLabel = ({ cx, cy }) => (
    <>
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-slate-800" style={{ fontSize: 22, fontWeight: 700 }}>
        {totalStudies.toLocaleString()}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 11 }}>
        total studies
      </text>
    </>
  )

  return (
    <div className="card p-5 h-full">
      <h3 className="font-semibold text-slate-800 mb-1">Recruitment Status</h3>
      <p className="text-xs text-slate-400 mb-4">Distribution across all 9 statuses</p>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius="52%"
            outerRadius="72%"
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={innerLabel}
          >
            {data.map(d => <Cell key={d.key} fill={d.color} stroke="white" strokeWidth={2} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
