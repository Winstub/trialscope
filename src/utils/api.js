const BASE_URL = 'https://clinicaltrials.gov/api/v2/studies'
const PAGE_SIZE = 1000
const MAX_PAGES = 20 // 20k studies max per search
const MAX_RETRIES = 4

// ─── Route-of-administration extraction ──────────────────────────────────────
// Ordered most-specific → least-specific so the first match wins per intervention.

const ROA_PATTERNS = [
  ['Intratumoral',         /\bintratumor(?:al)?\b|\bintra-tumor|\bintralesion|\bintra-lesion|\bintraprostatic\b/i],
  ['Intrathecal',          /\bintrathecal\b/i],
  ['Intraperitoneal',      /\bintraperitoneal\b/i],
  ['Intravitreal',         /\bintravitreal\b/i],
  ['Intravesical',         /\bintravesical\b/i],
  ['Intramuscular',        /\bintramuscular(?:ly)?\b|\bIM injection\b|\bgiven IM\b/i],
  ['Intravenous',          /\bintravenous(?:ly)?\b|\bIV (?:infusion|administration|drip)\b|\bgiven IV\b|\binfusion\b|\binfused?\b|\btransfused?\b/i],
  ['Subcutaneous',         /\bsubcutaneous(?:ly)?\b|\bSC injection\b|\bs\.c\.\b|\bgiven SC\b|\bunder the skin\b/i],
  ['Oral',                 /\borally?\b|\bby mouth\b|\bswallowed?\b|\boral (?:tablet|capsule|dose|administration)\b|\btablets?\b|\bcapsules?\b/i],
  ['Inhalation',           /\binhalation\b|\binhaled?\b|\bnebulized?\b|\baerosolized?\b/i],
  ['Intranasal',           /\bintranasal(?:ly)?\b|\bnasal spray\b/i],
  ['Topical/Transdermal',  /\btopically?\b|\btransdermal(?:ly)?\b|\bapplied to (?:the )?skin\b/i],
  ['Sublingual',           /\bsublingual(?:ly)?\b/i],
  ['Ophthalmic',           /\bophthalmic\b|\beye drops?\b/i],
  ['Injection (unspec.)',  /\binjection\b|\binjected\b/i],
]

function extractROAs(interventions) {
  if (!interventions?.length) return ['Not Specified']
  const routes = new Set()
  for (const iv of interventions) {
    const text = `${iv.name ?? ''} ${iv.description ?? ''}`
    for (const [route, pattern] of ROA_PATTERNS) {
      if (pattern.test(text)) { routes.add(route); break }
    }
  }
  return routes.size > 0 ? [...routes] : ['Not Specified']
}

export class FetchAbortedError extends Error {
  constructor() { super('Fetch aborted'); this.name = 'FetchAbortedError' }
}

export class ApiError extends Error {
  constructor(message, { status, retryable = false } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryable = retryable
  }
}

// ─── Dates ───────────────────────────────────────────────────────────────────
// ClinicalTrials.gov returns "YYYY", "YYYY-MM" or "YYYY-MM-DD". Partial dates are
// common (especially for estimated completion), so parse each component explicitly.

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function parseDate(s) {
  if (typeof s !== 'string') return null
  const m = /^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.exec(s.trim())
  if (!m) return null
  const year = Number(m[1])
  const month = m[2] ? Number(m[2]) : null
  const day = m[3] ? Number(m[3]) : null
  if (year < 1900 || year > 2200) return null
  if (month !== null && (month < 1 || month > 12)) return null
  if (day !== null && (day < 1 || day > 31)) return null
  return { year, month, day, ts: Date.UTC(year, (month ?? 1) - 1, day ?? 1), raw: s.trim() }
}

export function formatDate(s) {
  const d = parseDate(s)
  if (!d) return '—'
  if (d.month === null) return String(d.year)
  if (d.day === null) return `${MONTHS[d.month - 1]} ${d.year}`
  return `${MONTHS[d.month - 1]} ${d.day}, ${d.year}`
}

// ─── Fetching ────────────────────────────────────────────────────────────────

export const SEARCH_FIELDS = {
  intr: { label: 'Intervention', param: 'query.intr', placeholder: 'Search an intervention or treatment…' },
  cond: { label: 'Condition',    param: 'query.cond', placeholder: 'Search a disease or condition…' },
  term: { label: 'Any term',     param: 'query.term', placeholder: 'Search any term…' },
}

const FIELDS = [
  'NCTId', 'BriefTitle', 'OverallStatus', 'Phase', 'StartDate', 'CompletionDate',
  'InterventionName', 'InterventionDescription', 'InterventionType',
  'StudyType', 'LeadSponsorName', 'LeadSponsorClass', 'StdAge', 'Sex',
  'DesignPrimaryPurpose', 'DesignAllocation', 'DesignMasking',
  'Condition', 'EnrollmentCount', 'EnrollmentType', 'LocationCountry',
].join(',')

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new FetchAbortedError())
    const t = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve() }, ms)
    function onAbort() { clearTimeout(t); reject(new FetchAbortedError()) }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function friendlyStatus(status, body) {
  if (status === 429) return 'ClinicalTrials.gov is rate-limiting requests. Please wait a few seconds and retry.'
  if (status === 400) return `ClinicalTrials.gov rejected this query${body ? ` (${body.slice(0, 120)})` : ''}. Try simplifying the search terms.`
  if (status >= 500) return `ClinicalTrials.gov is temporarily unavailable (HTTP ${status}). Please retry shortly.`
  return `ClinicalTrials.gov API error ${status}${body ? `: ${body.slice(0, 120)}` : ''}`
}

/** Fetch one page with retry + exponential backoff on 429 / 5xx / network errors. */
async function fetchPage(url, { signal, onRetry }) {
  let attempt = 0
  for (;;) {
    if (signal?.aborted) throw new FetchAbortedError()
    let err
    try {
      const res = await fetch(url, { signal })
      if (res.ok) return await res.json()
      const body = await res.text().catch(() => '')
      const retryable = res.status === 429 || res.status >= 500
      err = new ApiError(friendlyStatus(res.status, body), { status: res.status, retryable })
      if (retryable) {
        const ra = Number(res.headers.get('Retry-After'))
        err.retryAfterMs = Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 15000) : null
      }
    } catch (e) {
      if (e?.name === 'AbortError' || signal?.aborted) throw new FetchAbortedError()
      if (e instanceof ApiError) throw e
      err = new ApiError('Could not reach ClinicalTrials.gov. Check your connection and retry.', { retryable: true })
    }
    if (!err.retryable || attempt >= MAX_RETRIES) throw err
    attempt++
    const wait = err.retryAfterMs ?? Math.min(1000 * 2 ** (attempt - 1), 8000)
    onRetry?.({ attempt, waitMs: wait })
    await sleep(wait, signal)
  }
}

/** Reduce a raw v2 study to the lean record the UI works with. */
export function normalizeStudy(study) {
  const proto      = study?.protocolSection ?? {}
  const idMod      = proto.identificationModule ?? {}
  const statusMod  = proto.statusModule ?? {}
  const designMod  = proto.designModule ?? {}
  const armsMod    = proto.armsInterventionsModule ?? {}
  const eligMod    = proto.eligibilityModule ?? {}
  const sponsorMod = proto.sponsorCollaboratorsModule ?? {}
  const designInfo = designMod.designInfo ?? {}
  const interventions = armsMod.interventions ?? []

  const start = parseDate(statusMod.startDateStruct?.date)
  const end   = parseDate(statusMod.completionDateStruct?.date)
  const enrollment = Number.isFinite(designMod.enrollmentInfo?.count) ? designMod.enrollmentInfo.count : null
  const countries = [...new Set((proto.contactsLocationsModule?.locations ?? []).map(l => l?.country).filter(Boolean))]

  return {
    id: idMod.nctId ?? '',
    title: idMod.briefTitle ?? '(untitled)',
    status: statusMod.overallStatus ?? 'UNKNOWN',
    phases: designMod.phases?.length ? designMod.phases : ['NA'],
    sponsor: sponsorMod.leadSponsor?.name?.trim() || 'Unknown sponsor',
    sponsorClass: sponsorMod.leadSponsor?.class ?? 'UNKNOWN',
    conditions: proto.conditionsModule?.conditions ?? [],
    enrollment,
    enrollmentType: designMod.enrollmentInfo?.type ?? null,
    startDate: statusMod.startDateStruct?.date ?? null,
    startTs: start?.ts ?? null,
    startYear: start?.year ?? null,
    endDate: statusMod.completionDateStruct?.date ?? null,
    endTs: end?.ts ?? null,
    countries,
    routes: extractROAs(interventions),
    interventionTypes: [...new Set(interventions.map(i => i?.type).filter(Boolean))],
    studyType: designMod.studyType ?? 'UNKNOWN',
    purpose: designInfo.primaryPurpose ?? 'UNKNOWN',
    ages: eligMod.stdAges ?? [],
    sex: eligMod.sex ?? 'ALL',
    masking: designInfo.maskingInfo?.masking ?? 'UNKNOWN',
    allocation: designInfo.allocation ?? 'UNKNOWN',
  }
}

export async function fetchAllStudies(query, { field = 'intr', onProgress, signal } = {}) {
  const fieldCfg = SEARCH_FIELDS[field] ?? SEARCH_FIELDS.intr
  const byId = new Map()
  let pageToken = null
  let totalCount = 0
  let pageNum = 0
  let truncated = false
  let incomplete = null

  do {
    const params = new URLSearchParams({
      [fieldCfg.param]: query,
      pageSize: String(PAGE_SIZE),
      fields: FIELDS,
      countTotal: 'true',
    })
    if (pageToken) params.set('pageToken', pageToken)

    let data
    try {
      data = await fetchPage(`${BASE_URL}?${params}`, {
        signal,
        onRetry: r => onProgress?.({ loaded: byId.size, total: totalCount, page: pageNum, retry: r }),
      })
    } catch (e) {
      // Keep what we already have if a later page fails; fail hard on page one.
      if (pageNum > 0 && !(e instanceof FetchAbortedError)) { incomplete = e.message; break }
      throw e
    }

    if (pageNum === 0) totalCount = data.totalCount ?? 0
    for (const s of data.studies ?? []) {
      const rec = normalizeStudy(s)
      if (rec.id) byId.set(rec.id, rec)   // de-dupe across pages
    }
    pageToken = data.nextPageToken ?? null
    pageNum++
    onProgress?.({ loaded: byId.size, total: totalCount, page: pageNum })
  } while (pageToken && pageNum < MAX_PAGES)

  if (pageToken && pageNum >= MAX_PAGES) truncated = true

  return { records: [...byId.values()], totalCount, truncated, incomplete }
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

const RECRUITING = ['NOT_YET_RECRUITING', 'RECRUITING', 'ENROLLING_BY_INVITATION', 'AVAILABLE']

export function statusGroup(status) {
  return RECRUITING.includes(status) ? 'recruiting' : status === 'ACTIVE_NOT_RECRUITING' ? 'active' : 'no_longer'
}

const MAX_START_YEAR = new Date().getFullYear() + 15

/** Aggregate lean records (from normalizeStudy) into chart-ready statistics. */
export function aggregateStudies(records) {
  const statusCounts   = {}
  const phaseStatusMatrix = {}
  const timelineByYear = {}

  const dimByGroup = {
    phase: {}, route: {}, interventionType: {}, studyType: {},
    sponsorClass: {}, primaryPurpose: {}, ageGroup: {}, sex: {},
    masking: {}, allocation: {},
  }

  function acc(dim, key, group) {
    if (!key) return
    const bucket = dimByGroup[dim]
    if (!bucket[key]) bucket[key] = { recruiting: 0, active: 0, no_longer: 0 }
    bucket[key][group]++
  }

  for (const r of records) {
    const group = statusGroup(r.status)
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1

    for (const p of r.phases) {
      acc('phase', p, group)
      if (!phaseStatusMatrix[p]) phaseStatusMatrix[p] = {}
      phaseStatusMatrix[p][r.status] = (phaseStatusMatrix[p][r.status] ?? 0) + 1
    }
    for (const x of r.routes) acc('route', x, group)
    if (r.interventionTypes.length) { for (const t of r.interventionTypes) acc('interventionType', t, group) }
    else acc('interventionType', 'OTHER', group)

    acc('studyType', r.studyType, group)
    acc('sponsorClass', r.sponsorClass, group)
    acc('primaryPurpose', r.purpose, group)
    acc('sex', r.sex, group)
    acc('masking', r.masking, group)
    acc('allocation', r.allocation, group)
    if (r.ages.length) { for (const a of r.ages) acc('ageGroup', a, group) }
    else acc('ageGroup', 'UNKNOWN', group)

    // Timeline — future start dates (not-yet-recruiting trials) are valid and kept.
    const y = r.startYear
    const key = y !== null && y >= 1990 && y <= MAX_START_YEAR ? String(y) : '__no_date__'
    if (!timelineByYear[key]) timelineByYear[key] = { recruiting: 0, active: 0, no_longer: 0 }
    timelineByYear[key][group]++
  }

  const flatCounts = dim =>
    Object.fromEntries(Object.entries(dimByGroup[dim]).map(([k, v]) => [k, v.recruiting + v.active + v.no_longer]))

  return {
    total: records.length,
    statusCounts,
    phaseCounts: flatCounts('phase'),
    routeCounts: flatCounts('route'),
    phaseStatusMatrix,
    timelineByYear,
    dimByGroup,
  }
}
