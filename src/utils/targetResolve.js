// Target resolution: free-text target name → { aliases, drugs, neighbors } profile.
//   1. bundled seed (targetSeed.js) — always available, works offline
//   2. Open Targets Platform GraphQL (CORS-enabled)  → gene synonyms + clinical drugs whose mechanism acts on the target
//   3. ChEMBL REST (CORS-enabled)                     → same, used only if Open Targets fails
// Everything from the network is merged on top of the seed; any failure degrades silently to what we have (see profile.sources).
import { SEED_INDEX, normKey } from './targetSeed.js'
import { compileProfile } from './target.js'

const OT_URL = 'https://api.platform.opentargets.org/api/v4/graphql'
const CHEMBL = 'https://www.ebi.ac.uk/chembl/api/data'
const TIMEOUT_MS = 6000
const MAX_NET_DRUGS = 150

const cache = new Map()

async function timedFetch(url, init, signal, ms = TIMEOUT_MS) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  const onAbort = () => ctl.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  try {
    const res = await fetch(url, { ...init, signal: ctl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally { clearTimeout(t); signal?.removeEventListener('abort', onAbort) }
}

/** "anti-PD-1 antibody" → "PD-1"; "HER2 inhibitors" → "HER2". */
export function cleanTargetQuery(q) {
  return String(q ?? '').trim()
    .replace(/^anti[-\s]?/i, '')
    .replace(/\s+(?:inhibitors?|antibod(?:y|ies)|blockers?|antagonists?|agonists?|targeted|targeting|therapy|therapies|CAR[-\s]?T)$/i, '')
    .trim()
}

const STOP_DRUG = new Set(['placebo', 'antibody', 'vaccine', 'chemotherapy', 'inhibitor', 'standard', 'control', 'drug', 'unknown', 'saline'])
const JUNK_DRUG = /component of|biosimilar|[()]|monoclonal|\banti[-\s]|antibody|recombinant|hydrochloride|dihydrochloride|maleate|dimaleate|sodium|tosylate|tosilate|ditosylate|hydrate|anhydrous|free base|variant|^rhumab|\bacid\b|genetical/i
const goodDrugName = (n, aliasKeys) => {
  if (!n || n.length < 4 || n.length > 48 || JUNK_DRUG.test(n)) return false
  const k = normKey(n)
  return k.length >= 4 && !STOP_DRUG.has(n.toLowerCase()) && !aliasKeys.has(k)
}
const goodAlias = a => a && !/^[\d.\-]+$/.test(a) && a.length <= 40 && (a.length >= 4 || /\d/.test(a)) && !/^[a-z]+$/.test(a)   // drop 3-letter gene aliases like NEU/NGL and plain lowercase words

// ── Open Targets ─────────────────────────────────────────────────────────────

const OT_DETAIL = `id approvedSymbol approvedName
  synonyms { label source }
  drugAndClinicalCandidates { rows { maxClinicalStage drug { name drugType synonyms { label source } tradeNames { label source } } } }`

async function otQuery(query, variables, signal) {
  const j = await timedFetch(OT_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, variables }) }, signal)
  if (j.errors?.length) throw new Error(j.errors[0].message)
  return j.data
}

const STAGE = { APPROVAL: 0, PHASE_4: 0, PHASE_3: 1, PHASE_2_3: 2, PHASE_2: 3, PHASE_1_2: 4, PHASE_1: 5, EARLY_PHASE_1: 6 }

function otToPartial(t) {
  const aliases = [t.approvedSymbol, t.approvedName,
    ...t.synonyms.filter(s => /^(HGNC|uniprot)$/i.test(s.source)).map(s => s.label)].filter(goodAlias)
  const rows = [...(t.drugAndClinicalCandidates?.rows ?? [])].sort((a, b) => (STAGE[a.maxClinicalStage] ?? 9) - (STAGE[b.maxClinicalStage] ?? 9))
  const drugs = []
  for (const r of rows) {
    const d = r.drug
    drugs.push(d.name, ...d.synonyms.filter(s => /chembl/i.test(s.source)).map(s => s.label), ...d.tradeNames.map(s => s.label))
  }
  return { symbol: t.approvedSymbol, name: t.approvedName, ensemblId: t.id, aliases, drugs, drugRows: rows.length }
}

async function resolveOpenTargets(term, symbolHint, signal) {
  const qs = [...new Set([symbolHint, term].filter(Boolean))]
  const want = new Set([term, symbolHint].filter(Boolean).map(normKey))
  for (const q of qs) {
    const s = await otQuery(`query($q:String!){ search(queryString:$q, entityNames:["target"], page:{index:0,size:5}){ hits{ id } } }`, { q }, signal)
    const ids = s.search.hits.map(h => h.id)
    if (!ids.length) continue
    const d = await otQuery(`query($ids:[String!]!){ targets(ensemblIds:$ids){ ${OT_DETAIL} } }`, { ids }, signal)
    // Accept only a hit that really *is* this target (symbol, name or HGNC/UniProt synonym equals the query) — search is fuzzy.
    const byId = new Map(d.targets.map(t => [t.id, t]))
    for (const id of ids) {
      const t = byId.get(id)
      if (!t) continue
      const names = [t.approvedSymbol, t.approvedName, ...t.synonyms.filter(s => /^(HGNC|uniprot)$/i.test(s.source)).map(s => s.label)].map(normKey)
      if (names.some(n => want.has(n))) return otToPartial(t)
    }
  }
  return null
}

// ── ChEMBL (fallback) ────────────────────────────────────────────────────────

async function resolveChembl(term, symbolHint, signal) {
  const q = symbolHint || term
  const s = await timedFetch(`${CHEMBL}/target/search.json?q=${encodeURIComponent(q)}&limit=10`, {}, signal)
  const want = new Set([term, symbolHint].filter(Boolean).map(normKey))
  const tgt = (s.targets ?? []).find(t => t.organism === 'Homo sapiens' && t.target_type === 'SINGLE PROTEIN' &&
    t.target_components.some(c => c.target_component_synonyms.some(x => want.has(normKey(x.component_synonym.replace(/^(Synonyms|CD_antigen)=/, ''))))))
  if (!tgt) return null
  const syns = tgt.target_components.flatMap(c => c.target_component_synonyms.map(x => x.component_synonym.replace(/^(Synonyms|CD_antigen)=/, '')))
  const mech = await timedFetch(`${CHEMBL}/mechanism.json?target_chembl_id=${tgt.target_chembl_id}&limit=100`, {}, signal)
  const ids = [...new Set((mech.mechanisms ?? []).map(m => m.molecule_chembl_id).filter(Boolean))].slice(0, 100)
  const drugs = []
  if (ids.length) {
    const mol = await timedFetch(`${CHEMBL}/molecule.json?molecule_chembl_id__in=${ids.join(',')}&limit=100`, {}, signal)
    for (const m of mol.molecules ?? []) drugs.push(m.pref_name, ...(m.molecule_synonyms ?? []).map(x => x.molecule_synonym))
  }
  return { symbol: syns.find(x => /^[A-Z0-9]+$/.test(x)) ?? q, name: tgt.pref_name, aliases: [tgt.pref_name, ...syns].filter(goodAlias), drugs, drugRows: ids.length }
}

// ── merge ────────────────────────────────────────────────────────────────────

function mergeUnique(...lists) {
  const m = new Map()
  for (const l of lists) for (const x of l ?? []) { const k = normKey(x); if (k && !m.has(k)) m.set(k, x) }
  return [...m.values()]
}

/**
 * Resolve a target name to a compiled profile. Never throws for network problems.
 * @returns profile { query, id, symbol, name, aliases, drugs, neighbors, sources, warnings, ... , _c }
 */
export async function resolveTarget(query, { signal, offline = false } = {}) {
  const term = cleanTargetQuery(query)
  const key = normKey(term)
  const cached = cache.get(key)
  if (cached) return { ...cached, query }

  const seed = SEED_INDEX.get(key) ?? null
  const warnings = []
  const sources = { seed: !!seed, openTargets: 'skipped', chembl: 'skipped' }
  let net = null

  if (!offline) {
    try {
      net = await resolveOpenTargets(term, seed?.symbol, signal)
      sources.openTargets = net ? 'ok' : 'no-match'
    } catch (e) {
      if (signal?.aborted) throw e
      sources.openTargets = 'failed'
    }
    if (!net) {
      try {
        net = await resolveChembl(term, seed?.symbol, signal)
        sources.chembl = net ? 'ok' : 'no-match'
      } catch (e) {
        if (signal?.aborted) throw e
        sources.chembl = 'failed'
      }
    }
  }

  if (!seed && !net) warnings.push(
    offline || (sources.openTargets === 'failed' && sources.chembl === 'failed')
      ? `Couldn’t reach Open Targets / ChEMBL and “${term}” isn’t in the bundled target list — searching only for the name itself, with no drug names. Expect many “Unclear” labels.`
      : `“${term}” wasn’t recognised as a gene/protein target by Open Targets or ChEMBL, and isn’t in the bundled list — searching only for the name itself, with no drug names. Try the HGNC symbol (e.g. PDCD1).`)
  else if (seed && !net && !offline) warnings.push('Open Targets / ChEMBL unavailable — using the bundled drug list only (may miss newer agents).')

  const aliases = mergeUnique([term], seed?.aliases, net?.aliases)
  const aliasKeys = new Set(aliases.map(normKey))
  const netDrugs = (net?.drugs ?? []).filter(n => goodDrugName(n, aliasKeys)).slice(0, MAX_NET_DRUGS * 3)
  const drugs = mergeUnique(seed?.drugs, netDrugs).filter(n => goodDrugName(n, aliasKeys) || (seed?.drugs ?? []).includes(n)).slice(0, MAX_NET_DRUGS + (seed?.drugs?.length ?? 0))
  const profile = compileProfile({
    query: term, id: seed?.id ?? net?.symbol ?? term, symbol: seed?.symbol ?? net?.symbol ?? null, name: seed?.name ?? net?.name ?? null,
    ensemblId: net?.ensemblId ?? null, aliases, drugs, aliasExclude: seed?.aliasExclude ?? '',
    neighbors: seed?.neighbors ?? [], sources, warnings,
    counts: { seedDrugs: seed?.drugs?.length ?? 0, networkDrugs: Math.max(0, drugs.length - (seed?.drugs?.length ?? 0)) },
  })
  cache.set(key, profile)
  return { ...profile, query }
}

// ── ClinicalTrials.gov query construction ────────────────────────────────────

const quote = s => (/[\s\-\/.]/.test(s) ? `"${s}"` : s)
const queryable = s => s && !/[()]/.test(s) && s.length >= 3

/** Strings for query.term (aliases) and chunks for query.intr (drug names). */
export function candidateQueries(profile, { chunkSize = 20, maxChunks = 8 } = {}) {
  const aliases = profile.aliases.filter(queryable).slice(0, 14)
  const drugs = profile.drugs.filter(queryable)
  const chunks = []
  for (let i = 0; i < drugs.length && chunks.length < maxChunks; i += chunkSize) chunks.push(drugs.slice(i, i + chunkSize))
  return {
    term: aliases.map(quote).join(' OR '),
    intr: chunks.map(ch => ch.map(quote).join(' OR ')),
    droppedDrugs: Math.max(0, drugs.length - chunkSize * maxChunks),
  }
}

/** One compact expression for the ClinicalTrials.gov website link (any field): aliases + the most prominent drug names. */
export function siteTerm(profile) {
  const parts = [...profile.aliases.filter(queryable).slice(0, 6), ...profile.drugs.filter(queryable).slice(0, 25)]
  return `(${[...new Set(parts)].map(quote).join(' OR ')})`
}
