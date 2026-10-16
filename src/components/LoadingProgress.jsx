import { Loader2, X } from 'lucide-react'

function Sk({ className = '' }) { return <div className={`skeleton ${className}`} aria-hidden="true" /> }

export function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-3"><Sk className="h-3 w-16" /><Sk className="h-7 w-20" /><Sk className="h-3 w-24" /></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3"><Sk className="h-4 w-32" /><Sk className="h-44 w-full" /></div>
        ))}
      </div>
      <div className="card p-5 space-y-3"><Sk className="h-4 w-48" /><Sk className="h-48 w-full" /></div>
    </div>
  )
}

export default function LoadingProgress({ loaded, total, query, page, retry, onCancel }) {
  const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0
  return (
    <div className="card p-5" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            Fetching trials for <span className="text-blue-700">“{query}”</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {retry
              ? `ClinicalTrials.gov asked us to slow down — retrying (attempt ${retry.attempt}) in ${Math.ceil(retry.waitMs / 1000)}s…`
              : total > 0
                ? `${loaded.toLocaleString()} of ${total.toLocaleString()} studies loaded${page ? ` · page ${page}` : ''}`
                : 'Contacting ClinicalTrials.gov…'}
          </p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary text-xs flex items-center gap-1 !py-1.5">
            <X className="w-3 h-3" aria-hidden="true" /> Cancel
          </button>
        )}
      </div>
      <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Loading progress">
        <div className={`h-full bg-blue-600 rounded-full transition-all duration-300 ${total === 0 ? 'w-1/4 progress-pulse' : ''}`} style={total > 0 ? { width: `${pct}%` } : undefined} />
      </div>
    </div>
  )
}
