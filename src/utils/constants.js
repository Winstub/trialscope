export const STATUS_CONFIG = {
  NOT_YET_RECRUITING:     { label: 'Not Yet Recruiting',      color: '#4ade80', group: 'recruiting' },
  RECRUITING:             { label: 'Recruiting',               color: '#16a34a', group: 'recruiting' },
  ENROLLING_BY_INVITATION:{ label: 'Enrolling by Invitation',  color: '#0d9488', group: 'recruiting' },
  ACTIVE_NOT_RECRUITING:  { label: 'Active, Not Recruiting',   color: '#2563eb', group: 'active' },
  COMPLETED:              { label: 'Completed',                color: '#6366f1', group: 'no_longer' },
  TERMINATED:             { label: 'Terminated',               color: '#ef4444', group: 'no_longer' },
  SUSPENDED:              { label: 'Suspended',                color: '#f97316', group: 'no_longer' },
  WITHDRAWN:              { label: 'Withdrawn',                color: '#f59e0b', group: 'no_longer' },
  UNKNOWN:                    { label: 'Unknown',                   color: '#94a3b8', group: 'no_longer' },
  AVAILABLE:                  { label: 'Available (Expanded Access)', color: '#14b8a6', group: 'recruiting' },
  APPROVED_FOR_MARKETING:     { label: 'Approved for Marketing',    color: '#a855f7', group: 'no_longer' },
  WITHHELD:                   { label: 'Withheld',                  color: '#d6d3d1', group: 'no_longer' },
  NO_LONGER_AVAILABLE:        { label: 'No Longer Available',       color: '#78716c', group: 'no_longer' },
  TEMPORARILY_NOT_AVAILABLE:  { label: 'Temporarily Not Available', color: '#a8a29e', group: 'no_longer' },
}

export const STATUS_GROUP_CONFIG = {
  recruiting: {
    label: 'Overall Recruiting',
    sublabel: 'Not Yet + Recruiting + Enrolling by Invitation',
    color: '#16a34a',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-800',
    statuses: ['NOT_YET_RECRUITING', 'RECRUITING', 'ENROLLING_BY_INVITATION', 'AVAILABLE'],
  },
  active: {
    label: 'Active, Not Recruiting',
    sublabel: 'Enrollment closed; study ongoing',
    color: '#2563eb',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-800',
    statuses: ['ACTIVE_NOT_RECRUITING'],
  },
  no_longer: {
    label: 'No Longer Recruiting',
    sublabel: 'Completed + Terminated + Suspended + Withdrawn + Unknown',
    color: '#64748b',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-700',
    statuses: ['COMPLETED', 'TERMINATED', 'SUSPENDED', 'WITHDRAWN', 'UNKNOWN', 'NO_LONGER_AVAILABLE', 'TEMPORARILY_NOT_AVAILABLE', 'APPROVED_FOR_MARKETING', 'WITHHELD'],
  },
}

export const PHASE_CONFIG = {
  EARLY_PHASE1: { label: 'Early Phase 1', shortLabel: 'Early Ph 1', color: '#c026d3', order: 0 },
  PHASE1:       { label: 'Phase 1',       shortLabel: 'Phase 1',    color: '#7c3aed', order: 1 },
  PHASE2:       { label: 'Phase 2',       shortLabel: 'Phase 2',    color: '#2563eb', order: 2 },
  PHASE3:       { label: 'Phase 3',       shortLabel: 'Phase 3',    color: '#059669', order: 3 },
  PHASE4:       { label: 'Phase 4',       shortLabel: 'Phase 4',    color: '#d97706', order: 4 },
  NA:           { label: 'Not Applicable', shortLabel: 'N/A',       color: '#6b7280', order: 5 },
}

export const PHASE_ORDER = ['EARLY_PHASE1', 'PHASE1', 'PHASE2', 'PHASE3', 'PHASE4', 'NA']

// Route of administration — keys match the labels produced by extractROAs()
export const ROUTE_CONFIG = {
  'Intravenous':          { color: '#2563eb' },
  'Subcutaneous':         { color: '#7c3aed' },
  'Oral':                 { color: '#16a34a' },
  'Intratumoral':         { color: '#dc2626' },
  'Intramuscular':        { color: '#d97706' },
  'Inhalation':           { color: '#0891b2' },
  'Intranasal':           { color: '#9333ea' },
  'Intrathecal':          { color: '#be123c' },
  'Intraperitoneal':      { color: '#c2410c' },
  'Topical/Transdermal':  { color: '#0f766e' },
  'Intravitreal':         { color: '#065f46' },
  'Intravesical':         { color: '#92400e' },
  'Sublingual':           { color: '#a21caf' },
  'Ophthalmic':           { color: '#1d4ed8' },
  'Injection (unspec.)':  { color: '#6b7280' },
  'Not Specified':        { color: '#94a3b8' },
}

export const STATUS_ORDER = [
  'NOT_YET_RECRUITING', 'RECRUITING', 'ENROLLING_BY_INVITATION', 'AVAILABLE',
  'ACTIVE_NOT_RECRUITING',
  'COMPLETED', 'TERMINATED', 'SUSPENDED', 'WITHDRAWN', 'UNKNOWN',
  'NO_LONGER_AVAILABLE', 'TEMPORARILY_NOT_AVAILABLE', 'APPROVED_FOR_MARKETING', 'WITHHELD',
]

// ─── Dimensions Explorer config ───────────────────────────────────────────────
// Each entry drives one GroupedDimensionChart.  Keys in `labels` and `colors`
// must match the raw values coming from aggregateStudies → dimByGroup.

export const DIMENSION_CONFIG = {
  phase: {
    title: 'Trial Phase',
    description: 'Clinical development stage (multi-phase trials counted in each)',
    order: ['EARLY_PHASE1','PHASE1','PHASE2','PHASE3','PHASE4','NA'],
    labels: { EARLY_PHASE1:'Early Phase 1', PHASE1:'Phase 1', PHASE2:'Phase 2', PHASE3:'Phase 3', PHASE4:'Phase 4', NA:'Not Applicable' },
    colors: { EARLY_PHASE1:'#c026d3', PHASE1:'#7c3aed', PHASE2:'#2563eb', PHASE3:'#059669', PHASE4:'#d97706', NA:'#6b7280' },
  },
  route: {
    title: 'Route of Administration',
    description: 'Keyword-extracted from intervention descriptions',
    unknownKey: 'Not Specified',
    labels: {
      'Intravenous':'Intravenous','Subcutaneous':'Subcutaneous','Oral':'Oral',
      'Intratumoral':'Intratumoral','Intramuscular':'Intramuscular','Inhalation':'Inhalation',
      'Intranasal':'Intranasal','Intrathecal':'Intrathecal','Intraperitoneal':'Intraperitoneal',
      'Topical/Transdermal':'Topical / Transdermal','Intravitreal':'Intravitreal',
      'Intravesical':'Intravesical','Sublingual':'Sublingual','Ophthalmic':'Ophthalmic',
      'Injection (unspec.)':'Injection (unspec.)','Not Specified':'Not Specified',
    },
    colors: {
      'Intravenous':'#2563eb','Subcutaneous':'#7c3aed','Oral':'#16a34a',
      'Intratumoral':'#dc2626','Intramuscular':'#d97706','Inhalation':'#0891b2',
      'Intranasal':'#9333ea','Intrathecal':'#be123c','Intraperitoneal':'#c2410c',
      'Topical/Transdermal':'#0f766e','Intravitreal':'#065f46','Intravesical':'#92400e',
      'Sublingual':'#a21caf','Ophthalmic':'#1d4ed8','Injection (unspec.)':'#6b7280',
      'Not Specified':'#94a3b8',
    },
  },
  interventionType: {
    title: 'Intervention Type',
    description: 'Biological agent, device, drug, procedure, and more',
    labels: {
      DRUG:'Drug', BIOLOGICAL:'Biological', DEVICE:'Device',
      PROCEDURE:'Procedure / Surgery', BEHAVIORAL:'Behavioral', GENETIC:'Genetic',
      DIETARY_SUPPLEMENT:'Dietary Supplement', COMBINATION_PRODUCT:'Combination Product',
      DIAGNOSTIC_TEST:'Diagnostic Test', RADIATION:'Radiation', OTHER:'Other',
    },
    colors: {
      DRUG:'#2563eb', BIOLOGICAL:'#7c3aed', DEVICE:'#16a34a',
      PROCEDURE:'#0891b2', BEHAVIORAL:'#d97706', GENETIC:'#dc2626',
      DIETARY_SUPPLEMENT:'#059669', COMBINATION_PRODUCT:'#9333ea',
      DIAGNOSTIC_TEST:'#c026d3', RADIATION:'#be123c', OTHER:'#6b7280',
    },
  },
  studyType: {
    title: 'Study Type',
    description: 'Interventional, observational, or expanded access',
    order: ['INTERVENTIONAL','OBSERVATIONAL','EXPANDED_ACCESS'],
    labels: { INTERVENTIONAL:'Interventional', OBSERVATIONAL:'Observational', EXPANDED_ACCESS:'Expanded Access' },
    colors: { INTERVENTIONAL:'#2563eb', OBSERVATIONAL:'#16a34a', EXPANDED_ACCESS:'#d97706' },
  },
  sponsorClass: {
    title: 'Sponsor / Funder Type',
    description: 'Lead sponsor funding source',
    order: ['INDUSTRY','NIH','FED','OTHER_GOV','NETWORK','INDIV','OTHER','UNKNOWN'],
    labels: { INDUSTRY:'Industry', NIH:'NIH', FED:'Federal', OTHER_GOV:'Other Government', NETWORK:'Network', INDIV:'Individual', OTHER:'Academic / Other', UNKNOWN:'Unknown' },
    colors: { INDUSTRY:'#2563eb', NIH:'#16a34a', FED:'#0891b2', OTHER_GOV:'#0f766e', NETWORK:'#7c3aed', INDIV:'#d97706', OTHER:'#6b7280', UNKNOWN:'#94a3b8' },
  },
  primaryPurpose: {
    title: 'Primary Purpose',
    description: 'Main clinical objective of the trial',
    order: ['TREATMENT','PREVENTION','DIAGNOSTIC','SUPPORTIVE_CARE','SCREENING','HEALTH_SERVICES_RESEARCH','BASIC_SCIENCE','DEVICE_FEASIBILITY','ECT','OTHER'],
    labels: {
      TREATMENT:'Treatment', PREVENTION:'Prevention', DIAGNOSTIC:'Diagnostic',
      SUPPORTIVE_CARE:'Supportive Care', SCREENING:'Screening',
      HEALTH_SERVICES_RESEARCH:'Health Services Research', BASIC_SCIENCE:'Basic Science',
      DEVICE_FEASIBILITY:'Device Feasibility', ECT:'Educational / Counseling', OTHER:'Other',
    },
    colors: {
      TREATMENT:'#2563eb', PREVENTION:'#16a34a', DIAGNOSTIC:'#d97706',
      SUPPORTIVE_CARE:'#0891b2', SCREENING:'#7c3aed',
      HEALTH_SERVICES_RESEARCH:'#be123c', BASIC_SCIENCE:'#059669',
      DEVICE_FEASIBILITY:'#c026d3', ECT:'#92400e', OTHER:'#6b7280',
    },
  },
  ageGroup: {
    title: 'Eligible Age Group',
    description: 'Participant age eligibility (studies counted in each applicable group)',
    order: ['CHILD','ADULT','OLDER_ADULT'],
    labels: { CHILD:'Child (< 18)', ADULT:'Adult (18–64)', OLDER_ADULT:'Older Adult (≥ 65)' },
    colors: { CHILD:'#7c3aed', ADULT:'#2563eb', OLDER_ADULT:'#0f766e' },
  },
  sex: {
    title: 'Sex Eligibility',
    description: 'Which sexes are eligible to enroll',
    order: ['ALL','FEMALE','MALE'],
    labels: { ALL:'All Sexes', FEMALE:'Female Only', MALE:'Male Only' },
    colors: { ALL:'#6b7280', FEMALE:'#db2777', MALE:'#2563eb' },
  },
  masking: {
    title: 'Masking (Blinding)',
    description: 'Who is blinded to treatment assignment',
    order: ['NONE','SINGLE','DOUBLE','TRIPLE','QUADRUPLE'],
    labels: { NONE:'None (Open Label)', SINGLE:'Single', DOUBLE:'Double', TRIPLE:'Triple', QUADRUPLE:'Quadruple' },
    colors: { NONE:'#94a3b8', SINGLE:'#93c5fd', DOUBLE:'#3b82f6', TRIPLE:'#1d4ed8', QUADRUPLE:'#1e3a8a' },
  },
  allocation: {
    title: 'Allocation',
    description: 'How participants are assigned to study arms',
    order: ['RANDOMIZED','NON_RANDOMIZED','NA'],
    labels: { RANDOMIZED:'Randomized', NON_RANDOMIZED:'Non-Randomized', NA:'N/A' },
    colors: { RANDOMIZED:'#16a34a', NON_RANDOMIZED:'#d97706', NA:'#94a3b8' },
  },
}

// Display order for the Dimensions Explorer accordion
export const DIMENSION_ORDER = [
  'phase','route','interventionType','studyType','sponsorClass',
  'primaryPurpose','ageGroup','sex','masking','allocation',
]

// Colors assigned to successive search entries in comparison mode
export const SEARCH_COLORS = [
  '#2563eb', // blue
  '#f97316', // orange
  '#16a34a', // green
  '#7c3aed', // violet
  '#be123c', // rose
  '#0891b2', // cyan
  '#d97706', // amber
  '#0f766e', // teal
  '#9333ea', // purple
  '#65a30d', // lime
]
