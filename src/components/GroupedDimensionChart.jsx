import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { axisLabel, isNarrow } from '../utils/format.js'

const GROUP_META = {
  recruiting: { label: 'Overall Recruiting',    color: '#16a34a' },
  active:     { label: 'Active, Not Recruiting', color: '#2563eb' },
  no_longer:  { label: 'No Longer Recruiting',   color: '#64748b' },
}

// Keys treated as "unknown / unclassified" — dimmed and sorted last
const UNKNOWN_KEYS = new Set(['UNKNOWN','Unknown','Not Specified','NA','N/A'])

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const shown = payload.reduce((s, p) => s + (p.value ?? 0), 0)
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xl px-3 py-2.5 text-sm min-w-[210px]">
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
          <span className="text-slate-500">Shown subtotal</span>
          <span className="font-bold text-slate-700">{shown.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

export default function GroupedDimensionChart({
  byGroup,
  config,
  defaultExpanded = false,
  defaultGroups = ['recruiting', 'no_longer'],
}) {
  const [expanded, setExpanded]         = useState(defaultExpanded)
  const [activeGroups, setActiveGroups] = useState(new Set(defaultGroups))

  if (!byGroup) return null

  function toggleGroup(key) {
    setActiveGroups(prev => {
      const next = new Set(prev)
      if (next.has(key) && next.size > 1) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Build sorted data rows
  const data = Object.entries(byGroup)
    .map(([key, g]) => ({
      key,
      label:     config.labels?.[key] ?? key,
      color:     config.colors?.[key] ?? '#94a3b8',
      recruiting: g.recruiting ?? 0,
      active:     g.active     ?? 0,
      no_longer:  g.no_longer  ?? 0,
      total: (g.recruiting ?? 0) + (g.active ?? 0) + (g.no_longer ?? 0),
      isUnknown: UNKNOWN_KEYS.has(key),
    }))
    .filter(d => d.total > 0)
    .sort((a, b) => {
      if (a.isUnknown !== b.isUnknown) return a.isUnknown ? 1 : -1
      if (config.order) {
        const ai = config.order.indexOf(a.key), bi = config.order.indexOf(b.key)
        if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      }
      return b.total - a.total
    })

  const grandTotal    = data.reduce((s, d) => s + d.total, 0)
  const specifiedTotal = data.filter(d => !d.isUnknown).reduce((s, d) => s + d.total, 0)
  const topLabel      = data.filter(d => !d.isUnknown)[0]

  const chartHeight = Math.max(120, data.length * 36 + 24)

  return (
    <div className="card overflow-hidden">
      {/* Header row — always visible, click to expand */}
      <button
        aria-expanded={expanded}
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <span className="font-semibold text-slate-800">{config.title}</span>
            <span className="ml-2 text-xs text-slate-500 hidden sm:inline">{config.description}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {/* Quick stats shown even when collapsed */}
          {!expanded && topLabel && (
            <span className="text-xs text-slate-500 hidden md:block">
              Top: <span className="font-semibold" style={{ color: topLabel.color }}>{topLabel.label}</span>
              <span className="ml-1 text-slate-500">({topLabel.total.toLocaleString()})</span>
            </span>
          )}
          <span className="text-xs text-slate-500">{data.length} categories</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {/* Group toggle pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {Object.entries(GROUP_META).map(([key, { label, color }]) => {
              const isActive = activeGroups.has(key)
              const cnt = data.filter(d => !d.isUnknown).reduce((s, d) => s + (d[key] ?? 0), 0)
              return (
                <button
                  key={key}
                  onClick={() => toggleGroup(key)}
                  aria-pressed={isActive}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
                  style={isActive
                    ? { backgroundColor: color, borderColor: color, color: '#fff' }
                    : { backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#94a3b8' }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.55)' : color }} />
                  {label}
                  <span className="ml-1 opacity-80">{cnt.toLocaleString()}</span>
                </button>
              )
            })}
          </div>

          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data} layout="vertical" barCategoryGap="28%" barGap={3}
              margin={{ left: 0, right: 56, top: 2, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }}
                tickLine={false} axisLine={false} tickFormatter={v => v.toLocaleString()} />
              <YAxis type="category" dataKey="label"
                tick={({ x, y, payload }) => {
                  const d = data.find(r => r.label === payload.value)
                  return (
                    <text x={x - 6} y={y} dy={4} textAnchor="end"
                      fontSize={11} fontWeight={500}
                      fill={d?.isUnknown ? '#94a3b8' : '#475569'}>
                      <title>{payload.value}</title>{axisLabel(payload.value)}
                    </text>
                  )
                }}
                tickLine={false} axisLine={false} width={isNarrow() ? 96 : 150} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              {activeGroups.has('recruiting') && (
                <Bar dataKey="recruiting" name={GROUP_META.recruiting.label}
                  fill={GROUP_META.recruiting.color} radius={[0,5,5,0]} maxBarSize={20} />
              )}
              {activeGroups.has('active') && (
                <Bar dataKey="active" name={GROUP_META.active.label}
                  fill={GROUP_META.active.color} radius={[0,5,5,0]} maxBarSize={20} />
              )}
              {activeGroups.has('no_longer') && (
                <Bar dataKey="no_longer" name={GROUP_META.no_longer.label}
                  fill={GROUP_META.no_longer.color} radius={[0,5,5,0]} maxBarSize={20} />
              )}
            </BarChart>
          </ResponsiveContainer>

          {config.unknownKey && grandTotal > specifiedTotal && (
            <p className="text-xs text-slate-500 mt-2">
              * {(grandTotal - specifiedTotal).toLocaleString()} studies had no extractable data — shown as "{config.unknownKey}" above
            </p>
          )}
        </div>
      )}
    </div>
  )
}
