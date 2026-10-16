import { useMemo } from 'react'
import { X } from 'lucide-react'
import KpiStrip from './KpiStrip.jsx'
import FacetList from './FacetList.jsx'
import StatusDonutChart from './StatusDonutChart.jsx'
import TimelineChart from './TimelineChart.jsx'
import PhaseStatusMatrix from './PhaseStatusMatrix.jsx'
import TrialTable from './TrialTable.jsx'
import GroupedDimensionChart from './GroupedDimensionChart.jsx'
import { aggregateStudies } from '../utils/api.js'
import { ENROLLMENT_BINS, EMPTY_FILTERS, enrollmentBin, facet, hasFilters, isEnrollmentOutlier, topN } from '../utils/filters.js'
import { DIMENSION_CONFIG, PHASE_CONFIG, PHASE_ORDER, STATUS_CONFIG } from '../utils/constants.js'

const EXPLORER_DIMS = ['route', 'interventionType', 'studyType', 'primaryPurpose', 'ageGroup', 'sex', 'masking', 'allocation']
const toggleIn = (arr, k) => (arr.includes(k) ? arr.filter(x => x !== k) : [...arr, k])

export default function Dashboard({ entry, filters, setFilters, filtered, sorted, sort, dir, onSort, onExport }) {
  const { records } = entry
  const set = (patch) => setFilters(f => ({ ...f, ...patch }))
  const toggle = dim => key => set({ [dim]: toggleIn(filters[dim], key) })

  const statusCounts = useMemo(() => facet(filtered, EMPTY_FILTERS, [], r => r.status), [filtered])
  const phaseCounts  = useMemo(() => facet(filtered, EMPTY_FILTERS, [], r => r.phases), [filtered])
  const clsCounts    = useMemo(() => facet(filtered, EMPTY_FILTERS, [], r => r.sponsorClass), [filtered])
  const sponsorCounts = useMemo(() => facet(filtered, EMPTY_FILTERS, [], r => r.sponsor), [filtered])
  const countryCounts = useMemo(() => facet(filtered, EMPTY_FILTERS, [], r => r.countries), [filtered])
  const enrCounts    = useMemo(() => facet(filtered, EMPTY_FILTERS, [], r => enrollmentBin(r.enrollment)), [filtered])
  const condCounts   = useMemo(() => facet(filtered, EMPTY_FILTERS, [], r => r.conditions.map(c => c.trim())), [filtered])

      const stats    = useMemo(() => aggregateStudies(filtered), [filtered])
  const timeline = stats.timelineByYear
  const matrix   = stats.phaseStatusMatrix
  const enrOutliers = useMemo(() => filtered.reduce((n, r) => n + (isEnrollmentOutlier(r.enrollment) ? 1 : 0), 0), [filtered])

  const phaseItems = PHASE_ORDER.filter(k => phaseCounts.get(k)).map(k => ({ key: k, label: PHASE_CONFIG[k].label, count: phaseCounts.get(k), color: PHASE_CONFIG[k].color }))
  const cfg = DIMENSION_CONFIG.sponsorClass
  const clsItems = cfg.order.filter(k => clsCounts.get(k)).map(k => ({ key: k, label: cfg.labels[k], count: clsCounts.get(k), color: cfg.colors[k] }))
  const sponsorItems = topN(sponsorCounts, 50).map(([k, n]) => ({ key: k, label: k, count: n }))
  const countryItems = topN(countryCounts, 50).map(([k, n]) => ({ key: k, label: k, count: n }))
  const enrItems = ENROLLMENT_BINS.filter(b => enrCounts.get(b.key)).map(b => ({ key: b.key, label: b.label, count: enrCounts.get(b.key), muted: b.key === 'na', color: b.key === 'na' ? '#94a3b8' : '#2563eb' }))
  const condItems = topN(condCounts, 50).map(([k, n]) => ({ key: k, label: k, count: n }))

  function selectYear(y) {
    const { yearFrom: a, yearTo: b } = filters
    if (a === null && b === null) set({ yearFrom: y, yearTo: y })
    else if (a === b) {
      if (a === y) set({ yearFrom: null, yearTo: null })
      else set({ yearFrom: Math.min(a, y), yearTo: Math.max(a, y) })
    } else set({ yearFrom: y, yearTo: y })
  }

  function cellClick(phase, status) {
    const same = filters.phase.length === 1 && filters.phase[0] === phase && filters.status.length === 1 && filters.status[0] === status
    set(same ? { phase: [], status: [] } : { phase: [phase], status: [status] })
  }

  // Active filter chips
  const chips = []
  filters.status.forEach(v => chips.push({ k: `s${v}`, label: STATUS_CONFIG[v]?.label ?? v, remove: () => set({ status: filters.status.filter(x => x !== v) }) }))
  filters.phase.forEach(v => chips.push({ k: `p${v}`, label: PHASE_CONFIG[v]?.label ?? v, remove: () => set({ phase: filters.phase.filter(x => x !== v) }) }))
  filters.cls.forEach(v => chips.push({ k: `c${v}`, label: cfg.labels[v] ?? v, remove: () => set({ cls: filters.cls.filter(x => x !== v) }) }))
  filters.country.forEach(v => chips.push({ k: `n${v}`, label: v, remove: () => set({ country: filters.country.filter(x => x !== v) }) }))
  filters.sponsor.forEach(v => chips.push({ k: `o${v}`, label: v, remove: () => set({ sponsor: filters.sponsor.filter(x => x !== v) }) }))
  filters.enr.forEach(v => chips.push({ k: `e${v}`, label: `Enrollment ${ENROLLMENT_BINS.find(b => b.key === v)?.label ?? v}`, remove: () => set({ enr: filters.enr.filter(x => x !== v) }) }))
  if (filters.yearFrom !== null || filters.yearTo !== null)
    chips.push({ k: 'y', label: `Started ${filters.yearFrom === filters.yearTo ? filters.yearFrom : `${filters.yearFrom ?? '…'}–${filters.yearTo ?? '…'}`}`, remove: () => set({ yearFrom: null, yearTo: null }) })
  if (filters.text.trim()) chips.push({ k: 't', label: `“${filters.text.trim()}”`, remove: () => set({ text: '' }) })

  return (
    <div className="space-y-4">
      {hasFilters(filters) && (
        <div className="flex flex-wrap items-center gap-2 no-print" aria-label="Active filters" role="group">
          <span className="text-xs font-semibold text-slate-600">Filters</span>
          {chips.map(c => (
            <button key={c.k} type="button" onClick={c.remove} className="inline-flex items-center gap-1 max-w-xs text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-full pl-3 pr-2 py-1">
              <span className="truncate">{c.label}</span><X className="w-3 h-3 flex-shrink-0" aria-hidden="true" /><span className="sr-only">remove filter</span>
            </button>
          ))}
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2 ml-1">Clear all</button>
        </div>
      )}

      <KpiStrip query={entry.query} field={entry.field} records={filtered} unfilteredTotal={records.length} filters={filters}
        onFilter={(dim, vals) => set({ [dim]: vals })} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatusDonutChart counts={statusCounts} selected={filters.status} onToggle={toggle('status')} />
        <FacetList title="Development phase" subtitle="Multi-phase trials counted in each phase" items={phaseItems} selected={filters.phase} onToggle={toggle('phase')} />
        <FacetList title="Industry vs academic" subtitle="Lead sponsor type" items={clsItems} selected={filters.cls} onToggle={toggle('cls')}
          footnote="“Academic / Other” covers universities, hospitals and non-profits." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TimelineChart timelineByYear={timeline} yearFrom={filters.yearFrom} yearTo={filters.yearTo}
            onSelectYear={selectYear} onClear={() => set({ yearFrom: null, yearTo: null })} />
        </div>
        <FacetList title="Enrollment size" subtitle="Participants per trial" items={enrItems} selected={filters.enr} onToggle={toggle('enr')} maxRows={10}
          footnote={enrOutliers ? `${enrOutliers} trial${enrOutliers > 1 ? 's' : ''} with implausible enrollment (≥10M or placeholder values) excluded.` : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FacetList title="Top sponsors" subtitle="By number of trials" items={sponsorItems} selected={filters.sponsor} onToggle={toggle('sponsor')} maxRows={8} color="#7c3aed" />
        <FacetList title="Top countries" subtitle="Trials with ≥1 site in country" items={countryItems} selected={filters.country} onToggle={toggle('country')} maxRows={8} color="#0d9488" />
        <FacetList title="Top conditions" subtitle="Click to search the table" items={condItems}
          selected={condItems.some(i => i.key === filters.text.trim()) ? [filters.text.trim()] : []}
          onToggle={k => set({ text: filters.text.trim() === k ? '' : k })} maxRows={8} color="#d97706" />
      </div>

      <PhaseStatusMatrix phaseStatusMatrix={matrix} selectedPhases={filters.phase} selectedStatuses={filters.status} onCellClick={cellClick} />

      <TrialTable rows={sorted} totalBeforeFilter={records.length} sort={sort} dir={dir} onSort={onSort}
        text={filters.text} onText={t => set({ text: t })} onExport={onExport} />

      <div className="no-print">
        <h3 className="text-sm font-bold text-slate-800 mb-2 mt-2 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-blue-600 inline-block" aria-hidden="true" />
          More dimensions
          <span className="text-xs font-normal text-slate-500">— route, intervention type, design and eligibility (reflects current filters)</span>
        </h3>
        <div className="space-y-2">
          {EXPLORER_DIMS.map(k => (
            <GroupedDimensionChart key={k} byGroup={stats.dimByGroup[k]} config={DIMENSION_CONFIG[k]} defaultExpanded={k === 'route'} />
          ))}
        </div>
      </div>
    </div>
  )
}
