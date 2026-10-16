import { useMemo } from 'react'
import { FlaskConical, PlayCircle, Rocket, Building2, Users, Globe2 } from 'lucide-react'
import { median } from '../utils/filters.js'
import { fmt, fmtCompact, pct } from '../utils/format.js'

function Kpi({ icon: Icon, label, value, sub, tone = 'slate', onClick, active, title }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600', green: 'bg-green-100 text-green-700', violet: 'bg-violet-100 text-violet-700',
    blue: 'bg-blue-100 text-blue-700', amber: 'bg-amber-100 text-amber-700', teal: 'bg-teal-100 text-teal-700',
  }
  const body = (
    <>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${tones[tone]}`} aria-hidden="true"><Icon className="w-3.5 h-3.5" /></span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500 leading-snug">{sub}</p>
    </>
  )
  const cls = `card p-4 text-left block w-full ${onClick ? `hover:border-blue-300 hover:shadow transition ${active ? 'ring-2 ring-blue-600 border-blue-600' : ''}` : ''}`
  return onClick
    ? <button type="button" onClick={onClick} aria-pressed={active} title={title} className={cls}>{body}</button>
    : <div className={cls} title={title}>{body}</div>
}

const OPEN = ['NOT_YET_RECRUITING', 'RECRUITING', 'ENROLLING_BY_INVITATION', 'AVAILABLE']

export default function KpiStrip({ records, unfilteredTotal, filters, onFilter }) {
  const k = useMemo(() => {
    const n = records.length
    let open = 0, late = 0, industry = 0, enrollSum = 0, enrollN = 0
    const countries = new Set(), sponsors = new Set(), enr = []
    for (const r of records) {
      if (OPEN.includes(r.status)) open++
      if (r.phases.includes('PHASE3') || r.phases.includes('PHASE4')) late++
      if (r.sponsorClass === 'INDUSTRY') industry++
      if (r.enrollment > 0) { enrollSum += r.enrollment; enrollN++; enr.push(r.enrollment) }
      r.countries.forEach(c => countries.add(c))
      sponsors.add(r.sponsor)
    }
    return { n, open, late, industry, enrollSum, enrollN, medEnroll: median(enr), countries: countries.size, sponsors: sponsors.size }
  }, [records])

  const openActive = filters.status.length === OPEN.length && OPEN.every(s => filters.status.includes(s))
  const industryActive = filters.cls.length === 1 && filters.cls[0] === 'INDUSTRY'
  const lateActive = filters.phase.length === 2 && filters.phase.includes('PHASE3') && filters.phase.includes('PHASE4')

  return (
    <section aria-label="Key metrics" className="grid grid-cols-2 lg:grid-cols-6 gap-3">
      <Kpi icon={FlaskConical} tone="slate" label="Trials" value={fmt(k.n)}
        sub={k.n !== unfilteredTotal ? `of ${fmt(unfilteredTotal)} in this search` : 'matching this search'} />
      <Kpi icon={PlayCircle} tone="green" label="Open to enrollment" value={fmt(k.open)}
        sub={`${pct(k.open, k.n)} · recruiting or not yet`}
        onClick={() => onFilter('status', openActive ? [] : OPEN)} active={openActive} title="Filter to trials that are not yet recruiting, recruiting or enrolling by invitation" />
      <Kpi icon={Rocket} tone="violet" label="Late-stage (Ph 3/4)" value={fmt(k.late)}
        sub={`${pct(k.late, k.n)} of trials`}
        onClick={() => onFilter('phase', lateActive ? [] : ['PHASE3', 'PHASE4'])} active={lateActive} />
      <Kpi icon={Building2} tone="blue" label="Industry-sponsored" value={pct(k.industry, k.n)}
        sub={`${fmt(k.industry)} industry · ${fmt(k.n - k.industry)} academic & other`}
        onClick={() => onFilter('cls', industryActive ? [] : ['INDUSTRY'])} active={industryActive} />
      <Kpi icon={Users} tone="amber" label="Total enrollment" value={fmtCompact(k.enrollSum)}
        sub={k.medEnroll ? `median ${fmt(Math.round(k.medEnroll))} per trial` : 'no enrollment data'}
        title="Sum of actual + planned participants across trials reporting enrollment" />
      <Kpi icon={Globe2} tone="teal" label="Reach" value={`${fmt(k.countries)} countries`}
        sub={`${fmt(k.sponsors)} distinct sponsors`} />
    </section>
  )
}
