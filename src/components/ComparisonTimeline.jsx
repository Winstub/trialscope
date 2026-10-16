import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1

const GROUP_KEYS = {
  all:        ['recruiting','active','no_longer'],
  recruiting: ['recruiting'],
  active:     ['active'],
  no_longer:  ['no_longer'],
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm min-w-[180px]">
      <p className="font-bold text-slate-700 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4 text-xs mb-0.5">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold text-slate-700">{(p.value ?? 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function ComparisonTimeline({ searches, groupFilter }) {
  const allYearsSet = useMemo(() => {
    const s = new Set()
    searches.forEach(({ stats }) => {
      Object.keys(stats.timelineByYear)
        .filter(y => y !== '__no_date__')
        .forEach(y => s.add(y))
    })
    return [...s].sort()
  }, [searches])

  const minYear = parseInt(allYearsSet[0] ?? CURRENT_YEAR, 10)
  const maxYear = parseInt(allYearsSet[allYearsSet.length - 1] ?? CURRENT_YEAR, 10)

  const [fromYear, setFromYear] = useState(minYear)
  const [toYear,   setToYear]   = useState(maxYear)

  if (allYearsSet.length < 2) return null

  function handleFrom(e) {
    const v = parseInt(e.target.value, 10)
    setFromYear(v)
    if (v > toYear) setToYear(v)
  }
  function handleTo(e) {
    const v = parseInt(e.target.value, 10)
    setToYear(v)
    if (v < fromYear) setFromYear(v)
  }
  function reset() { setFromYear(minYear); setToYear(maxYear) }

  const isFiltered = fromYear !== minYear || toYear !== maxYear
  const currentYearVisible = CURRENT_YEAR >= fromYear && CURRENT_YEAR <= toYear
  const gKeys = GROUP_KEYS[groupFilter] ?? GROUP_KEYS.all

  const filteredYears = allYearsSet.filter(y => {
    const n = parseInt(y, 10)
    return n >= fromYear && n <= toYear
  })

  const chartData = filteredYears.map(year => {
    const row = { year }
    searches.forEach(s => {
      const bucket = s.stats.timelineByYear[year] ?? {}
      row[s.id] = gKeys.reduce((sum, k) => sum + (bucket[k] ?? 0), 0)
    })
    return row
  })

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">Trial Start Date Timeline</h3>
          <p className="text-xs text-slate-400 mt-0.5">Studies started per year — one line per intervention</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">From</label>
            <input type="number" value={fromYear} min={minYear} max={toYear} onChange={handleFrom}
              className="w-16 text-sm font-semibold text-slate-700 bg-transparent border-none outline-none text-center" />
            <span className="text-slate-300">—</span>
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">To</label>
            <input type="number" value={toYear} min={fromYear} max={maxYear} onChange={handleTo}
              className="w-16 text-sm font-semibold text-slate-700 bg-transparent border-none outline-none text-center" />
          </div>
          {isFiltered && (
            <button onClick={reset}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
              Reset
            </button>
          )}
        </div>
      </div>

      {chartData.length >= 1 ? (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            {currentYearVisible && (
              <ReferenceLine x={String(CURRENT_YEAR)} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: `${CURRENT_MONTH} mo`, position: 'insideTopRight', fontSize: 10, fill: '#f59e0b', fontWeight: 600 }} />
            )}
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
              interval={chartData.length > 20 ? 'preserveStartEnd' : 0} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
              tickFormatter={v => v.toLocaleString()} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8}
              formatter={(id) => {
                const s = searches.find(x => x.id === id)
                return <span className="text-xs text-slate-600">{s?.query ?? id}</span>
              }} />
            {searches.map(s => (
              <Line key={s.id} type="monotone" dataKey={s.id} name={s.id}
                stroke={s.color} strokeWidth={2.5}
                dot={chartData.length <= 10}
                activeDot={{ r: 4, strokeWidth: 0 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
          No studies with start dates in {fromYear}–{toYear}
        </div>
      )}

      {currentYearVisible && (
        <p className="mt-3 text-xs text-amber-600 flex items-start gap-1.5">
          <span className="mt-0.5">⚠</span>
          <span><strong>{CURRENT_YEAR}</strong> is partial — only {CURRENT_MONTH} of 12 months have elapsed.</span>
        </p>
      )}
    </div>
  )
}
