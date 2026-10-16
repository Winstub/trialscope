import { Activity } from 'lucide-react'

export default function Header() {
  return (
    <header className="on-dark bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 bg-blue-500 rounded-xl shadow-inner" aria-hidden="true">
          <Activity className="w-5 h-5" />
        </div>
        <div className="leading-tight">
          <h1 className="text-lg font-bold tracking-tight">TrialScope</h1>
          <p className="text-[11px] text-blue-200 font-medium">Clinical trial intelligence from ClinicalTrials.gov</p>
        </div>
        <a
          href="https://clinicaltrials.gov/data-api/api"
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-xs text-slate-300 hover:text-white hidden sm:block"
        >
          Live data · API v2
        </a>
      </div>
    </header>
  )
}
