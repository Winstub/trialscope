import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Info, AlertTriangle, Database } from 'lucide-react'
import { facet, EMPTY_FILTERS } from '../utils/filters.js'
import { LABELS } from '../utils/target.js'
import { LABEL_STYLE } from './TargetBadge.jsx'

const SRC_TEXT = { ok: 'ok', failed: 'unreachable', 'no-match': 'no match', skipped: 'not needed' }

/** Resolved-target summary + per-label counts that double as the Targets / Measures only / Unclear filter. */
export default function TargetPanel({ entry, filtered, filters, onToggleLabel }) {
  const { profile } = entry
  const [open, setOpen] = useState(false)
  const counts = useMemo(() => facet(filtered, EMPTY_FILTERS, [], r => r.target?.label), [filtered])
  const total = filtered.length
  if (!profile) return null
  const src = profile.sources

  return (
    <section className="card p-5" aria-labelledby="target-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="target-h" className="card-title">
            Target: {profile.id}{profile.name && <span className="text-slate-500 font-medium"> · {profile.name}</span>}
          </h3>
          <p className="card-sub">
            Resolved to {profile.aliases.length} name{profile.aliases.length === 1 ? '' : 's'} and {profile.drugs.length} drug / agent name{profile.drugs.length === 1 ? '' : 's'}
            {profile.symbol && <> · gene <b className="font-semibold text-slate-700">{profile.symbol}</b></>}
            {profile.ensemblId && <> (<a className="text-blue-700 hover:underline" target="_blank" rel="noopener noreferrer" href={`https://platform.opentargets.org/target/${profile.ensemblId}`}>Open Targets</a>)</>}
          </p>
        </div>
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
          className="btn-secondary text-xs flex items-center gap-1.5">
          {open ? <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />}
          {open ? 'Hide' : 'Show'} resolved names
        </button>
      </div>

      {profile.warnings.map(w => (
        <p key={w} className="mt-3 flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2" role="note">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />{w}
        </p>
      ))}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3" role="group" aria-label="Filter by target label">
        {LABELS.map(l => {
          const st = LABEL_STYLE[l]
          const n = counts.get(l) ?? 0
          const on = filters.label.includes(l)
          return (
            <button key={l} type="button" onClick={() => onToggleLabel(l)} aria-pressed={on}
              className={`text-left rounded-xl border p-3 transition hover:shadow ${st.cls} ${on ? 'ring-2 ring-blue-600' : ''}`}>
              <span className="flex items-center justify-between text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5"><st.Icon className="w-3.5 h-3.5" aria-hidden="true" />{l}</span>
                <span className="tabular-nums opacity-80">{total ? Math.round((n / total) * 100) : 0}%</span>
              </span>
              <span className="block mt-1 text-2xl font-bold tabular-nums text-slate-900">{n.toLocaleString()}</span>
              <span className="block text-[11px] leading-snug text-slate-600">{st.blurb}</span>
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-slate-500 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Labels come from transparent text rules (no AI) applied to each record’s interventions, arms, title, summary, eligibility and outcomes — hover a badge for the evidence.
          Ligand / receptor neighbours (e.g. PD-L1 for PD-1, VEGFR for VEGF) are not counted as the target. Counts above reflect the other active filters.
          ClinicalTrials.gov links open a free-text search for the target’s names and main drugs; the site can’t apply these labels, so it will show more.
        </span>
      </p>

      {open && (
        <div className="mt-4 space-y-3 text-xs text-slate-700 border-t border-slate-100 pt-4">
          <p className="flex items-center gap-1.5 text-slate-500"><Database className="w-3.5 h-3.5" aria-hidden="true" />
            Sources — bundled list: {src.seed ? 'yes' : 'not listed'} · Open Targets: {SRC_TEXT[src.openTargets]} · ChEMBL: {SRC_TEXT[src.chembl]}
          </p>
          <Chips title="Names searched & matched as the target" items={profile.aliases} tone="bg-blue-50 text-blue-800 border-blue-200" />
          <Chips title={`Drugs / agents acting on the target (${profile.drugs.length})`} items={profile.drugs} tone="bg-emerald-50 text-emerald-800 border-emerald-200" max={80} />
          {profile.neighbors.map(n => (
            <Chips key={n.name} title={`Neighbours — not counted as the target: ${n.name}`} items={[...n.aliases, ...n.drugs]} tone="bg-violet-50 text-violet-800 border-violet-200" max={40} />
          ))}
        </div>
      )}
    </section>
  )
}

function Chips({ title, items, tone, max = 60 }) {
  return (
    <div>
      <p className="font-semibold text-slate-800 mb-1">{title}</p>
      <div className="flex flex-wrap gap-1">
        {items.slice(0, max).map((i, k) => <span key={`${i}-${k}`} className={`px-1.5 py-0.5 rounded border ${tone}`}>{i}</span>)}
        {items.length > max && <span className="px-1.5 py-0.5 text-slate-500">+{items.length - max} more</span>}
      </div>
    </div>
  )
}
