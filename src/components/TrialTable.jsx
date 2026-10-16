import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { PHASE_CONFIG, PHASE_ORDER, STATUS_CONFIG, STATUS_ORDER, DIMENSION_CONFIG } from '../utils/constants.js'
import { formatDate } from '../utils/api.js'
import { isEnrollmentOutlier } from '../utils/filters.js'

const PAGE_SIZE = 25

const COLUMNS = [
  { key: 'id',         label: 'NCT ID' },
  { key: 'title',      label: 'Title' },
  { key: 'phase',      label: 'Phase' },
  { key: 'status',     label: 'Status' },
  { key: 'sponsor',    label: 'Sponsor' },
  { key: 'conditions', label: 'Conditions', nosort: true },
  { key: 'enrollment', label: 'Enrollment', align: 'right' },
  { key: 'start',      label: 'Start' },
  { key: 'end',        label: 'Completion' },
]

const phaseRank = r => Math.max(...r.phases.map(p => PHASE_ORDER.indexOf(p)))
const SORTERS = {
  id: r => r.id, title: r => r.title.toLowerCase(), phase: phaseRank,
  status: r => STATUS_ORDER.indexOf(r.status), sponsor: r => r.sponsor.toLowerCase(),
  enrollment: r => r.enrollment, start: r => r.startTs, end: r => r.endTs,
}

export function sortRows(rows, sort, dir) {
  const get = SORTERS[sort]
  if (!get) return rows
  const m = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const x = get(a), y = get(b)
    const xn = x === null || x === undefined || Number.isNaN(x), yn = y === null || y === undefined || Number.isNaN(y)
    if (xn || yn) return xn === yn ? 0 : xn ? 1 : -1   // missing values always last
    return x < y ? -m : x > y ? m : 0
  })
}

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 whitespace-nowrap">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg?.color ?? '#94a3b8' }} aria-hidden="true" />
      {cfg?.label ?? status}
    </span>
  )
}

function PhaseChips({ phases }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {[...phases].sort((a, b) => PHASE_ORDER.indexOf(a) - PHASE_ORDER.indexOf(b)).map(p => (
        <span key={p} className="px-1.5 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap"
          style={{ backgroundColor: (PHASE_CONFIG[p]?.color ?? '#6b7280') + '1a', color: '#1e293b', boxShadow: `inset 2px 0 0 ${PHASE_CONFIG[p]?.color ?? '#6b7280'}` }}>
          {PHASE_CONFIG[p]?.shortLabel ?? p}
        </span>
      ))}
    </span>
  )
}

function Conditions({ list }) {
  if (!list.length) return <span className="text-slate-500">—</span>
  return (
    <span className="line-clamp-2" title={list.join('; ')}>
      {list.slice(0, 2).join('; ')}
      {list.length > 2 && <span className="text-slate-500"> +{list.length - 2}</span>}
    </span>
  )
}

const sponsorTone = c => (c === 'INDUSTRY' ? 'bg-blue-500' : c === 'NIH' || c === 'FED' || c === 'OTHER_GOV' ? 'bg-teal-500' : 'bg-slate-400')

function Enroll({ r }) {
  if (!r.enrollment) return <span className="text-slate-500">—</span>
  if (isEnrollmentOutlier(r.enrollment)) return <span className="text-amber-700" title="Implausible reported value — excluded from enrollment totals, median and distribution">{r.enrollment.toLocaleString()}<span aria-hidden="true"> ⚠</span><span className="sr-only"> (implausible, excluded from totals)</span></span>
  return <span title={r.enrollmentType === 'ESTIMATED' ? 'Estimated enrollment' : 'Actual enrollment'}>{r.enrollment.toLocaleString()}{r.enrollmentType === 'ESTIMATED' && <span className="text-slate-500">*</span>}</span>
}

export default function TrialTable({ rows, totalBeforeFilter, sort, dir, onSort, text, onText, onExport }) {
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState(text)
  useEffect(() => { setDraft(text) }, [text])
  useEffect(() => { const t = setTimeout(() => { if (draft !== text) onText(draft) }, 250); return () => clearTimeout(t) }, [draft]) // eslint-disable-line
  useEffect(() => { setPage(0) }, [rows, sort, dir])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const cur = Math.min(page, pages - 1)
  const slice = useMemo(() => rows.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE), [rows, cur])

  return (
    <section className="card overflow-hidden" aria-labelledby="trials-h">
      <div className="p-5 flex flex-wrap items-center gap-3 justify-between border-b border-slate-100">
        <div>
          <h3 id="trials-h" className="card-title">Trials</h3>
          <p className="card-sub">
            {rows.length.toLocaleString()}{rows.length !== totalBeforeFilter && ` of ${totalBeforeFilter.toLocaleString()}`} trials · click a column to sort · * estimated enrollment
          </p>
        </div>
        <div className="relative no-print">
          <label htmlFor="table-filter" className="sr-only">Filter trials by keyword</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <input id="table-filter" type="search" value={draft} onChange={e => setDraft(e.target.value)}
            placeholder="Filter by title, NCT, sponsor, condition…"
            className="pl-8 pr-3 py-2 w-72 max-w-full text-sm rounded-xl border border-slate-300 bg-white placeholder:text-slate-500" />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="p-10 text-center text-sm text-slate-500">No trials match the current filters.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  {COLUMNS.map(c => {
                    const active = sort === c.key
                    return (
                      <th key={c.key} scope="col" aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                        className={`px-2.5 py-2.5 font-semibold whitespace-nowrap ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
                        {c.nosort ? c.label : (
                          <button type="button" onClick={() => onSort(c.key)} className={`inline-flex items-center gap-1 hover:text-slate-900 ${active ? 'text-slate-900' : ''}`}>
                            {c.label}
                            {active ? (dir === 'asc' ? <ArrowUp className="w-3 h-3" aria-hidden="true" /> : <ArrowDown className="w-3 h-3" aria-hidden="true" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" aria-hidden="true" />}
                          </button>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slice.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 align-top">
                    <td className="px-2.5 py-2.5 whitespace-nowrap">
                      <a href={`https://clinicaltrials.gov/study/${r.id}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-blue-700 hover:underline">
                        {r.id}<ExternalLink className="w-3 h-3" aria-hidden="true" /><span className="sr-only">(opens ClinicalTrials.gov)</span>
                      </a>
                    </td>
                    <td className="px-2.5 py-2.5 min-w-[200px] max-w-xs text-slate-900"><span className="line-clamp-2" title={r.title}>{r.title}</span></td>
                    <td className="px-2.5 py-2.5"><PhaseChips phases={r.phases} /></td>
                    <td className="px-2.5 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="px-2.5 py-2.5 min-w-[130px] max-w-[170px]">
                      <span className="flex items-start gap-1.5 text-slate-700">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${sponsorTone(r.sponsorClass)}`} title={DIMENSION_CONFIG.sponsorClass.labels[r.sponsorClass] ?? r.sponsorClass} />
                        <span className="line-clamp-2" title={r.sponsor}>{r.sponsor}</span>
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 min-w-[130px] max-w-[190px] text-slate-700"><Conditions list={r.conditions} /></td>
                    <td className="px-2.5 py-2.5 text-right tabular-nums text-slate-800"><Enroll r={r} /></td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap tabular-nums text-slate-700">{formatDate(r.startDate)}</td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap tabular-nums text-slate-700">{formatDate(r.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-slate-100">
            <li className="px-4 py-2 bg-slate-50 flex items-center gap-2 text-xs text-slate-600">
              <label htmlFor="m-sort">Sort</label>
              <select id="m-sort" value={sort ?? ''} onChange={e => onSort(e.target.value || null, true)} className="rounded-lg border border-slate-300 bg-white py-1 px-2 text-xs">
                <option value="">Relevance</option>
                {COLUMNS.filter(c => !c.nosort).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <button type="button" onClick={() => sort && onSort(sort)} className="p-1 rounded border border-slate-300 bg-white" aria-label={`Sort direction: ${dir === 'asc' ? 'ascending' : 'descending'}. Toggle`}>
                {dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </button>
            </li>
            {slice.map(r => (
              <li key={r.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <a href={`https://clinicaltrials.gov/study/${r.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-blue-700">
                    {r.id}<ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-sm font-medium text-slate-900 leading-snug">{r.title}</p>
                <div className="flex flex-wrap items-center gap-2"><PhaseChips phases={r.phases} /><span className="text-xs text-slate-600">{r.sponsor}</span></div>
                <p className="text-xs text-slate-600"><Conditions list={r.conditions} /></p>
                <p className="text-xs text-slate-600 tabular-nums">{formatDate(r.startDate)} → {formatDate(r.endDate)} · <Enroll r={r} /> participants</p>
              </li>
            ))}
          </ul>

          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-600 no-print">
            <span className="tabular-nums">{(cur * PAGE_SIZE + 1).toLocaleString()}–{Math.min(rows.length, (cur + 1) * PAGE_SIZE).toLocaleString()} of {rows.length.toLocaleString()}</span>
            <div className="flex items-center gap-1">
              <button type="button" className="btn-secondary !px-2 !py-1" disabled={cur === 0} onClick={() => setPage(cur - 1)} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-2 tabular-nums">Page {cur + 1} / {pages.toLocaleString()}</span>
              <button type="button" className="btn-secondary !px-2 !py-1" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <button type="button" onClick={onExport} className="font-semibold text-blue-700 hover:text-blue-900">Export these {rows.length.toLocaleString()} as CSV</button>
          </div>
        </>
      )}
    </section>
  )
}
