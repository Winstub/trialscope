import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, RefreshCw, Download, Info, X, Link2, Check, Printer, SearchX, Microscope, Layers, Filter, Share2 } from 'lucide-react'
import Header from './components/Header.jsx'
import SearchBar from './components/SearchBar.jsx'
import LoadingProgress, { DashboardSkeleton } from './components/LoadingProgress.jsx'
import Dashboard from './components/Dashboard.jsx'
import ComparisonView from './components/ComparisonView.jsx'
import { sortRows } from './components/TrialTable.jsx'
import { fetchAllStudies, aggregateStudies, formatDate, FetchAbortedError, SEARCH_FIELDS } from './utils/api.js'
import { EMPTY_FILTERS, applyFilters, buildUrlSearch, readUrlState, searchKey } from './utils/filters.js'
import { csvCell, downloadBlob, slug } from './utils/format.js'
import { SEARCH_COLORS } from './utils/constants.js'

const MAX_HISTORY = 8
const MAX_SEARCHES = 10
const HISTORY_KEY = 'trialscope.history.v1'

// Chosen for cell & gene therapy / cell-culture manufacturing audiences
const EXAMPLES = [
  { query: 'CAR-T', field: 'intr' },
  { query: 'tumor infiltrating lymphocytes', field: 'intr' },
  { query: 'lentiviral vector', field: 'intr' },
  { query: 'mesenchymal stem cells', field: 'intr' },
  { query: 'AAV gene therapy', field: 'intr' },
  { query: 'iPSC', field: 'term' },
  { query: 'NK cell', field: 'intr' },
]

const NUMERIC_SORTS = ['enrollment', 'start', 'end']

function loadHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter(h => h && typeof h.query === 'string' && SEARCH_FIELDS[h.field]).slice(0, MAX_HISTORY) : []
  } catch { return [] }
}

function toCsv(rows, withSearch) {
  const head = [...(withSearch ? ['Search'] : []), 'NCT ID', 'URL', 'Title', 'Status', 'Phase', 'Lead sponsor', 'Sponsor class', 'Conditions',
    'Enrollment', 'Enrollment type', 'Start date', 'Completion date', 'Countries', 'Intervention types', 'Routes']
  const lines = [head.map(csvCell).join(',')]
  for (const r of rows) {
    lines.push([
      ...(withSearch ? [r._search] : []),
      r.id, `https://clinicaltrials.gov/study/${r.id}`, r.title, r.status, r.phases.join('|'), r.sponsor, r.sponsorClass,
      r.conditions.join('; '), r.enrollment ?? '', r.enrollmentType ?? '', r.startDate ?? '', r.endDate ?? '',
      r.countries.join('; '), r.interventionTypes.join('; '), r.routes.join('; '),
    ].map(csvCell).join(','))
  }
  return lines.join('\r\n')
}

export default function App() {
  const boot = useRef(readUrlState()).current
  const [searches, setSearches]   = useState([])   // [{ id, key, query, field, records, stats, totalCount, truncated, incomplete, color }]
  const [activeTab, setActiveTab] = useState(null) // id or 'compare'
  const [loading, setLoading]     = useState(boot.searches.length > 0)
  const [pending, setPending]     = useState(boot.searches[0] ?? null)
  const [progress, setProgress]   = useState({ loaded: 0, total: 0, page: 0, retry: null })
  const [error, setError]         = useState(null)   // { message, search }
  const [notice, setNotice]       = useState(null)   // search that returned zero trials
  const [history, setHistory]     = useState(loadHistory)
  const [filters, setFilters]     = useState(boot.filters)
  const [sort, setSort]           = useState(boot.sort)
  const [dir, setDir]             = useState(boot.dir)
  const [ready, setReady]         = useState(boot.searches.length === 0)
  const [copied, setCopied]       = useState(false)

  const searchesRef = useRef([])
  const abortRef = useRef(null)
  const tokenRef = useRef(0)
  const idRef = useRef(1)
  const cacheRef = useRef(new Map())

  const runSearch = useCallback(async (search, { boot: isBoot = false } = {}) => {
    const key = searchKey(search)
    const existing = searchesRef.current.find(s => s.key === key)
    if (existing) {
      if (!isBoot) { setActiveTab(existing.id); setFilters(EMPTY_FILTERS); setSort(null); setError(null); setNotice(null) }
      return existing
    }
    if (searchesRef.current.length >= MAX_SEARCHES) return null

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const token = ++tokenRef.current

    setPending(search)
    setLoading(true)
    setError(null)
    setNotice(null)
    setProgress({ loaded: 0, total: 0, page: 0, retry: null })

    try {
      let data = cacheRef.current.get(key)
      if (!data) {
        data = await fetchAllStudies(search.query, {
          field: search.field,
          signal: controller.signal,
          onProgress: p => { if (token === tokenRef.current) setProgress({ loaded: p.loaded, total: p.total, page: p.page, retry: p.retry ?? null }) },
        })
        cacheRef.current.set(key, data)
      }
      if (token !== tokenRef.current) return null   // superseded by a newer search

      if (data.records.length === 0) { setNotice(search); return null }

      const id = idRef.current++
      const entry = {
        id, key, query: search.query, field: search.field, records: data.records, stats: aggregateStudies(data.records),
        totalCount: data.totalCount, truncated: data.truncated, incomplete: data.incomplete,
        color: SEARCH_COLORS[(id - 1) % SEARCH_COLORS.length],
      }
      const next = [...searchesRef.current, entry]
      searchesRef.current = next
      setSearches(next)
      if (!isBoot) {
        setActiveTab(next.length >= 2 ? 'compare' : id)
        setFilters(EMPTY_FILTERS)
        setSort(null)
      }
      setHistory(prev => {
        const merged = [{ query: search.query, field: search.field }, ...prev.filter(h => searchKey(h) !== key)].slice(0, MAX_HISTORY)
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(merged)) } catch { /* storage unavailable */ }
        return merged
      })
      return entry
    } catch (err) {
      if (err instanceof FetchAbortedError || token !== tokenRef.current) return null
      setError({ message: err.message ?? 'An unexpected error occurred.', search })
      return null
    } finally {
      if (token === tokenRef.current) setLoading(false)
    }
  }, [])

  // Restore a shared URL: run its searches in order, then restore the tab.
  const booted = useRef(false)
  useEffect(() => {
    if (booted.current || boot.searches.length === 0) return
    booted.current = true
    ;(async () => {
      for (const s of boot.searches) await runSearch(s, { boot: true })
      const list = searchesRef.current
      if (list.length >= 2 && (boot.tab === 'compare' || boot.tab === null)) setActiveTab('compare')
      else if (list.length) {
        const idx = Number(boot.tab)
        setActiveTab((Number.isInteger(idx) && list[idx] ? list[idx] : list[list.length - 1]).id)
      }
      setReady(true)
    })()
  }, [boot, runSearch])

  function cancelLoading() {
    abortRef.current?.abort()
    tokenRef.current++
    setLoading(false)
    if (!ready) setReady(true)
  }

  function selectTab(t) {
    setActiveTab(t)
    setFilters(EMPTY_FILTERS)
    setSort(null)
  }

  function removeSearch(id) {
    const next = searchesRef.current.filter(s => s.id !== id)
    searchesRef.current = next
    setSearches(next)
    if (next.length === 0) { setActiveTab(null); setFilters(EMPTY_FILTERS) }
    else if (next.length === 1) selectTab(next[0].id)
    else if (activeTab === id) selectTab('compare')
  }

  function clearAll() {
    abortRef.current?.abort()
    tokenRef.current++
    searchesRef.current = []
    setSearches([])
    setActiveTab(null)
    setError(null)
    setNotice(null)
    setLoading(false)
    setFilters(EMPTY_FILTERS)
    setSort(null)
  }

  const handleSearch = useCallback((query, field = 'intr') => runSearch({ query: query.trim(), field }), [runSearch])

  const activeResult = searches.find(s => s.id === activeTab)
  const showCompare  = activeTab === 'compare' && searches.length >= 2

  const filtered = useMemo(() => (activeResult ? applyFilters(activeResult.records, filters) : []), [activeResult, filters])
  const sorted = useMemo(() => sortRows(filtered, sort, dir), [filtered, sort, dir])

  function onSort(key, reset = false) {
    if (!key) { setSort(null); return }
    if (!reset && sort === key) setDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSort(key); setDir(NUMERIC_SORTS.includes(key) ? 'desc' : 'asc') }
  }

  // Keep the address bar in sync so any view is shareable.
  useEffect(() => {
    if (!ready) return
    const tab = activeTab === 'compare' ? 'compare' : searches.findIndex(s => s.id === activeTab)
    const qs = buildUrlSearch({ searches, tab: tab === -1 ? null : tab, filters, sort, dir })
    if (qs !== window.location.search) window.history.replaceState(null, '', `${window.location.pathname}${qs}${window.location.hash}`)
    document.title = searches.length ? `${searches.map(s => s.query).join(' vs ')} — TrialScope` : 'TrialScope — ClinicalTrials.gov Analytics'
  }, [ready, searches, activeTab, filters, sort, dir])

  function handleExport() {
    let csv, name
    if (showCompare) {
      const rows = searches.flatMap(s => s.records.map(r => ({ ...r, _search: s.query })))
      csv = toCsv(rows, true)
      name = `trialscope_compare_${slug(searches.map(s => s.query).join('-'))}_${rows.length}.csv`
    } else if (activeResult) {
      csv = toCsv(sorted, false)
      name = `trialscope_${slug(activeResult.query)}_${sorted.length}-trials.csv`
    } else return
    downloadBlob(name, csv)
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href) }
    catch { window.prompt('Copy this link:', window.location.href) }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const atMax = searches.length >= MAX_SEARCHES
  const hasResults = searches.length > 0

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:px-3 focus:py-2 focus:bg-white focus:rounded-lg focus:shadow">Skip to results</a>
      <div className="no-print"><Header /></div>

      <div className="bg-white border-b border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-start gap-3">
            <SearchBar
              onSearch={handleSearch}
              loading={loading}
              history={history}
              onClearHistory={() => { setHistory([]); try { localStorage.removeItem(HISTORY_KEY) } catch { /* ignore */ } }}
              disabled={atMax}
              placeholder={atMax ? `Max ${MAX_SEARCHES} searches — remove one to add more`
                : hasResults ? 'Add a search to compare…' : undefined}
            />
            {hasResults && (
              <div className="flex items-center gap-2 flex-wrap lg:ml-auto lg:pt-0.5">
                <button type="button" onClick={copyLink} className="btn-secondary flex items-center gap-1.5 text-sm" title="Copy a shareable link to this exact view">
                  {copied ? <Check className="w-4 h-4 text-green-600" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}
                  {copied ? 'Link copied' : 'Share'}
                </button>
                <button type="button" onClick={handleExport} disabled={loading || (!showCompare && !activeResult)} className="btn-secondary flex items-center gap-1.5 text-sm">
                  <Download className="w-4 h-4" aria-hidden="true" /> CSV
                </button>
                <button type="button" onClick={() => window.print()} className="btn-secondary flex items-center gap-1.5 text-sm" title="Print or save as PDF">
                  <Printer className="w-4 h-4" aria-hidden="true" /> Print / PDF
                </button>
                <button type="button" onClick={clearAll} className="btn-secondary flex items-center gap-1.5 text-sm text-slate-600">
                  <X className="w-3.5 h-3.5" aria-hidden="true" /> Clear
                </button>
              </div>
            )}
          </div>

          {hasResults && (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap" role="group" aria-label="Searches">
              {searches.map(s => {
                const on = activeTab === s.id
                return (
                  <span key={s.id} className={`inline-flex items-stretch rounded-lg border text-xs font-semibold overflow-hidden transition-colors ${on ? 'text-white shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'}`}
                    style={on ? { backgroundColor: s.color, borderColor: s.color } : undefined}>
                    <button type="button" onClick={() => selectTab(s.id)} aria-pressed={on} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-none">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: on ? 'rgba(255,255,255,.7)' : s.color }} aria-hidden="true" />
                      <span className="max-w-[200px] truncate">{s.query}</span>
                      {s.field !== 'intr' && <span className={`text-[10px] font-medium ${on ? 'text-white/80' : 'text-slate-500'}`}>{SEARCH_FIELDS[s.field].label.toLowerCase()}</span>}
                      <span className={`font-medium tabular-nums ${on ? 'text-white/85' : 'text-slate-500'}`}>{s.records.length.toLocaleString()}</span>
                    </button>
                    <button type="button" onClick={() => removeSearch(s.id)} aria-label={`Remove search ${s.query}`}
                      className={`px-1.5 rounded-none ${on ? 'hover:bg-white/20 text-white/80 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              })}
              {searches.length >= 2 && (
                <button type="button" onClick={() => selectTab('compare')} aria-pressed={activeTab === 'compare'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${activeTab === 'compare' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'}`}>
                  <Layers className="w-3.5 h-3.5" aria-hidden="true" /> Compare all {searches.length}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <main id="main" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {hasResults && (
          <div className="print-only text-sm text-slate-600">
            TrialScope · {searches.map(s => s.query).join(' vs ')} · generated {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })} · data from ClinicalTrials.gov
          </div>
        )}

        {loading && (
          <LoadingProgress loaded={progress.loaded} total={progress.total} page={progress.page} retry={progress.retry} query={pending?.query ?? ''} onCancel={cancelLoading} />
        )}
        {loading && !hasResults && <DashboardSkeleton />}

        {error && !loading && (
          <div className="card p-5 border-red-200 bg-red-50 flex items-start gap-3" role="alert">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-red-800">Search failed{error.search ? ` for “${error.search.query}”` : ''}</p>
              <p className="text-sm text-red-700 mt-0.5">{error.message}</p>
            </div>
            {error.search && (
              <button type="button" onClick={() => runSearch(error.search)} className="btn-secondary text-sm flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Retry
              </button>
            )}
          </div>
        )}

        {notice && !loading && (
          <div className="card p-8 text-center" role="status">
            <SearchX className="w-9 h-9 mx-auto text-slate-400" aria-hidden="true" />
            <p className="mt-3 font-semibold text-slate-800">No trials found for “{notice.query}”</p>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              Check the spelling, try a broader or more common name, or switch the search scope (Intervention / Condition / Any term).
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {EXAMPLES.slice(0, 4).map(ex => <ExampleChip key={ex.query} ex={ex} onClick={() => runSearch(ex)} />)}
            </div>
          </div>
        )}

        {showCompare && <ComparisonView key={searches.map(s => s.id).join('-')} searches={searches} />}

        {activeResult && !showCompare && (
          <>
            <div className="flex items-end justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  <span style={{ color: activeResult.color }}>{activeResult.query}</span>
                  <span className="text-slate-500 font-medium text-base sm:text-lg"> · {SEARCH_FIELDS[activeResult.field].label.toLowerCase()} search</span>
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  {activeResult.records.length.toLocaleString()} trials analysed
                  {activeResult.totalCount > activeResult.records.length && ` of ${activeResult.totalCount.toLocaleString()} on ClinicalTrials.gov`}
                </p>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 no-print">
                <Filter className="w-3.5 h-3.5" aria-hidden="true" /> Click any chart element to filter every chart and the trial table
              </p>
            </div>

            {(activeResult.truncated || activeResult.incomplete) && (
              <div className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3" role="note">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {activeResult.incomplete
                    ? `Partial results: loading stopped early (${activeResult.incomplete}) — showing ${activeResult.records.length.toLocaleString()} of ${activeResult.totalCount.toLocaleString()} trials.`
                    : `Result set capped at ${activeResult.records.length.toLocaleString()} of ${activeResult.totalCount.toLocaleString()} trials. Try a more specific search for full accuracy.`}
                </span>
              </div>
            )}

            <Dashboard entry={activeResult} filters={filters} setFilters={setFilters} filtered={filtered} sorted={sorted}
              sort={sort} dir={dir} onSort={onSort} onExport={handleExport} />
          </>
        )}

        {!hasResults && !loading && !error && !notice && (
          <div className="text-center py-12 sm:py-16 space-y-5">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center"><Microscope className="w-7 h-7 text-blue-700" aria-hidden="true" /></div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">See the whole trial landscape in seconds</h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                Search an intervention, condition or any term. TrialScope pulls every matching study from ClinicalTrials.gov and shows phases, status,
                sponsors, countries, enrollment and start-year trends — then lets you click through to the underlying trials.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Try an example</p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLES.map(ex => <ExampleChip key={ex.query} ex={ex} onClick={() => runSearch(ex)} />)}
              </div>
            </div>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5"><Share2 className="w-3.5 h-3.5" aria-hidden="true" /> Add several searches to compare them side by side. Every view has a shareable URL.</p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-1 sm:items-center sm:justify-between text-xs text-slate-500">
          <span>Data from <a href="https://clinicaltrials.gov" target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">ClinicalTrials.gov</a> API v2 (NLM/NIH){activeResult ? ` · retrieved ${formatDate(new Date().toISOString().slice(0, 10))}` : ''}</span>
          <span>For research purposes only. Not for clinical decision-making.</span>
        </div>
      </footer>
    </div>
  )
}

function ExampleChip({ ex, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="text-sm px-3.5 py-1.5 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-800 rounded-full font-medium transition-colors border border-slate-300 hover:border-blue-300 shadow-sm">
      {ex.query}
    </button>
  )
}
