const STAT_GROUPS = [
  { key: 'recruiting', label: 'Overall Recruiting', color: '#16a34a', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
  { key: 'active',     label: 'Active, Not Rec.',   color: '#2563eb', bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-800'  },
  { key: 'no_longer',  label: 'No Longer Rec.',     color: '#64748b', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
]

function groupCounts(statusCounts) {
  const recruiting = ['NOT_YET_RECRUITING','RECRUITING','ENROLLING_BY_INVITATION']
    .reduce((s, k) => s + (statusCounts[k] ?? 0), 0)
  const active = statusCounts['ACTIVE_NOT_RECRUITING'] ?? 0
  const total = Object.values(statusCounts).reduce((s, v) => s + v, 0)
  return { recruiting, active, no_longer: total - recruiting - active, total }
}

export default function ComparisonSummary({ searches }) {
  const counts = searches.map(s => groupCounts(s.stats.statusCounts))

  return (
    <div className="card p-5 overflow-x-auto">
      <h3 className="font-semibold text-slate-800 mb-4">Summary Comparison</h3>
      <table className="w-full text-sm min-w-[400px]">
        <thead>
          <tr>
            <th className="text-left text-xs text-slate-400 font-medium pb-2 pr-4 w-36">Metric</th>
            {searches.map(s => (
              <th key={s.id} className="text-right text-xs font-semibold pb-2 px-3 min-w-[120px]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="truncate max-w-[100px]" title={s.query}>{s.query}</span>
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
                  <span className="ml-1.5 text-xs text-slate-400">
                    {c.total > 0 ? `${((c[g.key] / c.total) * 100).toFixed(1)}%` : '—'}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
