import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Crosshair, Ruler, HelpCircle } from 'lucide-react'

export const LABEL_STYLE = {
  Targets:         { cls: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: '#059669', Icon: Crosshair,  blurb: 'An intervention acts on the target' },
  'Measures only': { cls: 'bg-amber-50 text-amber-900 border-amber-300',       dot: '#d97706', Icon: Ruler,      blurb: 'Target only mentioned as biomarker / eligibility / prior therapy / outcome' },
  Unclear:         { cls: 'bg-slate-100 text-slate-700 border-slate-300',      dot: '#64748b', Icon: HelpCircle, blurb: 'No usable signal, background mention, or acts on a ligand/receptor neighbour' },
}

const ROLE_TAG = { target: ['acts on', 'text-emerald-700'], measure: ['mention', 'text-amber-700'], neighbor: ['neighbour', 'text-violet-700'], weak: ['bare', 'text-slate-500'] }

/** Label pill; hover / focus / tap shows why (reason + evidence snippets). Popover is position:fixed so table overflow can't clip it. */
export default function TargetBadge({ target }) {
  const [pos, setPos] = useState(null)
  const ref = useRef(null)
  const id = useId()
  if (!target) return null
  const st = LABEL_STYLE[target.label] ?? LABEL_STYLE.Unclear
  const Icon = st.Icon

  function show() {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const w = Math.min(380, window.innerWidth - 16)
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8))
    const below = r.bottom + 8 + 260 < window.innerHeight
    setPos({ left, width: w, ...(below ? { top: r.bottom + 6 } : { bottom: window.innerHeight - r.top + 6 }) })
  }

  return (
    <span className="inline-block">
      <button ref={ref} type="button" aria-describedby={pos ? id : undefined}
        onMouseEnter={show} onMouseLeave={() => setPos(null)} onFocus={show} onBlur={() => setPos(null)}
        onClick={show}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap cursor-help ${st.cls}`}>
        <Icon className="w-3 h-3" aria-hidden="true" />{target.label}
      </button>
      {pos && createPortal(
        <div id={id} role="tooltip" style={{ position: 'fixed', zIndex: 60, ...pos }}
          className="pointer-events-none rounded-xl border border-slate-200 bg-white shadow-xl p-3 text-left text-xs text-slate-700 leading-snug">
          <p className="font-semibold text-slate-900">{target.label}</p>
          <p className="mt-0.5 text-slate-600">{target.reason}</p>
          {target.evidence.length > 0 && (
            <ul className="mt-2 space-y-1.5 max-h-56 overflow-auto">
              {target.evidence.slice(0, 4).map((e, i) => {
                const [tag, tone] = ROLE_TAG[e.role] ?? ROLE_TAG.weak
                return (
                  <li key={i} className="border-l-2 pl-2" style={{ borderColor: e.role === 'target' ? '#059669' : e.role === 'measure' ? '#d97706' : e.role === 'neighbor' ? '#7c3aed' : '#cbd5e1' }}>
                    <span className={`font-semibold ${tone}`}>{tag}</span> <span className="text-slate-500">· {e.where}</span>
                    <p className="text-slate-800">“{e.snippet}”</p>
                    <p className="text-[11px] text-slate-500"><b className="font-semibold">{e.matched}</b> — {e.note}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </div>,
        document.body
      )}
    </span>
  )
}
