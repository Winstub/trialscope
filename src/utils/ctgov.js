// Build equivalent ClinicalTrials.gov website search URLs (https://clinicaltrials.gov/search?...)
// for the dashboard's current search + filters. URL formats verified against the live site.

const SITE = 'https://clinicaltrials.gov/search'

// API enum -> website aggFilters status code
export const STATUS_CODES = {
  NOT_YET_RECRUITING: 'not', RECRUITING: 'rec', ENROLLING_BY_INVITATION: 'enr',
  ACTIVE_NOT_RECRUITING: 'act', COMPLETED: 'com', SUSPENDED: 'sus', TERMINATED: 'ter',
  WITHDRAWN: 'wit', UNKNOWN: 'unk',
  AVAILABLE: 'ava', NO_LONGER_AVAILABLE: 'nla', TEMPORARILY_NOT_AVAILABLE: 'tna',
  APPROVED_FOR_MARKETING: 'afm', // WITHHELD has no website status code (status:wnh returns nothing) so it is omitted
}

// API enum -> website phase code (the site has no "Not Applicable" phase facet)
const PHASE_CODES = { EARLY_PHASE1: '0', PHASE1: '1', PHASE2: '2', PHASE3: '3', PHASE4: '4' }

// App search field -> website query parameter
const FIELD_PARAM = { intr: 'intr', cond: 'cond', term: 'term' }

/**
 * @param {object} o
 * @param {string} o.query   the user's search text
 * @param {string} o.field   'intr' | 'cond' | 'term'
 * @param {string[]} [o.statuses]  API status enums to restrict to (omit/empty = any status)
 * @param {object} [o.filters]  dashboard filters (phase, country, sponsor, yearFrom/yearTo are mapped)
 * @returns {{ url: string, exact: boolean, unmapped: string[] }}
 *   exact=false when an active dashboard filter has no equivalent on the website.
 */
export function ctgovUrl({ query, field = 'intr', statuses = [], filters = null }) {
  const p = []
  const add = (k, v) => p.push(`${k}=${encodeURIComponent(v)}`)
  if (query?.trim()) add(FIELD_PARAM[field] ?? 'term', query.trim())

  const unmapped = []
  const agg = []
  const effective = statuses.length ? statuses : (filters?.status ?? [])
  const codes = effective.map(s => STATUS_CODES[s]).filter(Boolean)
  if (codes.length) agg.push(`status:${codes.join(' ')}`)

  if (filters) {
    const phases = filters.phase.map(x => PHASE_CODES[x]).filter(Boolean)
    if (phases.length) agg.push(`phase:${phases.join(' ')}`)
    if (filters.phase.includes('NA')) unmapped.push('Phase: Not Applicable')
    if (filters.country.length === 1) add('country', filters.country[0])
    else if (filters.country.length > 1) unmapped.push('multiple countries')
    if (filters.sponsor.length === 1) add('spons', filters.sponsor[0])
    else if (filters.sponsor.length > 1) unmapped.push('multiple sponsors')
    if (filters.yearFrom !== null || filters.yearTo !== null) {
      const a = filters.yearFrom !== null ? `${filters.yearFrom}-01-01` : ''
      const b = filters.yearTo !== null ? `${filters.yearTo}-12-31` : ''
      add('start', `${a}_${b}`)
    }
    if (filters.cls.length) unmapped.push('sponsor type')
    if (filters.enr.length) unmapped.push('enrollment size')
    if (filters.text?.trim()) unmapped.push('table text filter')
  }
  if (agg.length) p.push(`aggFilters=${agg.map(a => a.replace(/ /g, '%20')).join(',')}`)
  return { url: p.length ? `${SITE}?${p.join('&')}` : SITE, exact: unmapped.length === 0, unmapped }
}

/** Tooltip text, e.g. "View 16 studies on ClinicalTrials.gov". */
export function ctgovTitle(count, link) {
  const base = `View ${count.toLocaleString()} ${count === 1 ? 'study' : 'studies'} on ClinicalTrials.gov`
  return link.exact ? base : `${base} (opens in a new tab; ${link.unmapped.join(', ')} can’t be applied there, so the site may show more)`
}
