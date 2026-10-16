// Cross-filtering, faceting and URL (de)serialisation for the single-search dashboard.
import { SEARCH_FIELDS } from './api.js'

export const ENROLLMENT_BINS = [
  { key: '0', label: '1–10',        min: 1,    max: 10 },
  { key: '1', label: '11–25',       min: 11,   max: 25 },
  { key: '2', label: '26–50',       min: 26,   max: 50 },
  { key: '3', label: '51–100',      min: 51,   max: 100 },
  { key: '4', label: '101–250',     min: 101,  max: 250 },
  { key: '5', label: '251–500',     min: 251,  max: 500 },
  { key: '6', label: '501–1,000',   min: 501,  max: 1000 },
  { key: '7', label: '1,001–5,000', min: 1001, max: 5000 },
  { key: '8', label: '> 5,000',     min: 5001, max: Infinity },
  { key: 'na', label: 'Not reported', min: null, max: null },
]

/** Implausible enrollment (>= 10M, or all-nines placeholders such as 99,999,999). Excluded from totals/medians/distribution. */
export function isEnrollmentOutlier(n) {
  return Number.isFinite(n) && (n >= 10_000_000 || (n >= 99_999 && /^9+$/.test(String(n))))
}

/** Enrollment safe to aggregate, or null. */
export const validEnrollment = n => (Number.isFinite(n) && n > 0 && !isEnrollmentOutlier(n) ? n : null)

export function enrollmentBin(n) {
  if (isEnrollmentOutlier(n)) return 'out'
  if (n === null || n === undefined || n <= 0) return 'na'
  return ENROLLMENT_BINS.find(b => b.min !== null && n >= b.min && n <= b.max)?.key ?? 'na'
}

export const EMPTY_FILTERS = { status: [], phase: [], cls: [], country: [], sponsor: [], enr: [], yearFrom: null, yearTo: null, text: '' }

export function hasFilters(f) {
  return f.status.length || f.phase.length || f.cls.length || f.country.length || f.sponsor.length ||
    f.enr.length || f.yearFrom !== null || f.yearTo !== null || f.text.trim() !== ''
}

export function matchesText(r, text) {
  const t = text.trim().toLowerCase()
  if (!t) return true
  return r.id.toLowerCase().includes(t) || r.title.toLowerCase().includes(t) ||
    r.sponsor.toLowerCase().includes(t) || r.conditions.some(c => c.toLowerCase().includes(t))
}

/** True if record passes every active filter, except dimensions listed in `skip`. */
export function passes(r, f, skip = []) {
  if (!skip.includes('status')  && f.status.length  && !f.status.includes(r.status)) return false
  if (!skip.includes('phase')   && f.phase.length   && !r.phases.some(p => f.phase.includes(p))) return false
  if (!skip.includes('cls')     && f.cls.length     && !f.cls.includes(r.sponsorClass)) return false
  if (!skip.includes('country') && f.country.length && !r.countries.some(c => f.country.includes(c))) return false
  if (!skip.includes('sponsor') && f.sponsor.length && !f.sponsor.includes(r.sponsor)) return false
  if (!skip.includes('enr')     && f.enr.length     && !f.enr.includes(enrollmentBin(r.enrollment))) return false
  if (!skip.includes('year') && (f.yearFrom !== null || f.yearTo !== null)) {
    if (r.startYear === null) return false
    if (f.yearFrom !== null && r.startYear < f.yearFrom) return false
    if (f.yearTo !== null && r.startYear > f.yearTo) return false
  }
  if (!skip.includes('text') && !matchesText(r, f.text)) return false
  return true
}

export function applyFilters(records, f) {
  return hasFilters(f) ? records.filter(r => passes(r, f)) : records
}

/** Count records per key (accessor may return an array), ignoring this facet's own filter. */
export function facet(records, f, skip, accessor) {
  const counts = new Map()
  for (const r of records) {
    if (!passes(r, f, skip)) continue
    const v = accessor(r)
    for (const k of (Array.isArray(v) ? v : [v])) {
      if (k === null || k === undefined || k === '') continue
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
  }
  return counts
}

export function topN(counts, n) {
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).slice(0, n)
}

export function median(values) {
  const v = values.filter(x => Number.isFinite(x)).sort((a, b) => a - b)
  if (!v.length) return null
  const m = v.length >> 1
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2
}

// ── URL state ────────────────────────────────────────────────────────────────

/** "CAR-T" → {field:'intr'}; "cond:glioma" → {field:'cond'}; "term:x" → {field:'term'} */
export function parseSearchToken(token) {
  const m = /^(intr|cond|term):(.*)$/.exec(token)
  if (m && m[2].trim()) return { field: m[1], query: m[2].trim() }
  return { field: 'intr', query: token.trim() }
}

export function searchToken({ field, query }) {
  return field === 'intr' ? query : `${field}:${query}`
}

export function searchKey({ field, query }) {
  return `${field}:${query.trim().toLowerCase()}`
}

export function readUrlState(search = window.location.search) {
  const p = new URLSearchParams(search)
  const num = k => { const v = p.get(k); return v !== null && /^\d{4}$/.test(v) ? Number(v) : null }
  const searches = p.getAll('q').map(parseSearchToken).filter(s => s.query && SEARCH_FIELDS[s.field]).slice(0, 10)
  return {
    searches,
    tab: p.get('t'),
    filters: {
      status: p.getAll('status'), phase: p.getAll('phase'), cls: p.getAll('cls'),
      country: p.getAll('country'), sponsor: p.getAll('sponsor'), enr: p.getAll('enr'),
      yearFrom: num('from'), yearTo: num('to'), text: p.get('tq') ?? '',
    },
    sort: p.get('sort'),
    dir: p.get('dir') === 'asc' ? 'asc' : 'desc',
  }
}

export function buildUrlSearch({ searches, tab, filters, sort, dir }) {
  const p = new URLSearchParams()
  searches.forEach(s => p.append('q', searchToken(s)))
  if (searches.length && tab !== null && tab !== undefined) p.set('t', String(tab))
  if (searches.length && tab !== 'compare') {
    filters.status.forEach(v => p.append('status', v))
    filters.phase.forEach(v => p.append('phase', v))
    filters.cls.forEach(v => p.append('cls', v))
    filters.country.forEach(v => p.append('country', v))
    filters.sponsor.forEach(v => p.append('sponsor', v))
    filters.enr.forEach(v => p.append('enr', v))
    if (filters.yearFrom !== null) p.set('from', String(filters.yearFrom))
    if (filters.yearTo !== null) p.set('to', String(filters.yearTo))
    if (filters.text.trim()) p.set('tq', filters.text.trim())
    if (sort) { p.set('sort', sort); p.set('dir', dir) }
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}
