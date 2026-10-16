import { TrendingUp, PlayCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { STATUS_CONFIG, STATUS_GROUP_CONFIG } from '../utils/constants.js'

function StatCard({ icon: Icon, label, sublabel, count, total, colorClass, borderClass, textClass, badgeClass, breakdown }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
  return (
    <div className={`card p-5 border-l-4 ${borderClass}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${textClass}`} />
        </div>
        <span className={`tag ${badgeClass} text-xs`}>{pct}%</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{count.toLocaleString()}</p>
      <p className={`text-sm font-semibold ${textClass} mt-0.5`}>{label}</p>
      <p className="text-xs text-slate-400 mt-0.5 leading-snug">{sublabel}</p>
      {breakdown && (
        <div className="mt-3 space-y-1">
          {breakdown.map(({ label, count: c, color }) => (
            <div key={label} className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                {label}
              </span>
              <span className="font-medium text-slate-600">{c.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SummaryCards({ statusCounts, totalStudies }) {
  const getGroupCount = (groupKey) =>
    STATUS_GROUP_CONFIG[groupKey].statuses.reduce((s, st) => s + (statusCounts[st] ?? 0), 0)

  const recruitingCount = getGroupCount('recruiting')
  const activeCount = getGroupCount('active')
  const noLongerCount = getGroupCount('no_longer')

  const recruitingBreakdown = STATUS_GROUP_CONFIG.recruiting.statuses.map(s => ({
    label: STATUS_CONFIG[s].label,
    count: statusCounts[s] ?? 0,
    color: STATUS_CONFIG[s].color,
  }))

  const noLongerBreakdown = STATUS_GROUP_CONFIG.no_longer.statuses.map(s => ({
    label: STATUS_CONFIG[s].label,
    count: statusCounts[s] ?? 0,
    color: STATUS_CONFIG[s].color,
  }))

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="card p-5 border-l-4 border-slate-700 col-span-2 lg:col-span-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100">
            <TrendingUp className="w-5 h-5 text-slate-600" />
          </div>
          <span className="tag bg-slate-100 text-slate-600 text-xs">All</span>
        </div>
        <p className="text-2xl font-bold text-slate-800">{totalStudies.toLocaleString()}</p>
        <p className="text-sm font-semibold text-slate-700 mt-0.5">Total Studies</p>
        <p className="text-xs text-slate-400 mt-0.5">All phases & statuses combined</p>
      </div>

      <StatCard
        icon={PlayCircle}
        label="Overall Recruiting"
        sublabel={STATUS_GROUP_CONFIG.recruiting.sublabel}
        count={recruitingCount}
        total={totalStudies}
        colorClass="bg-green-100"
        borderClass="border-green-500"
        textClass="text-green-700"
        badgeClass="bg-green-100 text-green-700"
        breakdown={recruitingBreakdown}
      />

      <StatCard
        icon={AlertTriangle}
        label="Active, Not Recruiting"
        sublabel={STATUS_GROUP_CONFIG.active.sublabel}
        count={activeCount}
        total={totalStudies}
        colorClass="bg-blue-100"
        borderClass="border-blue-500"
        textClass="text-blue-700"
        badgeClass="bg-blue-100 text-blue-700"
      />

      <StatCard
        icon={CheckCircle}
        label="No Longer Recruiting"
        sublabel={STATUS_GROUP_CONFIG.no_longer.sublabel}
        count={noLongerCount}
        total={totalStudies}
        colorClass="bg-slate-100"
        borderClass="border-slate-400"
        textClass="text-slate-600"
        badgeClass="bg-slate-100 text-slate-600"
        breakdown={noLongerBreakdown}
      />
    </div>
  )
}
