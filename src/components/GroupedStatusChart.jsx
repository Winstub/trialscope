import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts'
import { STATUS_GROUP_CONFIG } from '../utils/constants.js'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-slate-800">{d.label}</p>
      <p className="text-slate-600">{d.value.toLocaleString()} studies</p>
      <p className="text-slate-400 text-xs mt-0.5">{d.sublabel}</p>
    </div>
  )
}

export default function GroupedStatusChart({ statusCounts, totalStudies }) {
  const data = Object.entries(STATUS_GROUP_CONFIG).map(([key, cfg]) => ({
    key,
    label: cfg.label,
    sublabel: cfg.sublabel,
    value: cfg.statuses.reduce((s, st) => s + (statusCounts[st] ?? 0), 0),
    color: cfg.color,
    pct: '0',
  })).map(d => ({ ...d, pct: totalStudies > 0 ? (d.value / totalStudies * 100).toFixed(1) : '0.0' }))

  return (
    <div className="card p-5 h-full">
      <h3 className="font-semibold text-slate-800 mb-1">Recruitment Groups</h3>
      <p className="text-xs text-slate-400 mb-4">Aggregated into 3 key groups for trend analysis</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 16, right: 24, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            width={100}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => v.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
            {data.map(d => <Cell key={d.key} fill={d.color} />)}
            <LabelList
              dataKey="pct"
              position="top"
              formatter={v => `${v}%`}
              style={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
