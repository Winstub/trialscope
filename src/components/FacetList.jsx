import { useState } from 'react'

/** Ranked, click-to-filter horizontal bars built from real buttons (keyboard + screen-reader friendly). */
export default function FacetList({ title, subtitle, items, selected = [], onToggle, maxRows = 8, color = '#2563eb', footnote, emptyText = 'No data' }) {
  const [showAll, setShowAll] = useState(false)
  const max = Math.max(1, ...items.map(i => i.count))
  const total = items.reduce((s, i) => s + i.count, 0)
  // Always keep selected rows visible even if outside the top-N
  const visible = showAll ? items : items.filter((it, idx) => idx < maxRows || selected.includes(it.key))
  const anySelected = selected.length > 0

  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="mb-3">
        <h3 className="card-title">{title}</h3>
        {subtitle && <p className="card-sub">{subtitle}</p>}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5 flex-1">
          {visible.map(it => {
            const isSel = selected.includes(it.key)
            const c = it.color ?? color
            return (
              <li key={it.key}>
                <button
                  type="button"
                  onClick={() => onToggle?.(it.key)}
                  aria-pressed={isSel}
                  title={`${it.label} — ${it.count.toLocaleString()} trials. Click to ${isSel ? 'remove filter' : 'filter'}`}
                  className={`group w-full text-left rounded-lg px-2 py-1.5 transition ${isSel ? 'bg-blue-50 ring-1 ring-blue-300' : 'hover:bg-slate-50'} ${anySelected && !isSel ? 'opacity-60 hover:opacity-100' : ''}`}
                >
                  <span className="flex items-baseline justify-between gap-3 text-xs">
                    <span className={`truncate ${isSel ? 'font-semibold text-slate-900' : 'text-slate-700'} ${it.muted ? 'text-slate-500' : ''}`}>{it.label}</span>
                    <span className="flex-shrink-0 tabular-nums text-slate-600">
                      <span className="font-semibold text-slate-800">{it.count.toLocaleString()}</span>
                      <span className="ml-1.5 text-slate-500">{total ? `${Math.round((it.count / total) * 100)}%` : ''}</span>
                    </span>
                  </span>
                  <span className="mt-1 block h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                    <span className="block h-full rounded-full transition-all" style={{ width: `${Math.max(2, (it.count / max) * 100)}%`, backgroundColor: c }} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {items.length > maxRows && (
        <button type="button" onClick={() => setShowAll(s => !s)} className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900 self-start">
          {showAll ? 'Show fewer' : `Show all ${items.length}`}
        </button>
      )}
      {footnote && <p className="mt-2 text-[11px] text-slate-500">{footnote}</p>}
    </div>
  )
}
