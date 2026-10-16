import { useState } from 'react'
import ComparisonSummary from './ComparisonSummary.jsx'
import ComparisonDimensionChart from './ComparisonDimensionChart.jsx'
import ComparisonTimeline from './ComparisonTimeline.jsx'
import { DIMENSION_CONFIG, DIMENSION_ORDER } from '../utils/constants.js'

const GROUP_FILTERS = [
  { key: 'all',        label: 'All Studies' },
  { key: 'recruiting', label: 'Overall Recruiting' },
  { key: 'active',     label: 'Active, Not Rec.' },
  { key: 'no_longer',  label: 'No Longer Rec.' },
]

export default function ComparisonView({ searches }) {
  const [groupFilter, setGroupFilter] = useState('all')
  const [normalize, setNormalize]     = useState(false)

  return (
    <div className="space-y-4">
      {/* Global filter toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
          {GROUP_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setGroupFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                groupFilter === f.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setNormalize(n => !n)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            normalize
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
          }`}
        >
          {normalize ? '% Share' : 'Count'}
        </button>
        <span className="text-xs text-slate-400 hidden md:block">
          Showing {normalize ? 'percentage share within each intervention' : 'raw counts'} for "{GROUP_FILTERS.find(f => f.key === groupFilter)?.label}"
        </span>
      </div>

      {/* Summary table */}
      <ComparisonSummary searches={searches} />

      {/* Dimension charts */}
      <div className="space-y-2">
        {DIMENSION_ORDER.map((dimKey, i) => (
          <ComparisonDimensionChart
            key={dimKey}
            searches={searches}
            config={DIMENSION_CONFIG[dimKey]}
            dimKey={dimKey}
            groupFilter={groupFilter}
            normalize={normalize}
            defaultExpanded={i < 3}
          />
        ))}
      </div>

      {/* Timeline */}
      <ComparisonTimeline searches={searches} groupFilter={groupFilter} />
    </div>
  )
}
