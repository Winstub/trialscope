import { PHASE_CONFIG, PHASE_ORDER, STATUS_CONFIG, STATUS_ORDER } from '../utils/constants.js'

function heatColor(value, max) {
  if (value === 0 || max === 0) return { bg: '#f8fafc', text: '#cbd5e1' }
  const intensity = value / max
  if (intensity < 0.15) return { bg: '#eff6ff', text: '#1e40af' }
  if (intensity < 0.35) return { bg: '#bfdbfe', text: '#1e3a8a' }
  if (intensity < 0.6)  return { bg: '#60a5fa', text: '#1e3a8a' }
  if (intensity < 0.8)  return { bg: '#2563eb', text: '#ffffff' }
  return { bg: '#1d4ed8', text: '#ffffff' }
}

export default function PhaseStatusMatrix({ phaseStatusMatrix }) {
  const allPhases = PHASE_ORDER.filter(p =>
    PHASE_ORDER.some(ph => Object.keys(phaseStatusMatrix[ph] ?? {}).length > 0) &&
    Object.keys(phaseStatusMatrix[p] ?? {}).length > 0
  )
  const allStatuses = STATUS_ORDER.filter(s =>
    PHASE_ORDER.some(p => (phaseStatusMatrix[p]?.[s] ?? 0) > 0)
  )

  const maxVal = Math.max(
    1,
    ...allPhases.flatMap(p => allStatuses.map(s => phaseStatusMatrix[p]?.[s] ?? 0))
  )

  if (allPhases.length === 0) return null

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-800 mb-1">Phase × Status Matrix</h3>
      <p className="text-xs text-slate-400 mb-4">Number of studies at each phase/status intersection — intensity indicates relative volume</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-separate" style={{ borderSpacing: 3 }}>
          <thead>
            <tr>
              <th className="w-24 text-left text-slate-400 font-medium pb-1" />
              {allStatuses.map(s => (
                <th key={s} className="text-center font-medium pb-1 min-w-[68px]">
                  <span
                    className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
                    style={{ backgroundColor: STATUS_CONFIG[s]?.color + '22', color: STATUS_CONFIG[s]?.color }}
                  >
                    {STATUS_CONFIG[s]?.label ?? s}
                  </span>
                </th>
              ))}
              <th className="text-center font-medium pb-1 min-w-[60px] text-slate-500">Row Total</th>
            </tr>
          </thead>
          <tbody>
            {allPhases.map(phase => {
              const rowTotal = allStatuses.reduce((s, st) => s + (phaseStatusMatrix[phase]?.[st] ?? 0), 0)
              return (
                <tr key={phase}>
                  <td className="pr-2 py-0.5">
                    <span
                      className="font-semibold text-[11px] px-2 py-1 rounded-md"
                      style={{ backgroundColor: PHASE_CONFIG[phase]?.color + '18', color: PHASE_CONFIG[phase]?.color }}
                    >
                      {PHASE_CONFIG[phase]?.shortLabel ?? phase}
                    </span>
                  </td>
                  {allStatuses.map(s => {
                    const val = phaseStatusMatrix[phase]?.[s] ?? 0
                    const { bg, text } = heatColor(val, maxVal)
                    return (
                      <td key={s} className="text-center rounded-md py-1.5 px-1 transition-all font-medium" style={{ backgroundColor: bg, color: text }}>
                        {val > 0 ? val.toLocaleString() : '—'}
                      </td>
                    )
                  })}
                  <td className="text-center rounded-md py-1.5 px-1 bg-slate-100 text-slate-600 font-semibold">
                    {rowTotal.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="text-slate-500 font-semibold text-[11px] pt-1">Col Total</td>
              {allStatuses.map(s => {
                const colTotal = allPhases.reduce((sum, p) => sum + (phaseStatusMatrix[p]?.[s] ?? 0), 0)
                return (
                  <td key={s} className="text-center rounded-md py-1.5 px-1 bg-slate-100 text-slate-600 font-semibold">
                    {colTotal.toLocaleString()}
                  </td>
                )
              })}
              <td className="text-center rounded-md py-1.5 px-1 bg-slate-200 text-slate-700 font-bold">
                {allPhases.reduce((s, p) => s + allStatuses.reduce((ss, st) => ss + (phaseStatusMatrix[p]?.[st] ?? 0), 0), 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-slate-400">Intensity scale:</span>
        {[0.1, 0.25, 0.5, 0.75, 1.0].map(i => {
          const { bg } = heatColor(Math.round(i * 100), 100)
          return <span key={i} className="w-5 h-3 rounded" style={{ backgroundColor: bg }} />
        })}
        <span className="text-xs text-slate-400">Low → High</span>
      </div>
    </div>
  )
}
