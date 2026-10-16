import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ROUTE_CONFIG } from '../utils/constants.js'

const GROUP_META = {
  recruiting: { label: 'Overall Recruiting',     color: '#16a34a' },
  active:     { label: 'Active, Not Recruiting',  color: '#2563eb' },
  no_longer:  { label: 'No Longer Recruiting',    color: '#64748b' },
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0)
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2.5 text-sm min-w-[200px]">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-6 text-xs mb-1">
          <span className="flex items-center gap-1.5" style={{ color: p.fill }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.fill }} />
            {p.name}
          </span>
          <span className="font-semibold text-slate-700">{(p.value ?? 0).toLocaleString()}</span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="flex justify-between gap-6 text-xs mt-2 pt-2 border-t border-slate-100">
          <span className="text-slate-500 font-medium">Subtotal shown</span>
          <span className="font-bold text-slate-700">{total.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

export default function RouteBarChart({ routeCounts, routeByGroup }) {
  const [activeGroups, setActiveGroups] = useState(new Set(['recruiting', 'no_longer']))

  if (!routeCounts || !routeByGroup) return null

  function toggleGroup(key) {
    setActiveGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)   // always keep ≥1 active
      } else {
        next.add(key)
      }
      return next
    })
  }

  const data = Object.entries(routeByGroup)
    .map(([route, groups]) => ({
      route,
      recruiting: groups.recruiting ?? 0,
      active:     groups.active     ?? 0,
      no_longer:  groups.no_longer  ?? 0,
      total: (groups.recruiting ?? 0) + (groups.active ?? 0) + (groups.no_longer ?? 0),
    }))
    .filter(d => d.total > 0)
    .sort((a, b) => {
      if (a.route === 'Not Specified') return 1
      if (b.route === 'Not Specified') return -1
      return b.total - a.total
    })

  const specifiedTotal = data.filter(d => d.route !== 'Not Specified').reduce((s, d) => s + d.total, 0)
  const grandTotal     = data.reduce((s, d) => s + d.total, 0)
  const identifiedPct  = grandTotal > 0 ? Math.round((specifiedTotal / grandTotal) * 100) : 0

  const chartHeight = Math.max(240, data.length * 38 + 24)

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold text-slate-800">Route of Administration</h3>
        <span className="tag bg-blue-50 text-blue-700 text-xs">{identifiedPct}% identified</span>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Keyword-extracted from intervention descriptions · {(grandTotal - specifiedTotal).toLocaleString()} studies lacked sufficient text
      </p>

      {/* Group filter toggles */}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(GROUP_META).map(([key, { label, color }]) => {
          const isActive = activeGroups.has(key)
          return (
            <button
              key={key}
              onClick={() => toggleGroup(key)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
              style={
                isActive
                  ? { backgroundColor: color, borderColor: color, color: '#fff' }
                  : { backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#94a3b8' }
              }
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.6)' : color }}
              />
              {label}
            </button>
          )
        })}
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" barCategoryGap="28%" barGap={3} margin={{ left: 0, right: 52, top: 4, bottom: 4 }}>
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
            dataKey="route"
            tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            width={134}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          {activeGroups.has('recruiting') && (
            <Bar
              dataKey="recruiting"
              name={GROUP_META.recruiting.label}
              fill={GROUP_META.recruiting.color}
              radius={[0, 5, 5, 0]}
              maxBarSize={20}
            />
          )}
          {activeGroups.has('active') && (
            <Bar
              dataKey="active"
              name={GROUP_META.active.label}
              fill={GROUP_META.active.color}
              radius={[0, 5, 5, 0]}
              maxBarSize={20}
            />
          )}
          {activeGroups.has('no_longer') && (
            <Bar
              dataKey="no_longer"
              name={GROUP_META.no_longer.label}
              fill={GROUP_META.no_longer.color}
              radius={[0, 5, 5, 0]}
              maxBarSize={20}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
