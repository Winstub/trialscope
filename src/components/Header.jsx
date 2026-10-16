import { Activity } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-slate-900 to-blue-950 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-xl">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">TrialScope</h1>
          <p className="text-xs text-blue-300 font-medium">ClinicalTrials.gov Analytics</p>
        </div>
        <div className="ml-auto text-right hidden sm:block">
          <p className="text-xs text-slate-400">Data source</p>
          <p className="text-xs text-blue-300 font-semibold">clinicaltrials.gov API v2</p>
        </div>
      </div>
    </header>
  )
}
