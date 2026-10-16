import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

const GROUP_META = {
  recruiting: { label: 'Overall Recruiting',    color: '#16a34a' },
  active:     { label: 'Active, Not Recruiting', color: '#2563eb' },
  no_longer:  { label: 'No Longer Recruiting',   color: '#64748b' },
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0)
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm min-w-[180px]">
      <p className="font-bold text-slate-700 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4 text-xs mb-0.5">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {GROUP_META[p.dataKey]?.label ?? p.dataKey}
          </span>
          <span className="font-semibold text-slate-700">{(p.value ?? 0).toLocaleString()}</span>
        </div>
      ))}
      <div className="flex justify-between gap-4 text-xs mt-1.5 pt-1.5 border-t border-slate-100">
        <span className="text-slate-500 font-medium">Total</span>
        <span className="font-bold text-slate-700">{total.toLocaleString()}</span>
      </div>
    </div>
  )
}

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1  // 1-12

export default function TimelineChart({ timelineByYear }) {
  // Strip the sentinel key before building the year list
  const noDateBucket = timelineByYear['__no_date__'] ?? { recruiting: 0, active: 0, no_longer: 0 }
  const noDateTotal  = noDateBucket.recruiting + noDateBucket.active + noDateBucket.no_longer

  const allYears = useMemo(
    () => Object.keys(timelineByYear).filter(y => y !== '__no_date__').sort(),
    [timelineByYear]
  )

  const minYear = parseInt(allYears[0], 10)
  const maxYear = parseInt(allYears[allYears.length - 1], 10)

  const [fromYear, setFromYear] = useState(minYear)
  const [toYear,   setToYear]   = useState(maxYear)

  if (allYears.length < 2) return null

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

  function reset() {
    setFromYear(minYear)
    setToYear(maxYear)
  }

  const filteredData = allYears
    .filter(y => parseInt(y, 10) >= fromYear && parseInt(y, 10) <= toYear)
    .map(year => ({ year, ...timelineByYear[year] }))

  // Is the current calendar year visible in the filtered window?
  const currentYearVisible = CURRENT_YEAR >= fromYear && CURRENT_YEAR <= toYear

  const windowTotal = filteredData.reduce(
    (s, d) => s + (d.recruiting ?? 0) + (d.active ?? 0) + (d.no_longer ?? 0),
    0
  )

  const isFiltered = fromYear !== minYear || toYear !== maxYear

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">Trial Start Date Timeline</h3>
          <p className="text-xs text-slate-400 mt-0.5">Studies started per year by recruitment group (stacked area)</p>
        </div>

        {/* Year range controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">From</label>
            <input
              type="number"
              value={fromYear}
              min={minYear}
              max={toYear}
              onChange={handleFrom}
              className="w-16 text-sm font-semibold text-slate-700 bg-transparent border-none outline-none text-center"
            />
            <span className="text-slate-300">—</span>
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">To</label>
            <input
              type="number"
              value={toYear}
              min={fromYear}
              max={maxYear}
              onChange={handleTo}
              className="w-16 text-sm font-semibold text-slate-700 bg-transparent border-none outline-none text-center"
            />
          </div>
          {isFiltered && (
            <button
              onClick={reset}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
        <span>
          <span className="font-semibold text-slate-700">{filteredData.length}</span> years shown
          {isFiltered && <span className="ml-1 text-blue-600 font-medium">({fromYear}–{toYear})</span>}
        </span>
        <span>·</span>
        <span>
          <span className="font-semibold text-slate-700">{windowTotal.toLocaleString()}</span> total studies in window
        </span>
        {filteredData.length === 0 && (
          <span className="text-amber-600 font-medium">No data in selected range</span>
        )}
      </div>

      {filteredData.length >= 1 ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={filteredData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <defs>
              {Object.entries(GROUP_META).map(([k, { color }]) => (
                <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            {currentYearVisible && (
              <ReferenceLine
                x={String(CURRENT_YEAR)}
                stroke="#f59e0b"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `${CURRENT_MONTH} mo`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: '#f59e0b',
                  fontWeight: 600,
                }}
              />
            )}
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval={filteredData.length > 20 ? 'preserveStartEnd' : 0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => v.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={k => <span className="text-xs text-slate-600">{GROUP_META[k]?.label ?? k}</span>}
            />
            {Object.entries(GROUP_META).map(([k, { color }]) => (
              <Area
                key={k}
                type="monotone"
                dataKey={k}
                stackId="1"
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${k})`}
                dot={filteredData.length <= 10}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
          No studies with start dates in {fromYear}–{toYear}
        </div>
      )}

      {/* Caveats */}
      <div className="mt-3 space-y-1">
        {currentYearVisible && (
          <p className="text-xs text-amber-600 flex items-start gap-1.5">
            <span className="mt-0.5">⚠</span>
            <span>
              <strong>{CURRENT_YEAR}</strong> is partial — only {CURRENT_MONTH} of 12 months have elapsed.
              Counts will continue to rise throughout the year.
            </span>
          </p>
        )}
        {noDateTotal > 0 && (
          <p className="text-xs text-slate-400 flex items-start gap-1.5">
            <span className="mt-0.5">ℹ</span>
            <span>
              <strong>{noDateTotal.toLocaleString()}</strong> studies are excluded from this chart because no
              start date has been recorded yet (common for <em>Not Yet Recruiting</em> trials). As trials
              launch and update their records, they will appear here.
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
