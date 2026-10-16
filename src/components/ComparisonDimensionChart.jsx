import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { axisLabel, isNarrow } from '../utils/format.js'
import { statusGroup } from '../utils/api.js'

const UNKNOWN_KEYS = new Set(['UNKNOWN','Unknown','Not Specified','NA','N/A'])

const GROUP_FILTER_META = {
  all:        { label: 'All',                keys: ['recruiting','active','no_longer'] },
  recruiting: { label: 'Overall Recruiting', keys: ['recruiting'] },
  active:     { label: 'Active',             keys: ['active'] },
  no_longer:  { label: 'No Longer Rec.',     keys: ['no_longer'] },
}

const CustomTooltip = ({ active, payload, label, normalize }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xl px-3 py-2.5 text-sm min-w-[200px]">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-6 text-xs mb-1">
          <span className="flex items-center gap-1.5" style={{ color: p.fill }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.fill }} />
            {p.name}
          </span>
          <span className="font-semibold text-slate-700">
            {normalize ? `${(p.value ?? 0).toFixed(1)}%` : (p.value ?? 0).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

function getVal(byGroup, catKey, groupFilter, normalize, total) {
  if (!byGroup?.[catKey]) return 0
  const g = byGroup[catKey]
  const keys = GROUP_FILTER_META[groupFilter].keys
  const raw = keys.reduce((s, k) => s + (g[k] ?? 0), 0)
  if (!normalize || !total) return raw
  return total > 0 ? (raw / total) * 100 : 0
}

/** Number of trials (not category mentions) in the selected recruitment group — the % denominator. */
function getTotal(stats, groupFilter) {
  const keys = GROUP_FILTER_META[groupFilter].keys
  return Object.entries(stats.statusCounts)
    .filter(([status]) => keys.includes(statusGroup(status)))
    .reduce((sum, [, n]) => sum + n, 0)
}

export default function ComparisonDimensionChart({
  searches,
  config,
  dimKey,
  groupFilter,
  normalize,
  defaultExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  // Union of all category keys across all searches
  const allKeys = [...new Set(searches.flatMap(s =>
    Object.keys(s.stats.dimByGroup?.[dimKey] ?? {})
  ))]

  // Build display rows
  const data = allKeys
    .map(key => {
      const label = config.labels?.[key] ?? key
      const isUnknown = UNKNOWN_KEYS.has(key)
      const row = { key, label, isUnknown }
      let maxVal = 0
      searches.forEach(s => {
        const total = normalize ? getTotal(s.stats, groupFilter) : 0
        const v = getVal(s.stats.dimByGroup?.[dimKey], key, groupFilter, normalize, total)
        row[s.id] = v
        if (v > maxVal) maxVal = v
      })
      row._total = searches.reduce((sum, s) => {
        const total = normalize ? getTotal(s.stats, groupFilter) : 0
        return sum + getVal(s.stats.dimByGroup?.[dimKey], key, groupFilter, normalize, total)
      }, 0)
      return row
    })
    .filter(d => d._total > 0)
    .sort((a, b) => {
      if (a.isUnknown !== b.isUnknown) return a.isUnknown ? 1 : -1
      if (config.order) {
        const ai = config.order.indexOf(a.key), bi = config.order.indexOf(b.key)
        if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      }
      return b._total - a._total
    })

  const topLabel = data.filter(d => !d.isUnknown)[0]
  const chartHeight = Math.max(100, data.length * 28 * searches.length + 24)

  return (
    <div className="card overflow-hidden">
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
          {!expanded && topLabel && (
            <span className="text-xs text-slate-500 hidden md:block">
              Top: <span className="font-semibold text-slate-700">{topLabel.label}</span>
            </span>
          )}
          <span className="text-xs text-slate-500">{data.length} categories</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data} layout="vertical" barCategoryGap="30%" barGap={2}
              margin={{ left: 0, right: 56, top: 2, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }}
                tickLine={false} axisLine={false}
                tickFormatter={v => normalize ? `${v.toFixed(0)}%` : v.toLocaleString()} domain={normalize ? [0, 100] : [0, 'auto']} />
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
              <Tooltip content={<CustomTooltip normalize={normalize} />} cursor={{ fill: '#f8fafc' }} />
              {searches.map(s => (
                <Bar key={s.id} dataKey={s.id} name={s.query}
                  fill={s.color} radius={[0, 4, 4, 0]} maxBarSize={16} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2">
            {searches.map(s => (
              <span key={s.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.query}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
