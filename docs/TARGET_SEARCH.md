# Target search

Search a molecular target (PD-1, VEGF, HER2, CD19, EGFR …) and every trial is labelled

| Label | Meaning |
|---|---|
| **Targets** | an intervention / regimen acts **on** the target — anti-PD-1 antibody, PD-1/VEGF bispecific, CAR-T against CD19, PD-1 knockout cells, HER2 ADC … |
| **Measures only** | the target is only **mentioned** as eligibility, prior therapy, biomarker / expression status, outcome, condition text, or the only interventions are diagnostics/imaging |
| **Unclear** | no usable signal, only background text, or the trial acts on a ligand / receptor **neighbour** (PD-L1 for PD-1, VEGFR for VEGF …) |

No AI/LLM and no API keys: the labels come from transparent text rules applied in the browser. Hover a badge to see the evidence.

## 1. Target resolution (`src/utils/targetResolve.js`, `targetSeed.js`)

`resolveTarget("PD-1")` builds a *profile* `{ aliases, drugs, neighbors }`:

1. **Bundled seed** (`targetSeed.js`, 22 oncology/immunology targets: PD-1, PD-L1, CTLA-4, LAG-3, TIGIT, VEGF, HER2, EGFR, CD19, CD20, BCMA, CD38, TNF, IL-6, IL-17A, IL-23, CD47, Claudin 18.2, TROP2, KRAS, PCSK9, CGRP). Hand-curated gene symbols/synonyms, drug INNs, trade names and development codes, and the *neighbours* to keep apart. Works offline.
2. **Open Targets Platform GraphQL** (`api.platform.opentargets.org/api/v4/graphql`, CORS-enabled): fuzzy `search` → accept a hit only if the query equals its symbol/name/HGNC-UniProt synonym → HGNC/UniProt synonyms + `drugAndClinicalCandidates` (drugs whose mechanism of action is on this target; ChEMBL synonyms + trade names).
3. **ChEMBL REST** (`ebi.ac.uk/chembl/api/data`, CORS-enabled) — only if Open Targets fails: human single-protein target → `mechanism` → `molecule` names/synonyms.
4. Network results are merged *under* the seed (seed first), junk filtered (salts, “component of…”, 3-letter gene aliases like NEU, biosimilar boilerplate), capped at 150 network drug names. Any failure degrades to the seed; the panel shows which sources answered. Unknown targets that neither service recognises search only the name (a warning says so).

Both services were verified with `curl` for browser CORS (`Access-Control-Allow-Origin`, and a POST preflight for Open Targets). Note: Open Targets returns 403 to non-browser user agents such as Node’s default `fetch`; browsers are fine.

## 2. Candidate pull (`fetchTargetStudies` in `api.js`)

* one `query.term` search for the aliases (any field → also finds measure-only trials),
* `query.intr` searches for the drug names, 20 per request, ≤ 8 requests,
* de-duplicated by NCT id under the existing 20,000-study cap (`truncated` flag as before),
* extra fields (eligibility, outcomes, summary, arms, other names, keywords) are classified while streaming and then discarded; only `{label, reason, evidence}` is kept per trial.

## 3. Classifier (`src/utils/target.js`)

Text is scanned field by field; each hit becomes evidence with a *role*:

* **acts-on** (strong): a resolved drug name, or a phrase rule — `anti-X`, `X inhibitor/antagonist/agonist/antibody/blocker/-targeted/-directed/-specific/vaccine/CAR/knockout/-edited/silent …`, `X/Y inhibitor`, `X/Y bispecific` (either order, also “X plus Y blockade”), `agent targeting/against/binding/blocking X`, `inhibitor/antibody of X`, `CAR-T … targeting X`, `X-specific CAR/TCR`.
* **mention** (measure): the same hits in eligibility / outcomes / conditions text, with measure wording within ±40 characters (expression, positive, high, IHC, biomarker, status, mutation, amplification, `+` …), in prior-therapy context (`prior`, `refractory to`, `after/following …`, `naïve`, `history of`), in prediction/biomarker titles, as background therapy in supportive-care/toxicity trials, or inside diagnostic/imaging interventions (type DIAGNOSTIC_TEST, or name has PET/imaging/IHC/89Zr …).
* **neighbour**: drugs/phrases for the ligand/receptor neighbours (informational only).
* **bare**: the alias with no context.

Decision, in order:

1. acts-on evidence in an **intervention** (name / other names / description) → **Targets**
2. acts-on evidence in an **arm**, the **title**, or a **summary sentence that names one of the trial’s own interventions** (and the trial has a drug-like intervention, or lists none, e.g. observational) → **Targets**
3. acts-on evidence only elsewhere in the **summary** and nothing else → **Unclear** (probably background)
4. any mention (eligibility / outcome / condition / measure-context / diagnostic) → **Measures only**
5. neighbour evidence only, bare mention only, or nothing → **Unclear**

Matching is boundary-safe: `PD-1` ≠ `PD-L1`/`PD-10`, `VEGF` ≠ `VEGFR2`/`VEGF-C`, `CD19` ≠ `CD190`; spelling variants `PD-1/PD1/PD 1/PD‑1`, `HER2/HER-2/Her-2`, `αPD1` are all matched.

### Ligand / receptor neighbours — design decisions

* **PD-1 vs PD-L1/PD-L2**: anti-PD-L1 drugs (atezolizumab, durvalumab, avelumab …) and “anti-PD-L1” text do **not** make a trial *Targets* for PD-1; they are shown as *neighbour* evidence and the trial is *Unclear*. “PD-1/PD-L1 inhibitor”, PD-(L)1 and PD-1×PD-L1 bispecifics count as PD-1. Search “PD-L1” to get the ligand’s own profile (where PD-1 drugs are the neighbours).
* **VEGF vs VEGFR**: VEGF means the ligand (bevacizumab, aflibercept, ranibizumab, faricimab, PD-1/VEGF bispecifics…). Receptor TKIs/antibodies (sunitinib, axitinib, lenvatinib, apatinib, ramucirumab …) are neighbours → *Unclear*. If you consider “anti-angiogenic TKIs” part of the VEGF target, add them back via the *Unclear* filter, or search VEGFR2.
* **HER2 vs HER3/EGFR**: HER3 drugs are neighbours; pan-ErbB TKIs (lapatinib, neratinib, afatinib, dacomitinib …) whose mechanism includes ERBB2 *are* counted as acting on HER2.
* **Backbone drugs**: a drug in the regimen counts even if it is not the experimental agent (e.g. “new drug + pembrolizumab”, bevacizumab backbone). The label answers “does this trial give something that acts on the target?”, not “is the target the hypothesis?”.

## 4. UI

* “Target” in the search-scope selector (URL form `?q=target:PD-1`).
* Target panel: resolved names / drugs / sources (collapsible), label tiles with counts and % — they are also the Targets / Measures only / Unclear filter (URL `lbl=`).
* Table: badge per trial with hover/focus/tap evidence popover; sortable; badge on mobile cards; CSV has *Target label* and *Target evidence*.
* ClinicalTrials.gov links open a free-text `term` search for the target’s names + first 25 drug names. The site cannot apply the labels (and our candidate set includes up to ~160 drug names), so it shows a different/larger set; the tooltip says so.

## 5. Tests

`npm run test:target` — 42 offline checks (seed profiles only) for the classifier and alias boundaries, including the failure modes found while spot-checking real records.

## 6. Known weaknesses

* Novel/unlisted code-named agents with generic titles (e.g. a HER2 T-cell engager listed only by code) are missed unless Open Targets knows them; they usually land in *Measures only*/*Unclear*.
* Rules are English-only and regex-based; heavy abbreviation, misspellings (“tirilizumab”) or non-English text can hide signals.
* Backbone-drug problem (above); pan-kinase inhibitors are counted when their mechanism lists the target.
* “Prior therapy” detection is lexical: a prior-therapy sentence without the usual cue words can produce *Targets*; a plan like “after surgery, patients receive pembrolizumab” is protected only if the cue and drug are within ~30 characters.
* Detailed descriptions are not fetched (payload size), only brief summary, arms, interventions, eligibility and outcomes.
* Candidate pull relies on ClinicalTrials.gov synonym expansion plus drug names; trials mentioning only an unlisted drug and no alias are not retrieved.
* Open Targets can include investigational compounds with noisy synonyms; junk filters are heuristic.

## 7. Validation (18 Oct 2026, live ClinicalTrials.gov)

Full pulls with the bundled seed + Open Targets drug names:

| Target | Trials | Targets | Measures only | Unclear |
|---|---|---|---|---|
| PD-1 | 11,114 | 9,871 (89%) | 853 (8%) | 390 (4%) |
| VEGF | 7,392 | 5,095 (69%) | 1,628 (22%) | 669 (9%) |
| HER2 | 6,072 | 3,155 (52%) | 2,810 (46%) | 107 (2%) |

(Most “Unclear” VEGF trials are VEGFR TKI studies — neighbour policy above. Counts move daily.)

Two rounds of hand spot-checks (~15 random trials per target per round, each compared with its ClinicalTrials.gov record). Round 1 found these failures, all fixed and now covered by `npm run test:target`: prior-therapy phrasing in titles (“after EV + pembrolizumab”, “PD-L1 inhibitor rechallenge after PD-1 immunotherapy”); biomarker-prediction titles; drugs named only as background in supportive-care trials (antiemetic / thrombocytopenia studies of T-DXd, T-DM1); imaging probes (89Zr-trastuzumab PET); observational cohorts with no listed interventions; `αPD1-…` and “PD-1 silent” cell products; `PD-1/PD-L1` neighbour confusion in the seed index. Round 2 (fresh sample after tuning): ~40 of 45 clearly correct; remaining issues were (a) a code-named HER2 T-cell engager (VIR-5818) labelled *Measures only* — unknown agent, (b) a trial titled “PD-1 plus TIGIT blockade” whose drug is atezolizumab (PD-L1) — labelled by its title, (c) pan-ErbB TKIs (dacomitinib, afatinib) counted as HER2 *Targets* — by design.
