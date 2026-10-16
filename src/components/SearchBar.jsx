import { useState } from 'react'
import { Search, X, Clock } from 'lucide-react'

export default function SearchBar({ onSearch, loading, history = [], disabled = false, placeholder }) {
  const [value, setValue] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  function submit(term) {
    const q = (term ?? value).trim()
    if (!q) return
    setValue(q)
    setShowHistory(false)
    onSearch(q)
  }

  function handleKey(e) {
    if (e.key === 'Enter') submit()
    if (e.key === 'Escape') setShowHistory(false)
  }

  return (
    <div className="relative w-full max-w-2xl">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => history.length && setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 150)}
            disabled={disabled}
            placeholder={placeholder ?? "Search by intervention or treatment (e.g. semaglutide, CAR-T, pembrolizumab)"}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 bg-white shadow-sm text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {value && (
            <button
              onClick={() => setValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => submit()}
          disabled={loading || !value.trim() || disabled}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {loading ? 'Loading…' : 'Search'}
        </button>
      </div>

      {/* Search history dropdown */}
      {showHistory && history.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">Recent searches</div>
          {history.map((h, i) => (
            <button
              key={i}
              onMouseDown={() => submit(h)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-slate-50 text-slate-700"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              {h}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
