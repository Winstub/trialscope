import { useMemo } from 'react'
import { median, topN } from '../utils/filters.js'

const STAT_GROUPS = [
  { key: 'recruiting', label: 'Overall Recruiting', color: '#16a34a', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
  { key: 'active',     label: 'Active, Not Rec.',   color: '#2563eb', bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-800'  },
  { key: 'no_longer',  label: 'No Longer Rec.',     color: '#64748b', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
]

function groupCounts(statusCounts) {
  const recruiting = ['NOT_YET_RECRUITING','RECRUITING','ENROLLING_BY_INVITATION','AVAILABLE']
    .reduce((s, k) => s + (statusCounts[k] ?? 0), 0)
  const active = statusCounts['ACTIVE_NOT_RECRUITING'] ?? 0
  const total = Object.values(statusCounts).reduce((s, v) => s + v, 0)
  return { recruiting, active, no_longer: total - recruiting - active, total }
}

export default function ComparisonSummary({ searches }) {
  const counts = searches.map(s => groupCounts(s.stats.statusCounts))
  const extra = useMemo(() => searches.map(s => {
    const n = s.records.length
    const sponsors = new Map()
    const countries = new Set()
    let industry = 0, late = 0
    for (const r of s.records) {
      if (r.sponsorClass === 'INDUSTRY') industry++
      if (r.phases.includes('PHASE3') || r.phases.includes('PHASE4')) late++
      sponsors.set(r.sponsor, (sponsors.get(r.sponsor) ?? 0) + 1)
      r.countries.forEach(c => countries.add(c))
    }
    const top = topN(sponsors, 1)[0]
    return { n, industry, late, countries: countries.size, med: median(s.records.map(r => r.enrollment).filter(v => v > 0)), top }
  }), [searches])
  const p = (v, n) => (n > 0 ? `${((v / n) * 100).toFixed(1)}%` : '—')

  return (
    <div className="card p-5 overflow-x-auto">
      <h3 className="card-title mb-4">Summary Comparison</h3>
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr>
            <th className="text-left text-xs text-slate-500 font-medium pb-2 pr-4 w-40">Metric</th>
            {searches.map(s => (
              <th key={s.id} className="text-right text-xs font-semibold pb-2 px-3 min-w-[140px]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="truncate max-w-[150px]" title={s.query}>{s.query}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="py-2 pr-4 text-xs text-slate-500 font-medium">Total fetched</td>
            {counts.map((c, i) => (
              <td key={i} className="py-2 px-3 text-right font-bold text-slate-700">
                {c.total.toLocaleString()}
              </td>
            ))}
          </tr>
          {STAT_GROUPS.map(g => (
            <tr key={g.key}>
              <td className="py-2 pr-4">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${g.bg} ${g.border} ${g.text} border`}>
                  {g.label}
                </span>
              </td>
              {counts.map((c, i) => (
                <td key={i} className="py-2 px-3 text-right">
                  <span className="font-semibold text-slate-700">{c[g.key].toLocaleString()}</span>
                  <span className="ml-1.5 text-xs text-slate-500">
                    {c.total > 0 ? `${((c[g.key] / c.total) * 100).toFixed(1)}%` : '—'}
                  </span>
                </td>
              ))}
            </tr>
          ))}
          {[
            ['Industry-sponsored', e => `${e.industry.toLocaleString()}`, e => p(e.industry, e.n)],
            ['Late-stage (Ph 3/4)', e => e.late.toLocaleString(), e => p(e.late, e.n)],
            ['Median enrollment', e => (e.med ? Math.round(e.med).toLocaleString() : '—'), () => ''],
            ['Countries', e => e.countries.toLocaleString(), () => ''],
          ].map(([label, main, sub]) => (
            <tr key={label}>
              <td className="py-2 pr-4 text-xs text-slate-600 font-medium">{label}</td>
              {extra.map((e, i) => (
                <td key={i} className="py-2 px-3 text-right">
                  <span className="font-semibold text-slate-700">{main(e)}</span>
                  <span className="ml-1.5 text-xs text-slate-500">{sub(e)}</span>
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="py-2 pr-4 text-xs text-slate-600 font-medium">Top sponsor</td>
            {extra.map((e, i) => (
              <td key={i} className="py-2 px-3 text-right text-xs text-slate-700" title={e.top?.[0]}>
                <span className="block truncate max-w-[160px] ml-auto">{e.top ? e.top[0] : '—'}</span>
                <span className="text-slate-500">{e.top ? `${e.top[1].toLocaleString()} trials` : ''}</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
