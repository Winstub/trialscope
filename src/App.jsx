import { useState, useRef, useCallback } from 'react'
import { AlertCircle, RefreshCw, Download, ChevronDown, ChevronUp, Info, X, Plus } from 'lucide-react'
import Header from './components/Header.jsx'
import SearchBar from './components/SearchBar.jsx'
import LoadingProgress from './components/LoadingProgress.jsx'
import SummaryCards from './components/SummaryCards.jsx'
import StatusDonutChart from './components/StatusDonutChart.jsx'
import GroupedStatusChart from './components/GroupedStatusChart.jsx'
import PhaseStatusMatrix from './components/PhaseStatusMatrix.jsx'
import TimelineChart from './components/TimelineChart.jsx'
import GroupedDimensionChart from './components/GroupedDimensionChart.jsx'
import ComparisonView from './components/ComparisonView.jsx'
import { fetchAllStudies, aggregateStudies, FetchAbortedError } from './utils/api.js'
import { DIMENSION_CONFIG, DIMENSION_ORDER, SEARCH_COLORS } from './utils/constants.js'

const MAX_HISTORY = 8
const MAX_SEARCHES = 10

let nextId = 1

export default function App() {
  const [query, setQuery]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [progress, setProgress]     = useState({ loaded: 0, total: 0 })
  const [searches, setSearches]     = useState([])   // [{ id, query, stats, totalFetched, totalCount, truncated, color }]
  const [activeTab, setActiveTab]   = useState(null) // id of single-view tab, or 'compare'
  const [error, setError]           = useState(null)
  const [history, setHistory]       = useState([])
  const [matrixOpen, setMatrixOpen] = useState(true)
  const abortRef = useRef(null)

  const handleSearch = useCallback(async (searchQuery) => {
    if (searches.length >= MAX_SEARCHES) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setQuery(searchQuery)
    setLoading(true)
    setError(null)
    setProgress({ loaded: 0, total: 0 })

    try {
      const { studies, totalCount, truncated } = await fetchAllStudies(searchQuery, {
        signal: controller.signal,
        onProgress: p => setProgress({ loaded: p.loaded, total: p.total }),
      })

      const stats = aggregateStudies(studies)
      const id = nextId++
      const color = SEARCH_COLORS[(id - 1) % SEARCH_COLORS.length]

      const entry = { id, query: searchQuery, stats, totalFetched: studies.length, totalCount, truncated, color }

      setSearches(prev => {
        const next = [...prev, entry]
        // Auto-switch to compare view when 2+ results exist
        setActiveTab(next.length >= 2 ? 'compare' : id)
        return next
      })

      setHistory(prev => {
        const next = [searchQuery, ...prev.filter(h => h.toLowerCase() !== searchQuery.toLowerCase())]
        return next.slice(0, MAX_HISTORY)
      })
    } catch (err) {
      if (err instanceof FetchAbortedError) return
      setError(err.message ?? 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }, [searches.length])

  function removeSearch(id) {
    setSearches(prev => {
      const next = prev.filter(s => s.id !== id)
      if (next.length === 0) setActiveTab(null)
      else if (activeTab === id) setActiveTab(next.length >= 2 ? 'compare' : next[next.length - 1].id)
      return next
    })
  }

  function clearAll() {
    setSearches([])
    setActiveTab(null)
    setError(null)
  }

  function handleExport() {
    const target = searches.find(s => s.id === activeTab)
    if (!target) return
    const { stats, query: q, totalFetched } = target
    const rows = [['Phase', 'Status', 'Count']]
    for (const [phase, statusMap] of Object.entries(stats.phaseStatusMatrix)) {
      for (const [status, count] of Object.entries(statusMap)) {
        rows.push([phase, status, count])
      }
    }
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clinicaltrials_${q.replace(/\s+/g, '_')}_${totalFetched}studies.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeResult = searches.find(s => s.id === activeTab)
  const showCompare  = activeTab === 'compare' && searches.length >= 2

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Search section */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <SearchBar
              onSearch={handleSearch}
              loading={loading}
              history={history}
              disabled={searches.length >= MAX_SEARCHES}
              placeholder={searches.length >= MAX_SEARCHES
                ? `Max ${MAX_SEARCHES} interventions — remove one to add more`
                : searches.length > 0
                  ? 'Add another intervention to compare…'
                  : 'Search intervention or treatment…'}
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              {activeResult && !loading && (
                <button onClick={handleExport} className="btn-secondary flex items-center gap-1.5 text-sm">
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
              {searches.length > 0 && (
                <button onClick={clearAll} className="btn-secondary flex items-center gap-1.5 text-sm text-slate-500">
                  <X className="w-3.5 h-3.5" />
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Quick-search pills — only when nothing loaded */}
          {searches.length === 0 && !loading && !error && (
            <div className="mt-3 flex flex-wrap gap-2">
              {['semaglutide', 'CAR-T', 'pembrolizumab', 'mRNA vaccine', 'CRISPR', 'lecanemab', 'ozempic'].map(s => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full font-medium transition-colors border border-blue-100"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Tab bar — shown once at least one search is loaded */}
          {searches.length > 0 && (
            <div className="mt-4 flex items-center gap-1 flex-wrap">
              {searches.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    activeTab === s.id
                      ? 'text-white shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                  style={activeTab === s.id
                    ? { backgroundColor: s.color, borderColor: s.color }
                    : {}}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: activeTab === s.id ? 'rgba(255,255,255,0.6)' : s.color }} />
                  {s.query}
                  <span
                    onClick={e => { e.stopPropagation(); removeSearch(s.id) }}
                    className={`ml-0.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      activeTab === s.id
                        ? 'hover:bg-white/20 text-white/70 hover:text-white'
                        : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </span>
                </button>
              ))}

              {searches.length >= 2 && (
                <button
                  onClick={() => setActiveTab('compare')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    activeTab === 'compare'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  Compare all {searches.length}
                </button>
              )}

              {searches.length < MAX_SEARCHES && !loading && (
                <span className="text-xs text-slate-400 ml-1 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> search to add
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">

        {/* Loading */}
        {loading && (
          <LoadingProgress loaded={progress.loaded} total={progress.total} query={query} />
        )}

        {/* Error */}
        {error && !loading && (
          <div className="card p-6 border-red-200 bg-red-50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-700">Search failed</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
            <button onClick={() => handleSearch(query)} className="btn-secondary text-sm flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* ── Compare view ── */}
        {showCompare && <ComparisonView searches={searches} />}

        {/* ── Single-result view ── */}
        {activeResult && !showCompare && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Results for{' '}
                  <span style={{ color: activeResult.color }}>"{activeResult.query}"</span>
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {activeResult.totalFetched.toLocaleString()} studies analysed
                  {activeResult.truncated && (
                    <span className="ml-2 text-amber-600 font-medium">
                      (truncated — {activeResult.totalCount.toLocaleString()} total on CT.gov)
                    </span>
                  )}
                </p>
              </div>
              {activeResult.truncated && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  Result set truncated to 20,000 studies. Try a more specific search for full accuracy.
                </div>
              )}
            </div>

            <SummaryCards
              statusCounts={activeResult.stats.statusCounts}
              totalStudies={activeResult.totalFetched}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <StatusDonutChart
                statusCounts={activeResult.stats.statusCounts}
                totalStudies={activeResult.totalFetched}
              />
              <GroupedStatusChart
                statusCounts={activeResult.stats.statusCounts}
                totalStudies={activeResult.totalFetched}
              />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-blue-500 inline-block" />
                Dimensions Explorer
                <span className="text-xs font-normal text-slate-400 ml-1">— click any row to expand</span>
              </h3>
              <div className="space-y-2">
                {DIMENSION_ORDER.map((dimKey, i) => (
                  <GroupedDimensionChart
                    key={dimKey}
                    byGroup={activeResult.stats.dimByGroup?.[dimKey]}
                    config={DIMENSION_CONFIG[dimKey]}
                    defaultExpanded={i < 3}
                  />
                ))}
              </div>
            </div>

            <div className="card overflow-hidden">
              <button
                onClick={() => setMatrixOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div>
                  <span className="font-semibold text-slate-800">Phase × Status Matrix</span>
                  <span className="ml-2 text-xs text-slate-400">heat-map cross-tabulation</span>
                </div>
                {matrixOpen
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {matrixOpen && (
                <div className="px-5 pb-5">
                  <PhaseStatusMatrix phaseStatusMatrix={activeResult.stats.phaseStatusMatrix} />
                </div>
              )}
            </div>

            {Object.keys(activeResult.stats.timelineByYear).length >= 2 && (
              <TimelineChart timelineByYear={activeResult.stats.timelineByYear} />
            )}
          </>
        )}

        {/* Empty state */}
        {searches.length === 0 && !loading && !error && (
          <div className="text-center py-20 text-slate-400 space-y-3">
            <div className="text-6xl">🔬</div>
            <p className="text-lg font-semibold text-slate-500">Search any intervention or treatment above</p>
            <p className="text-sm max-w-md mx-auto">
              TrialScope queries ClinicalTrials.gov in real time and visualises phase distributions,
              recruitment status, and temporal trends. Add multiple interventions to compare them side-by-side.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-400">
          <span>Data sourced from <a href="https://clinicaltrials.gov" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">ClinicalTrials.gov</a> API v2 — NLM/NIH</span>
          <span>For research purposes only. Not for clinical decision-making.</span>
        </div>
      </footer>
    </div>
  )
}
