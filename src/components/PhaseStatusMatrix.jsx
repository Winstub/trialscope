import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { PHASE_CONFIG, PHASE_ORDER, STATUS_CONFIG, STATUS_ORDER } from '../utils/constants.js'

function heatColor(value, max) {
  if (value === 0 || max === 0) return { bg: '#f8fafc', text: '#94a3b8' }
  const intensity = value / max
  if (intensity < 0.15) return { bg: '#eff6ff', text: '#1e40af' }
  if (intensity < 0.35) return { bg: '#bfdbfe', text: '#1e3a8a' }
  if (intensity < 0.6)  return { bg: '#60a5fa', text: '#0f172a' }
  if (intensity < 0.8)  return { bg: '#2563eb', text: '#ffffff' }
  return { bg: '#1d4ed8', text: '#ffffff' }
}

/** Phase × status heat-map. Cells are buttons: click filters the table to that phase + status. */
export default function PhaseStatusMatrix({ phaseStatusMatrix, selectedPhases = [], selectedStatuses = [], onCellClick }) {
  const [open, setOpen] = useState(true)
  const phases = PHASE_ORDER.filter(p => Object.keys(phaseStatusMatrix[p] ?? {}).length > 0)
  const statuses = STATUS_ORDER.filter(s => phases.some(p => (phaseStatusMatrix[p]?.[s] ?? 0) > 0))
  const maxVal = Math.max(1, ...phases.flatMap(p => statuses.map(s => phaseStatusMatrix[p]?.[s] ?? 0)))
  const rowTotal = p => statuses.reduce((s, st) => s + (phaseStatusMatrix[p]?.[st] ?? 0), 0)

  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors rounded-2xl">
        <span>
          <span className="card-title">Phase × status matrix</span>
          <span className="ml-2 text-xs text-slate-500">click a cell to filter · multi-phase trials count in each phase</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
      </button>
      {open && (
        <div className="px-5 pb-5">
          {phases.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No trials to display.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-separate" style={{ borderSpacing: 3 }}>
                <thead>
                  <tr>
                    <th scope="col" className="w-24 text-left text-slate-500 font-medium pb-1"><span className="sr-only">Phase</span></th>
                    {statuses.map(s => (
                      <th scope="col" key={s} className="text-center font-medium pb-1 min-w-[72px]">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-700 bg-slate-100 border-b-2" style={{ borderColor: STATUS_CONFIG[s]?.color }}>
                          {STATUS_CONFIG[s]?.label ?? s}
                        </span>
                      </th>
                    ))}
                    <th scope="col" className="text-center font-medium pb-1 min-w-[60px] text-slate-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map(phase => (
                    <tr key={phase}>
                      <th scope="row" className="pr-2 py-0.5 text-left">
                        <span className="font-semibold text-[11px] px-2 py-1 rounded-md whitespace-nowrap" style={{ backgroundColor: PHASE_CONFIG[phase]?.color + '18', color: PHASE_CONFIG[phase]?.color }}>
                          {PHASE_CONFIG[phase]?.shortLabel ?? phase}
                        </span>
                      </th>
                      {statuses.map(s => {
                        const val = phaseStatusMatrix[phase]?.[s] ?? 0
                        const { bg, text } = heatColor(val, maxVal)
                        const sel = selectedPhases.includes(phase) && selectedStatuses.includes(s)
                        return (
                          <td key={s} className="p-0">
                            <button type="button" disabled={val === 0} onClick={() => onCellClick(phase, s)}
                              aria-pressed={sel}
                              aria-label={`${PHASE_CONFIG[phase]?.label ?? phase}, ${STATUS_CONFIG[s]?.label ?? s}: ${val} trials`}
                              className={`w-full rounded-md py-1.5 px-1 font-medium tabular-nums transition ${val > 0 ? 'hover:brightness-95 cursor-pointer' : 'cursor-default'} ${sel ? 'ring-2 ring-slate-900' : ''}`}
                              style={{ backgroundColor: bg, color: text }}>
                              {val > 0 ? val.toLocaleString() : '—'}
                            </button>
                          </td>
                        )
                      })}
                      <td className="text-center rounded-md py-1.5 px-1 bg-slate-100 text-slate-700 font-semibold tabular-nums">{rowTotal(phase).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
