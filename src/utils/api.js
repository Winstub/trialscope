const BASE_URL = 'https://clinicaltrials.gov/api/v2/studies'
const PAGE_SIZE = 1000
const MAX_PAGES = 20 // 20k studies max per search

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
  constructor() { super('Fetch aborted') }
}

export async function fetchAllStudies(query, { onProgress, signal } = {}) {
  let allStudies = []
  let pageToken = null
  let totalCount = 0
  let pageNum = 0
  let truncated = false

  do {
    if (signal?.aborted) throw new FetchAbortedError()

    const params = new URLSearchParams({
      'query.intr': query,
      'pageSize': String(PAGE_SIZE),
      'fields': 'NCTId,BriefTitle,OverallStatus,Phase,StartDate,StudyFirstPostDate,InterventionName,InterventionDescription,InterventionType,StudyType,LeadSponsorClass,StdAge,Sex,DesignPrimaryPurpose,DesignAllocation,DesignMasking',
      'countTotal': 'true',
    })
    if (pageToken) params.set('pageToken', pageToken)

    const res = await fetch(`${BASE_URL}?${params}`, { signal })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`ClinicalTrials.gov API error ${res.status}: ${text.slice(0, 200)}`)
    }

    const data = await res.json()

    if (pageNum === 0) totalCount = data.totalCount ?? 0

    allStudies = allStudies.concat(data.studies ?? [])
    pageToken = data.nextPageToken ?? null
    pageNum++

    onProgress?.({ loaded: allStudies.length, total: totalCount, page: pageNum })
  } while (pageToken && pageNum < MAX_PAGES)

  if (pageToken && pageNum >= MAX_PAGES) truncated = true

  return { studies: allStudies, totalCount, truncated }
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

export function aggregateStudies(studies) {
  const statusCounts   = {}
  const phaseStatusMatrix = {}
  const timelineByYear = {}

  // dimByGroup accumulates every dimension keyed by { value → { recruiting, active, no_longer } }
  const dimByGroup = {
    phase: {}, route: {}, interventionType: {}, studyType: {},
    sponsorClass: {}, primaryPurpose: {}, ageGroup: {}, sex: {},
    masking: {}, allocation: {},
  }

  function acc(dim, key, group) {
    if (!key) return
    if (!dimByGroup[dim][key]) dimByGroup[dim][key] = { recruiting: 0, active: 0, no_longer: 0 }
    dimByGroup[dim][key][group]++
  }

  for (const study of studies) {
    const proto      = study.protocolSection ?? {}
    const statusMod  = proto.statusModule ?? {}
    const designMod  = proto.designModule ?? {}
    const armsMod    = proto.armsInterventionsModule ?? {}
    const eligMod    = proto.eligibilityModule ?? {}
    const sponsorMod = proto.sponsorCollaboratorsModule ?? {}
    const designInfo = designMod.designInfo ?? {}

    const status = statusMod.overallStatus ?? 'UNKNOWN'
    const group  =
      ['NOT_YET_RECRUITING','RECRUITING','ENROLLING_BY_INVITATION'].includes(status) ? 'recruiting' :
      status === 'ACTIVE_NOT_RECRUITING' ? 'active' : 'no_longer'

    statusCounts[status] = (statusCounts[status] ?? 0) + 1

    // ── Phase ──────────────────────────────────────────────────────────────
    const phases = designMod.phases?.length ? designMod.phases : ['NA']
    for (const p of phases) {
      acc('phase', p, group)
      if (!phaseStatusMatrix[p]) phaseStatusMatrix[p] = {}
      phaseStatusMatrix[p][status] = (phaseStatusMatrix[p][status] ?? 0) + 1
    }

    // ── Route of administration ────────────────────────────────────────────
    for (const r of extractROAs(armsMod.interventions ?? [])) acc('route', r, group)

    // ── Intervention types (unique per study) ─────────────────────────────
    const ivTypes = [...new Set((armsMod.interventions ?? []).map(i => i.type).filter(Boolean))]
    if (ivTypes.length) { for (const t of ivTypes) acc('interventionType', t, group) }
    else acc('interventionType', 'OTHER', group)

    // ── Single-value dimensions ────────────────────────────────────────────
    acc('studyType',      designMod.studyType                         ?? 'UNKNOWN', group)
    acc('sponsorClass',   sponsorMod.leadSponsor?.class               ?? 'UNKNOWN', group)
    acc('primaryPurpose', designInfo.primaryPurpose                   ?? 'UNKNOWN', group)
    acc('sex',            eligMod.sex                                  ?? 'ALL',    group)
    acc('masking',        designInfo.maskingInfo?.masking              ?? 'UNKNOWN', group)
    acc('allocation',     designInfo.allocation                        ?? 'UNKNOWN', group)

    // ── Age groups (array — count study in each) ───────────────────────────
    const ages = eligMod.stdAges ?? []
    if (ages.length) { for (const a of ages) acc('ageGroup', a, group) }
    else acc('ageGroup', 'UNKNOWN', group)

    // ── Timeline ──────────────────────────────────────────────────────────
    const year = (statusMod.startDateStruct?.date ?? '').slice(0, 4)
    if (year >= '1990' && year <= String(new Date().getFullYear())) {
      if (!timelineByYear[year]) timelineByYear[year] = { recruiting: 0, active: 0, no_longer: 0 }
      timelineByYear[year][group]++
    } else {
      // No valid start date — count by group for the disclosure note
      if (!timelineByYear['__no_date__']) timelineByYear['__no_date__'] = { recruiting: 0, active: 0, no_longer: 0 }
      timelineByYear['__no_date__'][group]++
    }
  }

  // Flat counts derived from dimByGroup (for backward-compat with older components)
  const flatCounts = dim =>
    Object.fromEntries(Object.entries(dimByGroup[dim]).map(([k,v]) => [k, v.recruiting+v.active+v.no_longer]))

  return {
    statusCounts,
    phaseCounts:      flatCounts('phase'),
    routeCounts:      flatCounts('route'),
    phaseStatusMatrix,
    timelineByYear,
    dimByGroup,
  }
}
