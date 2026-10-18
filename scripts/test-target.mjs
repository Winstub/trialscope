// Unit-style tests for the target classifier. Offline (uses the bundled seed only):  npm run test:target
import assert from 'node:assert/strict'
import { classifyTrial, compileProfile } from '../src/utils/target.js'
import { SEED_INDEX, normKey } from '../src/utils/targetSeed.js'

const profile = name => compileProfile(SEED_INDEX.get(normKey(name)))
const trial = (o = {}) => ({ purpose: '', title: '', officialTitle: '', summary: '', eligibility: '', outcomes: '', conditions: '', keywords: '', interventions: [], arms: [], ...o })
const drug = (name, description = '', type = 'DRUG') => ({ type, name, otherNames: '', description })

let n = 0, failed = 0
function check(target, label, name, t) {
  n++
  const got = classifyTrial(trial(t), profile(target))
  if (got.label !== label) { failed++; console.error(`✗ [${target}] ${name}: expected ${label}, got ${got.label}\n   ${got.reason}\n   ${got.evidence.map(e => `${e.role}@${e.where}: ${e.matched}`).join('\n   ')}`) }
  else console.log(`✓ [${target}] ${name} → ${label}`)
}

// ── PD-1 ─────────────────────────────────────────────────────────────────────
check('PD-1', 'Targets', 'anti-PD-1 antibody by drug name', { interventions: [drug('Pembrolizumab'), drug('Carboplatin')] })
check('PD-1', 'Targets', 'trade / code names', { interventions: [drug('MK-3475'), drug('Opdivo')] })
check('PD-1', 'Targets', 'phrase in intervention description', { interventions: [drug('XYZ-123', 'A humanized anti-PD-1 monoclonal antibody given every 3 weeks')] })
check('PD-1', 'Targets', 'PD-1/VEGF bispecific', { interventions: [drug('AK112', 'PD-1/VEGF bispecific antibody')] })
check('PD-1', 'Targets', 'ivonescimab by name', { interventions: [drug('Ivonescimab')] })
check('PD-1', 'Targets', 'PD-1 knockout T cells', { title: 'CRISPR PD1-edited tumor infiltrating lymphocytes in melanoma', interventions: [drug('TIL therapy', '', 'BIOLOGICAL')] })
check('PD-1', 'Targets', 'PD-1 CAR with Greek alpha prefix', { interventions: [drug('αPD1-MSLN CAR-T', 'autologous T cells', 'BIOLOGICAL')] })
check('PD-1', 'Targets', 'PD1/PD-L1 inhibitors named in arm', { interventions: [drug('LG002')], arms: [{ label: 'Neo-DCVac', description: 'DC vaccine combined with PD1/PD-L1 inhibitors' }] })
check('PD-1', 'Targets', 'observational cohort treated with the drug (no interventions listed)', { title: 'Real world study of pembrolizumab for NSCLC', interventions: [] })
check('PD-1', 'Targets', 'PD-1 named as intervention', { interventions: [drug('PD-1')] })
check('PD-1', 'Measures only', 'PD-L1 positive as inclusion, chemo only', { interventions: [drug('Cisplatin'), drug('Pemetrexed')], eligibility: 'Inclusion: PD-L1 TPS ≥ 50% by IHC. PD-1 expression documented.', title: 'Chemotherapy in PD-L1 high NSCLC' })
check('PD-1', 'Measures only', 'prior anti-PD-1 only in eligibility', { interventions: [drug('Cabozantinib')], eligibility: 'Exclusion: prior treatment with anti-PD-1 or anti-PD-L1 antibody.' })
check('PD-1', 'Measures only', 'PD-1 expression as outcome', { interventions: [drug('Exercise program', '', 'BEHAVIORAL')], outcomes: 'Change in PD-1 expression on CD8 T cells' })
check('PD-1', 'Measures only', 'prediction biomarker study', { title: 'Serum autoantibodies predicting efficacy of anti-PD-1 treatment', interventions: [drug('Serum tumor autoantibody detection', '', 'DIAGNOSTIC_TEST')] })
check('PD-1', 'Measures only', 'drug named only as prior therapy in title', { title: 'Consolidative therapy after EV + pembrolizumab in bladder cancer', interventions: [drug('IMRT', '', 'RADIATION')] })
check('PD-1', 'Unclear', 'anti-PD-L1 is a ligand neighbour, not the target', { interventions: [drug('Atezolizumab', 'anti-PD-L1 antibody')] })
check('PD-1', 'Unclear', 'durvalumab (PD-L1)', { interventions: [drug('Durvalumab')] })
check('PD-1', 'Unclear', 'no mention at all', { title: 'Retinal abnormalities in Parkinson disease', interventions: [] })
check('PD-1', 'Unclear', 'background-only summary mention', { summary: 'PD-1/PD-L1 blockade has transformed oncology. We test canagliflozin.', interventions: [drug('Canagliflozin')] })

// ── VEGF (ligand vs receptor) ────────────────────────────────────────────────
check('VEGF', 'Targets', 'bevacizumab', { interventions: [drug('Bevacizumab', 'IV every 2 weeks'), drug('FOLFOX')] })
check('VEGF', 'Targets', 'intravitreal aflibercept / faricimab', { interventions: [drug('Intravitreal injections of 6 mg faricimab')] })
check('VEGF', 'Targets', 'anti-VEGF mAb by phrase', { interventions: [drug('SCT510A', 'recombinant anti-VEGF humanized monoclonal antibody')] })
check('VEGF', 'Targets', 'PD-1/VEGF bispecific', { interventions: [drug('SSGJ-707', 'PD-1/VEGF bispecific antibody')] })
check('VEGF', 'Unclear', 'VEGFR TKI (receptor neighbour)', { interventions: [drug('Axitinib'), drug('Nivolumab')] })
check('VEGF', 'Unclear', 'sunitinib text mentioning VEGFR2 only', { interventions: [drug('XYZ', 'selective VEGFR2 kinase inhibitor')] })
check('VEGF', 'Measures only', 'VEGF level as outcome', { interventions: [drug('Exercise', '', 'BEHAVIORAL')], outcomes: 'Serum VEGF levels measured by ELISA' })
check('VEGF', 'Measures only', 'prior anti-VEGF in eligibility', { interventions: [drug('Placebo')], eligibility: 'No previous intraocular anti-VEGF injection.' })

// ── HER2 ─────────────────────────────────────────────────────────────────────
check('HER2', 'Targets', 'trastuzumab deruxtecan', { interventions: [drug('Trastuzumab deruxtecan [T-DXd]')], eligibility: 'HER2-positive' })
check('HER2', 'Targets', 'anti-HER2 bispecific by phrase', { interventions: [drug('SSGJ-705', 'anti-HER2 bispecific antibody')] })
check('HER2', 'Targets', 'HER2 CAR-T', { interventions: [drug('HER2-CAR T cells', '', 'BIOLOGICAL')] })
check('HER2', 'Measures only', 'HER2-negative inclusion, chemo only', { title: 'TAS102 in ER-positive, HER2-negative breast cancer', interventions: [drug('Trifluridine/tipiracil')], eligibility: 'HER2 negative by IHC 0/1+.' })
check('HER2', 'Measures only', '89Zr-trastuzumab PET imaging measures HER2', { interventions: [{ type: 'OTHER', name: 'Molecular imaging', otherNames: 'HER2-PET; Injection of 89Zr-trastuzumab followed by PET scan', description: '' }] })
check('HER2', 'Measures only', 'T-DXd only as background in an antiemetic trial', { purpose: 'SUPPORTIVE_CARE', title: 'Nausea and vomiting caused by trastuzumab deruxtecan', interventions: [drug('Auricular point stimulation', 'for patients receiving trastuzumab deruxtecan', 'DEVICE')] })
check('HER2', 'Unclear', 'HER3 antibody (paralog neighbour)', { interventions: [drug('Patritumab deruxtecan')] })

// ── CD19 / EGFR ──────────────────────────────────────────────────────────────
check('CD19', 'Targets', 'CD19 CAR-T typed OTHER', { interventions: [drug('Anti-CD19 CAR-T cells', '', 'OTHER')] })
check('CD19', 'Targets', 'tisagenlecleucel', { interventions: [drug('Tisagenlecleucel', '', 'BIOLOGICAL')] })
check('CD19', 'Targets', 'CAR targeting CD19 phrase', { interventions: [drug('JWCAR029', 'Autologous T cells expressing a chimeric antigen receptor targeting CD19')] })
check('CD19', 'Measures only', 'CD19+ inclusion with unrelated drug', { interventions: [drug('Ibrutinib')], eligibility: 'CD19-positive B-cell malignancy confirmed by flow cytometry.' })
check('CD19', 'Unclear', 'rituximab (CD20 neighbour)', { interventions: [drug('Rituximab')] })
check('EGFR', 'Targets', 'osimertinib in EGFR-mutant NSCLC', { title: 'Osimertinib in EGFR mutation positive NSCLC', interventions: [drug('Osimertinib')] })
check('EGFR', 'Measures only', 'EGFR mutation as eligibility, non-EGFR drug', { interventions: [drug('Pembrolizumab')], eligibility: 'EGFR mutation negative.' })

// ── boundaries ───────────────────────────────────────────────────────────────
n++
{
  const p = profile('PD-1')
  const hit = s => { p._c.aliasRe.lastIndex = 0; return p._c.aliasRe.test(s) }
  for (const x of ['PD-1', 'PD1', 'pd 1', 'PDCD1', 'CD279', 'PD‑1']) assert.ok(hit(x), `PD-1 spelling variant ${x}`)
  for (const x of ['PD-L1', 'PDL1', 'PD-L2', 'PD-10', 'CD2790']) assert.ok(!hit(x), `PD-1 must not match ${x}`)
  const v = profile('VEGF')
  v._c.aliasRe.lastIndex = 0; assert.ok(!v._c.aliasRe.test('VEGFR2'), 'VEGF must not match VEGFR2')
  v._c.aliasRe.lastIndex = 0; assert.ok(!v._c.aliasRe.test('VEGF-C'), 'VEGF must not match VEGF-C')
  v._c.aliasRe.lastIndex = 0; v._c.aliasRe.lastIndex = 0; assert.ok(v._c.aliasRe.test('VEGF-A'))
  v._c.aliasRe.lastIndex = 0; assert.ok(v._c.aliasRe.test('VEGF165'))
  const c = profile('CD19')
  c._c.aliasRe.lastIndex = 0; assert.ok(!c._c.aliasRe.test('CD190'), 'CD19 must not match CD190')
  console.log('✓ alias boundaries (PD-1 vs PD-L1, VEGF vs VEGFR/VEGF-C, CD19 vs CD190)')
}

console.log(`\n${n - failed}/${n} passed`)
process.exit(failed ? 1 : 0)
