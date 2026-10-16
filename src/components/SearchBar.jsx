import { useEffect, useId, useRef, useState } from 'react'
import { Search, X, Clock, Trash2 } from 'lucide-react'
import { SEARCH_FIELDS } from '../utils/api.js'

export default function SearchBar({ onSearch, loading, history = [], onClearHistory, disabled = false, placeholder, initialValue = '' }) {
  const [value, setValue] = useState(initialValue)
  const [field, setField] = useState('intr')
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(-1)
  const inputRef = useRef(null)
  const listId = useId()
  const inputId = useId()

  useEffect(() => { setValue(initialValue) }, [initialValue])

  const matches = history.filter(h => !value.trim() || h.query.toLowerCase().includes(value.trim().toLowerCase()))
  const showList = open && matches.length > 0

  function submit(q = value, f = field) {
    const query = q.trim()
    if (!query || disabled) return
    setValue(query)
    setField(f)
    setOpen(false)
    setHi(-1)
    onSearch(query, f)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHi(i => Math.min(i + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHi(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (showList && hi >= 0) submit(matches[hi].query, matches[hi].field)
      else submit()
    } else if (e.key === 'Escape') {
      setOpen(false)
      setHi(-1)
    }
  }

  // "/" focuses the search box from anywhere
  useEffect(() => {
    function onKey(e) {
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? '')) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <form
      role="search"
      className="relative w-full max-w-3xl"
      onSubmit={e => { e.preventDefault(); submit() }}
    >
      <div className="flex gap-2 sm:gap-3">
        <div className="relative flex-1 flex rounded-xl border border-slate-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition">
          <label htmlFor={`${inputId}-field`} className="sr-only">Search in</label>
          <select
            id={`${inputId}-field`}
            value={field}
            onChange={e => setField(e.target.value)}
            disabled={disabled}
            className="rounded-l-xl bg-slate-50 border-r border-slate-200 text-xs font-semibold text-slate-600 pl-3 pr-1 py-3 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer"
          >
            {Object.entries(SEARCH_FIELDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="relative flex-1 min-w-0">
            <label htmlFor={inputId} className="sr-only">Search ClinicalTrials.gov</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={showList}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={hi >= 0 ? `${listId}-${hi}` : undefined}
              autoComplete="off"
              value={value}
              onChange={e => { setValue(e.target.value); setHi(-1); setOpen(true) }}
              onKeyDown={onKeyDown}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              disabled={disabled}
              placeholder={placeholder ?? SEARCH_FIELDS[field].placeholder}
              className="w-full min-w-0 pl-9 pr-9 py-3 rounded-r-xl bg-transparent text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {value && (
              <button
                type="button"
                aria-label="Clear search text"
                onClick={() => { setValue(''); inputRef.current?.focus() }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            : <Search className="w-4 h-4" aria-hidden="true" />}
          <span className="hidden sm:inline">{loading ? 'Searching…' : 'Search'}</span>
          <span className="sr-only sm:hidden">Search</span>
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500 hidden sm:block">
        Press <kbd className="px-1 rounded bg-slate-100 border border-slate-200 font-sans">/</kbd> to focus · <kbd className="px-1 rounded bg-slate-100 border border-slate-200 font-sans">↑</kbd> <kbd className="px-1 rounded bg-slate-100 border border-slate-200 font-sans">↓</kbd> to browse recent searches
      </p>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Recent searches"
          className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden"
        >
          <li role="presentation" className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100 flex items-center justify-between">
            Recent searches
            {onClearHistory && (
              <button type="button" onMouseDown={e => { e.preventDefault(); onClearHistory() }} className="flex items-center gap-1 font-medium text-slate-500 hover:text-red-600">
                <Trash2 className="w-3 h-3" aria-hidden="true" /> Clear
              </button>
            )}
          </li>
          {matches.map((h, i) => (
            <li
              key={`${h.field}:${h.query}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === hi}
              onMouseDown={e => { e.preventDefault(); submit(h.query, h.field) }}
              onMouseEnter={() => setHi(i)}
              className={`flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer text-slate-700 ${i === hi ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{h.query}</span>
              {h.field !== 'intr' && <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-500">{SEARCH_FIELDS[h.field].label}</span>}
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
