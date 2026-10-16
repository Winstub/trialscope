import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { X } from 'lucide-react'

const GROUP_META = {
  recruiting: { label: 'Open to enrollment',     color: '#16a34a' },
  active:     { label: 'Active, not recruiting', color: '#2563eb' },
  no_longer:  { label: 'Completed / closed',     color: '#64748b' },
}
const CURRENT_YEAR = new Date().getFullYear()

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0)
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm min-w-[190px]">
      <p className="font-bold text-slate-800 mb-1.5">{label}{Number(label) > CURRENT_YEAR ? ' (planned)' : ''}</p>
      {[...payload].reverse().map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4 text-xs mb-0.5">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />{GROUP_META[p.dataKey]?.label}
          </span>
          <span className="font-semibold text-slate-800">{(p.value ?? 0).toLocaleString()}</span>
        </div>
      ))}
      <div className="flex justify-between gap-4 text-xs mt-1.5 pt-1.5 border-t border-slate-100">
        <span className="text-slate-600 font-medium">Total</span><span className="font-bold text-slate-800">{total.toLocaleString()}</span>
      </div>
    </div>
  )
}

/** Trials started per calendar year; click a bar to filter the table to that year (click again to extend range). */
export default function TimelineChart({ timelineByYear, yearFrom, yearTo, onSelectYear, onClear }) {
  const noDate = timelineByYear.__no_date__
  const noDateTotal = noDate ? noDate.recruiting + noDate.active + noDate.no_longer : 0

  const data = useMemo(() => {
    const years = Object.keys(timelineByYear).filter(y => y !== '__no_date__').map(Number)
    if (!years.length) return []
    const min = Math.min(...years), max = Math.max(...years)
    // Fill gaps so the x-axis is a continuous, honest time scale
    return Array.from({ length: max - min + 1 }, (_, i) => {
      const y = min + i
      return { year: String(y), recruiting: 0, active: 0, no_longer: 0, ...(timelineByYear[y] ?? {}) }
    })
  }, [timelineByYear])

  const sel = y => {
    const n = Number(y)
    return (yearFrom === null || n >= yearFrom) && (yearTo === null || n <= yearTo)
  }
  const anySel = yearFrom !== null || yearTo !== null

  return (
    <div className="card p-5 h-full">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="card-title">Trials started per year</h3>
          <p className="card-sub">Click a year to filter · click a second year to select a range</p>
        </div>
        {anySel && (
          <button type="button" onClick={onClear} className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full px-2.5 py-1 flex items-center gap-1">
            {yearFrom === yearTo ? yearFrom : `${yearFrom ?? '…'}–${yearTo ?? '…'}`} <X className="w-3 h-3" aria-hidden="true" />
            <span className="sr-only">Clear year filter</span>
          </button>
        )}
      </div>
      {data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-slate-500 text-sm">No start dates recorded for these trials</div>
      ) : (
        <div className="mt-3" role="img" aria-label={`Bar chart of trials started per year, ${data[0].year} to ${data[data.length - 1].year}`}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 18, right: 8, bottom: 0, left: -12 }} barCategoryGap="12%"
              onClick={s => { if (s?.activeLabel) onSelectYear(Number(s.activeLabel)) }} style={{ cursor: 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} minTickGap={14} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={v => v.toLocaleString()} width={44} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              {data.some(d => Number(d.year) === CURRENT_YEAR) && (
                <ReferenceLine x={String(CURRENT_YEAR)} stroke="#f59e0b" strokeDasharray="4 3" label={{ value: 'now', position: 'top', fontSize: 10, fill: '#b45309' }} />
              )}
              {Object.entries(GROUP_META).map(([k, { color }]) => (
                <Bar key={k} dataKey={k} stackId="a" fill={color}>
                  {data.map(d => <Cell key={d.year} fill={color} fillOpacity={anySel && !sel(d.year) ? 0.22 : 1} />)}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {Object.values(GROUP_META).map(m => (
              <span key={m.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: m.color }} aria-hidden="true" />{m.label}
              </span>
            ))}
          </div>
        </div>
      )}
      {noDateTotal > 0 && (
        <p className="mt-2 text-[11px] text-slate-500">{noDateTotal.toLocaleString()} trials have no recorded start date and are not plotted. Years after {CURRENT_YEAR} are planned starts.</p>
      )}
    </div>
  )
}
