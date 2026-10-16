export default function LoadingProgress({ loaded, total, query }) {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0

  return (
    <div className="card p-8 text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
      <div>
        <p className="font-semibold text-slate-700">Fetching trials for <span className="text-blue-700">"{query}"</span></p>
        {total > 0 && (
          <p className="text-sm text-slate-500 mt-1">
            {loaded.toLocaleString()} of {total.toLocaleString()} studies loaded
          </p>
        )}
      </div>
      {total > 0 && (
        <div className="max-w-sm mx-auto">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300 progress-pulse"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{pct}%</p>
        </div>
      )}
      <p className="text-xs text-slate-400">Querying ClinicalTrials.gov API v2 — this may take a moment for large result sets</p>
    </div>
  )
}
