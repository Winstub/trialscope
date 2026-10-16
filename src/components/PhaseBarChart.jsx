import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts'
import { PHASE_CONFIG, PHASE_ORDER } from '../utils/constants.js'

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

export default function PhaseBarChart({ phaseCounts }) {
  const total = PHASE_ORDER.reduce((s, k) => s + (phaseCounts[k] ?? 0), 0)

  const data = PHASE_ORDER
    .map(k => ({
      key: k,
      label: PHASE_CONFIG[k]?.label ?? k,
      shortLabel: PHASE_CONFIG[k]?.shortLabel ?? k,
      value: phaseCounts[k] ?? 0,
      color: PHASE_CONFIG[k]?.color ?? '#94a3b8',
      pct: total > 0 ? ((phaseCounts[k] ?? 0) / total * 100).toFixed(1) : '0.0',
    }))
    .filter(d => d.value > 0)

  return (
    <div className="card p-5 h-full">
      <h3 className="font-semibold text-slate-800 mb-1">Trial Phase Distribution</h3>
      <p className="text-xs text-slate-400 mb-4">Studies by development phase (multi-phase trials counted in each phase)</p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 40, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => v.toLocaleString()}
          />
          <YAxis
            type="category"
            dataKey="shortLabel"
            tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            width={66}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={36}>
            {data.map(d => <Cell key={d.key} fill={d.color} />)}
            <LabelList
              dataKey="value"
              position="right"
              formatter={v => v.toLocaleString()}
              style={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
