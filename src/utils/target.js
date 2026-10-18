// Target classifier: does a trial TARGET a molecular target, only MEASURE it, or is it UNCLEAR?
// Pure functions, no I/O, no LLM — rule-based text matching over the CT.gov record. See docs/TARGET_SEARCH.md.
//
//   Targets       an intervention/regimen acts ON the target (drug name from the resolved list, "anti-X", "X inhibitor",
//                 "X/Y bispecific", "CAR-T against X", X knockout …).
//   Measures only X appears only as eligibility / prior therapy / biomarker / outcome / condition text, or the only
//                 interventions are diagnostics.
//   Unclear       no usable signal (the trial was retrieved by synonym search but X is not in the text we classify),
//                 only a bare/background mention, or the trial acts on a ligand/receptor NEIGHBOUR rather than X.
import { normKey } from './targetSeed.js'

export const LABELS = ['Targets', 'Measures only', 'Unclear']
export const LABEL_KEYS = { Targets: 'targets', 'Measures only': 'measures', Unclear: 'unclear' }

// Imaging / assay interventions that *use* the target agent as a probe (89Zr-trastuzumab PET) measure the target rather than treat it.
const DIAGNOSTIC_NAME_RE = /\b(?:PET|SPECT|imaging|tracer|radiotracer|scintigraphy|89Zr|64Cu|68Ga|18F|99mTc|111In|IHC|immunohistochemistry|FISH|assay|biopsy|diagnostic|companion diagnostic)\b/i
// Supportive-care / toxicity titles ("nausea caused by T-DXd") only mention the drug as background.
const SUPPORTIVE_TITLE_RE = /\b(?:induced|associated with|caused by|toxicity|toxicities|cardiotoxicity|prevention of|prophyla\w*|nausea|vomiting|thrombocytopenia|neutropenia|neuropathy|mucositis|rash|diarrh\w+|fatigue|side effects?|adverse (?:events?|effects?))\b/i
const GENERIC_IV = new Set(['placebo', 'injection', 'tablet', 'tablets', 'capsule', 'therapy', 'treatment', 'chemotherapy', 'radiation', 'radiotherapy', 'standard', 'care', 'control', 'drug', 'cells', 'infusion', 'vaccine', 'surgery', 'observation', 'combination', 'with', 'plus', 'versus', 'dose', 'group'])
const THERAPEUTIC = new Set(['DRUG', 'BIOLOGICAL', 'GENETIC', 'COMBINATION_PRODUCT', 'RADIATION', 'DIETARY_SUPPLEMENT', 'PROCEDURE'])

// ─── regex builders ──────────────────────────────────────────────────────────

const esc = s => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&')

/** "PD-1" → PD[-\s]{0,2}1 so PD-1 / PD 1 / PD1 / PD‑1 all match; boundaries stop PD-L1, CD190, VEGFR, HER2neu… */
export function termSource(term) {
  const toks = String(term).trim().split(/[-\s‐‑–_]+|(?<=[A-Za-z])(?=\d)|(?<=\d)(?=[A-Za-z])/).filter(Boolean)
  return toks.map(esc).join('[-\\s‐‑–_]{0,2}')
}
const B = '(?<![A-Za-z0-9])'
const E0 = '(?![A-Za-z0-9])'
const E = E0

function alternation(terms) {
  const seenKeys = new Set()
  const uniq = terms.filter(Boolean).filter(t => { const k = normKey(t) || t; if (seenKeys.has(k)) return false; seenKeys.add(k); return true })
  uniq.sort((a, b) => b.length - a.length)
  return uniq.map(termSource).join('|')
}
function bounded(terms, flags = 'gi', exclude = '') {
  const alt = alternation(terms)
  return alt ? new RegExp(`${B}(?:${alt})${E}${exclude ? `(?!${exclude})` : ''}`, flags) : null
}

const SUFFIX = 'targeted|targeting|directed|specific|blocking|blockade|blocker|blockers|inhibit(?:or|ors|ion|ing|ory)|antagonist|antagonists|agonist|agonists|antibod(?:y|ies)|mab|mabs|neutrali[sz]\\w*|knock[- ]?(?:out|down|in)|KO|edited|disrupted|silenc\\w*|silent|ablated|ablation|deleted|deletion|shRNA|siRNA|CRISPR|CAR|CAR-T|bispecific|bi-specific|bsab|ADC|TKI|degrader|vaccine|vaccines|vaccination|fusion|monoclonal|immunotherap\\w*|therap(?:y|ies)'
const BISPEC = 'bispecific|bi-specific|bsab|bifunctional|dual|fusion|antibod\\w*|inhibitor|blockade|antagonist|CAR|ADC|trispecific|tri-specific|multispecific'

/** Phrase rules that say "an agent acts on <alias>". Each: [rule label, regex]. */
function phraseRules(aliasTerms, exclude = '') {
  const A = `(?:${alternation(aliasTerms)})`
  if (!alternation(aliasTerms)) return []
  const E = E0 + (exclude ? `(?!${exclude})` : '')
  const mk = src => new RegExp(src, 'gi')
  const w = '[\\w()\\-.]{1,16}'
  return [
    ['anti-X', mk(`${B}(?:anti|α|alpha)[-\\s]?${A}${E}`)],
    ['X inhibitor / antibody / blocker', mk(`${B}${A}${E}[-\\s]{0,2}(?:${SUFFIX})(?![A-Za-z0-9])`)],
    ['X/Y inhibitor', mk(`${B}${A}${E}\\s*[/,]\\s*${w}\\s+(?:inhibit\\w*|blockade|antibod\\w*|antagonist\\w*|axis blockade)`)],
    ['X-axis / pathway inhibitor', mk(`${B}${A}${E}(?:\\s+(?:axis|pathway|signaling|signalling))\\s+(?:inhibit|block|antagon|targeting)\\w*`)],
    ['agent targeting / against X', mk(`(?:targeting|targeted at|against|directed (?:to|at|against)|binds? (?:to )?|binding (?:to )?|blocks?|blocking|inhibit(?:s|ing)?|antagoni[sz](?:es|ing)|neutrali[sz](?:es|ing)|depleting|recogni[sz](?:es|ing))\\s+(?:the\\s+|human\\s+|soluble\\s+|circulating\\s+)?${A}${E}`)],
    ['inhibitor/antibody of X', mk(`(?:inhibitors?|antagonists?|antibod(?:y|ies)|blockers?|agonists?)\\s+(?:of|to|against|for|directed against)\\s+(?:the\\s+)?${A}${E}`)],
    ['bispecific with X', mk(`${B}${A}${E}\\s*(?:/|x|×|\\+|and|&|plus)\\s*${w}\\s+(?:${BISPEC})`)],
    ['bispecific with X', mk(`${B}${w}\\s*(?:/|x|×)\\s*${A}${E}\\s+(?:${BISPEC})`)],
    ['bispecific with X', mk(`(?:bispecific|bi-specific|bifunctional|trispecific)[^.;\\n]{0,60}?${B}${A}${E}`)],
    ['CAR / cell therapy against X', mk(`(?:CAR[-\\s]?T|CAR[-\\s]?NK|CAR|chimeric antigen receptor|TCR[-\\s]?T|TCR)[^.;\\n]{0,70}?(?:targeting|against|directed|specific (?:for|to)|recogni[sz]ing|redirected)\\s+(?:to\\s+)?${A}${E}`)],
    ['X-specific CAR / cell therapy', mk(`${B}${A}${E}[-\\s]{0,2}(?:CAR|chimeric antigen receptor|TCR)`)],
  ]
}

// Context words (checked in a small window around a match).
const MEASURE_RE = /(?:\b(?:express(?:ion|ing|ed|es)?|overexpress\w*|positiv(?:e|ity)|negativ(?:e|ity)|high|low|elevated|amplif\w*|mutat\w*|mutant|altered|alterations?|variants?|biomarkers?|IHC|immunohistochem\w*|status|FISH|CPS|TPS|scores?|levels?|assays?|detect\w*|testing|tested|measured?|quantif\w*|biops\w*|pos|neg)\b|\+)/i
const PRIOR_RE = /\b(?:prior|previous(?:ly)?|pre-?treated|(?:refractory|resistant|resistance|intoleran(?:t|ce)|relapsed|relapse|failure|failed|progress(?:ed|ion)?|exposed|exposure|failing)\s+(?:to|on|after|following|with|of|from)|na[iï]ve|history of|washout|failed)\b/i

// "after EV + pembrolizumab", "following PD-1 therapy", "post-immunotherapy": the agent is previous treatment, not the study's.
const AFTER_BEFORE_RE = /\b(?:after|following|post-?|beyond|upon progression on)\b[^.;:,]{0,30}$/i
// Titles/summaries about predicting response to a drug are biomarker studies, not trials of the drug.
const PREDICT_RE = /\b(?:predict\w*|prognos\w*|biomarkers?|marker|monitoring|surveillance)\b/i

function windowAround(text, idx, len, before, after) {
  return text.slice(Math.max(0, idx - before), Math.min(text.length, idx + len + after))
}
function sentenceAround(text, idx, len) {
  const a = Math.max(text.lastIndexOf('. ', idx), text.lastIndexOf('\n', idx), -1) + 1
  const bs = [text.indexOf('. ', idx + len), text.indexOf('\n', idx + len)].filter(x => x >= 0)
  return text.slice(a, bs.length ? Math.min(...bs) + 1 : text.length)
}
function snippet(text, idx, len) {
  const s = text.slice(Math.max(0, idx - 70), Math.min(text.length, idx + len + 70)).replace(/\s+/g, ' ').trim()
  return `${idx > 70 ? '…' : ''}${s}${idx + len + 70 < text.length ? '…' : ''}`
}
function* matches(re, text) {
  if (!re || !text) return
  re.lastIndex = 0
  let m
  while ((m = re.exec(text))) {
    yield { idx: m.index, len: m[0].length, text: m[0] }
    if (m[0].length === 0) re.lastIndex++
  }
}

// ─── profile compilation ─────────────────────────────────────────────────────

/**
 * Compile a resolved profile ({ aliases, drugs, neighbors:[{name,aliases,drugs}] }) into regexes.
 * Aliases that are phrase-only fragments are fine; boundaries prevent "CD19" matching "CD190", "VEGF" matching "VEGFR".
 */
export function compileProfile(profile) {
  const c = {
    aliasRe: bounded(profile.aliases, 'gi', profile.aliasExclude),
    drugRe: bounded(profile.drugs),
    phrases: phraseRules(profile.aliases, profile.aliasExclude),
    neighbors: (profile.neighbors ?? []).map(n => ({
      name: n.name, aliasRe: bounded(n.aliases ?? []), drugRe: bounded(n.drugs ?? []), phrases: phraseRules(n.aliases ?? []),
    })),
  }
  return { ...profile, _c: c }
}

// ─── record → text fields ────────────────────────────────────────────────────

/** Pull the classifier's text fields out of a raw CT.gov v2 study. */
export function extractStudyText(study) {
  const p = study?.protocolSection ?? {}
  const arms = p.armsInterventionsModule ?? {}
  const outs = p.outcomesModule ?? {}
  const outcomeText = [...(outs.primaryOutcomes ?? []), ...(outs.secondaryOutcomes ?? [])].map(o => `${o.measure ?? ''}. ${o.description ?? ''}`).join('\n')
  return {
    purpose: p.designModule?.designInfo?.primaryPurpose ?? '',
    title: p.identificationModule?.briefTitle ?? '',
    officialTitle: p.identificationModule?.officialTitle ?? '',
    summary: p.descriptionModule?.briefSummary ?? '',
    eligibility: p.eligibilityModule?.eligibilityCriteria ?? '',
    outcomes: outcomeText,
    conditions: (p.conditionsModule?.conditions ?? []).join('; '),
    keywords: (p.conditionsModule?.keywords ?? []).join('; '),
    interventions: (arms.interventions ?? []).map(i => ({
      type: i.type ?? '', name: i.name ?? '', otherNames: (i.otherNames ?? []).join('; '), description: i.description ?? '',
    })),
    arms: (arms.armGroups ?? []).map(a => ({ label: a.label ?? '', description: a.description ?? '', type: a.type ?? '' })),
  }
}

// ─── classification ──────────────────────────────────────────────────────────

/**
 * @param {object} text  output of extractStudyText (or any object of that shape)
 * @param {object} profile  output of compileProfile
 * @returns {{label: 'Targets'|'Measures only'|'Unclear', evidence: Array, reason: string}}
 */
export function classifyTrial(text, profile) {
  const c = profile._c ?? compileProfile(profile)._c
  const ev = []   // { where, kind: 'drug'|'phrase'|'alias'|'neighbor', role: 'target'|'measure'|'weak'|'neighbor', matched, snippet, note }
  const push = (where, kind, role, hit, src, note) =>
    ev.push({ where, kind, role, matched: hit.text.replace(/\s+/g, ' '), snippet: snippet(src, hit.idx, hit.len), note, sentence: sentenceAround(src, hit.idx, hit.len) })

  const ivs = text.interventions ?? []
  const supportive = text.purpose === 'SUPPORTIVE_CARE' || SUPPORTIVE_TITLE_RE.test(text.title ?? '')
  const therapeutic = ivs.length === 0 || ivs.some(i => THERAPEUTIC.has(i.type) || (i.type === 'OTHER' && !/no intervention|observation|standard of care|usual care|questionnaire|blood|sample|collection|biops/i.test(i.name)))

  /** Scan one text block. `checkPrior`: downgrade acting-on matches that sit in prior-therapy / resistance context. */
  function scan(where, src, { checkPrior = true, diagnostic = false, acting = 'target', bareActs = false, background = false } = {}) {
    if (!src) return
    const covered = []   // ranges already explained by a strong match, so a bare alias inside them isn't double counted
    const note = (m, strongRole, kind, rule) => {
      if (diagnostic) return push(where, kind, 'measure', m, src, `${rule} — in a diagnostic / imaging intervention`)
      if (background) return push(where, kind, 'measure', m, src, `${rule}, but only as background therapy in a supportive-care / toxicity trial`)
      if (checkPrior && (PRIOR_RE.test(windowAround(src, m.idx, m.len, 60, 25)) || AFTER_BEFORE_RE.test(src.slice(Math.max(0, m.idx - 45), m.idx))))
        return push(where, kind, 'measure', m, src, `${rule}, but in prior-therapy / resistance context (eligibility-like)`)
      if (checkPrior && PREDICT_RE.test(windowAround(src, m.idx, m.len, 60, 50)) && !where.startsWith('intervention'))
        return push(where, kind, 'measure', m, src, `${rule}, but in a prediction / biomarker context`)
      push(where, kind, strongRole, m, src, rule)
    }
    for (const [rule, re] of c.phrases) for (const m of matches(re, src)) { covered.push([m.idx, m.idx + m.len]); note(m, acting, 'phrase', rule) }
    for (const m of matches(c.drugRe, src)) { covered.push([m.idx, m.idx + m.len]); note(m, acting, 'drug', 'known drug acting on target') }
    for (const m of matches(c.aliasRe, src)) {
      if (covered.some(([a, b]) => m.idx >= a && m.idx < b)) continue
      const near = windowAround(src, m.idx, m.len, 40, 40)
      if (diagnostic || MEASURE_RE.test(near) || PRIOR_RE.test(near)) push(where, 'alias', 'measure', m, src, 'target mentioned with expression / biomarker / eligibility wording')
      else if (bareActs) push(where, 'alias', 'target', m, src, 'target named in an intervention name, no biomarker wording')
      else if (acting === 'measure' && where !== 'keywords') push(where, 'alias', 'measure', m, src, 'target mentioned in eligibility / outcome / condition text')
      else push(where, 'alias', 'weak', m, src, 'bare mention of the target')
    }
    // neighbours (ligand / receptor / paralog): informational only
    for (const n of c.neighbors) {
      for (const [rule, re] of n.phrases) for (const m of matches(re, src)) push(where, 'neighbor', 'neighbor', m, src, `${rule} on ${n.name}`)
      for (const m of matches(n.drugRe, src)) push(where, 'neighbor', 'neighbor', m, src, `drug acting on ${n.name}`)
    }
  }

  // 1. Interventions: the most reliable evidence of what the trial actually does.
  for (const iv of ivs) {
    const diag = iv.type === 'DIAGNOSTIC_TEST' || DIAGNOSTIC_NAME_RE.test(`${iv.name} ${iv.otherNames}`)
    const who = `intervention “${iv.name.slice(0, 60)}”`
    scan(`${who} (name)`, `${iv.name}${iv.otherNames ? ` (${iv.otherNames})` : ''}`, { checkPrior: false, diagnostic: diag, bareActs: true })
    scan(`${who} (description)`, iv.description, { checkPrior: true, diagnostic: diag, background: supportive })
  }
  // 2. Arms, title, summary: moderate evidence (they may talk about prior therapy / background).
  for (const a of text.arms ?? []) scan(`arm “${(a.label ?? '').slice(0, 50)}”`, `${a.label}. ${a.description}`, { background: supportive })
  scan('title', `${text.title}. ${text.officialTitle}`, { background: supportive })
  scan('summary', text.summary, { background: supportive })
  // A summary sentence that names one of the trial's own interventions next to the target ("SCT510A is an anti-VEGF antibody …") is about
  // the study drug, not background: promote it to arm/title-level evidence.
  const ivNames = [...new Set(ivs.flatMap(i => i.name.toLowerCase().split(/[^a-z0-9\-]+/)).filter(t => t.length >= 4 && !GENERIC_IV.has(t)))]
  for (const e of ev) {
    if (e.where === 'summary' && e.role === 'target' && ivNames.some(t => e.sentence.toLowerCase().includes(t))) e.where = 'summary (names an intervention)'
  }
  // 3. Eligibility / outcomes / conditions / keywords: never "acting" evidence, only mentions.
  scan('eligibility', text.eligibility, { acting: 'measure' })
  scan('outcomes', text.outcomes, { acting: 'measure' })
  scan('conditions', text.conditions, { acting: 'measure' })
  scan('keywords', text.keywords, { acting: 'measure' })

  // Dedupe (same place + same matched string), order: target > measure > neighbor > weak
  const seen = new Set()
  const rank = { target: 0, measure: 1, neighbor: 2, weak: 3 }
  const uniq = ev.filter(e => { const k = `${e.where}|${e.matched.toLowerCase()}|${e.role}`; if (seen.has(k)) return false; seen.add(k); return true })
    .sort((a, b) => rank[a.role] - rank[b.role])

  const isIv = e => e.where.startsWith('intervention')
  const isArmOrTitle = e => e.where.startsWith('arm') || e.where === 'title' || e.where.startsWith('summary (names')
  const targetEv = uniq.filter(e => e.role === 'target')
  const ivTarget = targetEv.filter(isIv)
  const armTitleTarget = targetEv.filter(isArmOrTitle)
  const summaryTarget = targetEv.filter(e => e.where === 'summary')
  const measures = uniq.filter(e => e.role === 'measure')
  const neighbors = uniq.filter(e => e.role === 'neighbor')

  let label, reason
  if (ivTarget.length) { label = 'Targets'; reason = 'An intervention matches a drug / phrase acting on the target.' }
  else if (armTitleTarget.length && therapeutic) { label = 'Targets'; reason = 'An arm or the title names an agent acting on the target (not listed as an intervention name).' }
  else if (summaryTarget.length && !measures.some(m => !m.where.startsWith('summary'))) { label = 'Unclear'; reason = 'Only the summary text mentions an agent acting on the target, and no intervention or title does (possible background text).' }
  else if (measures.length || (armTitleTarget.length && !therapeutic)) { label = 'Measures only'; reason = 'The target appears only as eligibility / prior therapy / biomarker / outcome / diagnostic text.' }
  else if (summaryTarget.length) { label = 'Unclear'; reason = 'Only the summary text mentions an agent acting on the target, and no intervention or title does (possible background text).' }
  else if (neighbors.length) { label = 'Unclear'; reason = 'No mention of the target itself; the trial acts on a ligand / receptor neighbour.' }
  else if (uniq.length) { label = 'Unclear'; reason = 'Only a bare mention of the target.' }
  else { label = 'Unclear'; reason = 'The target is not found in the title, interventions, arms, summary, eligibility or outcomes (retrieved by ClinicalTrials.gov synonym search).' }

  return { label, reason, evidence: uniq.slice(0, 6).map(({ sentence, ...e }) => e) }
}
