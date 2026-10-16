import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { STATUS_CONFIG, STATUS_ORDER } from '../utils/constants.js'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-slate-800">{d.label}</p>
      <p className="text-slate-600">{d.value.toLocaleString()} trials · {d.pct}%</p>
    </div>
  )
}

/** counts: Map(status → n) computed ignoring the status filter itself. */
export default function StatusDonutChart({ counts, selected = [], onToggle }) {
  const total = [...counts.values()].reduce((s, v) => s + v, 0)
  const data = STATUS_ORDER
    .map(k => ({
      key: k, label: STATUS_CONFIG[k]?.label ?? k, value: counts.get(k) ?? 0,
      color: STATUS_CONFIG[k]?.color ?? '#94a3b8',
      pct: total > 0 ? (((counts.get(k) ?? 0) / total) * 100).toFixed(1) : '0.0',
    }))
    .filter(d => d.value > 0)
  const anySel = selected.length > 0

  return (
    <div className="card p-5 h-full flex flex-col">
      <h3 className="card-title">Recruitment status</h3>
      <p className="card-sub">Click a slice or label to filter</p>
      <div className="relative h-44 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="95%" paddingAngle={2}
              onClick={d => onToggle(d.key)} cursor="pointer">
              {data.map(d => (
                <Cell key={d.key} fill={d.color} stroke="#fff" strokeWidth={2}
                  fillOpacity={anySel && !selected.includes(d.key) ? 0.25 : 1} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{total.toLocaleString()}</span>
          <span className="text-[11px] text-slate-500">trials</span>
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
        {data.map(d => {
          const isSel = selected.includes(d.key)
          return (
            <li key={d.key}>
              <button type="button" aria-pressed={isSel} onClick={() => onToggle(d.key)}
                className={`w-full flex items-center gap-1.5 text-xs rounded px-1.5 py-1 hover:bg-slate-50 ${isSel ? 'bg-blue-50 font-semibold' : ''}`}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} aria-hidden="true" />
                <span className="truncate text-slate-700">{d.label}</span>
                <span className="ml-auto tabular-nums text-slate-600">{d.value.toLocaleString()}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
