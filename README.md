# TrialScope

Instant analytics for [ClinicalTrials.gov](https://clinicaltrials.gov): search an intervention, condition or any term and get phases, status,
sponsors, countries, enrollment and start-year trends, with every chart acting as a filter for the trial table.

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
```

## Using it
- Search by **Intervention**, **Condition** or **Any term** (press `/` to focus the box). Add more searches to compare them.
- Click any chart element (status, phase, sponsor type, year, enrollment band, sponsor, country, condition, matrix cell) to filter all charts and the table.
- **Share** copies a URL that restores the searches, tab, filters and sort. **CSV** exports exactly the rows in the current view. **Print / PDF** gives a clean one-page-per-section report.
- **Target search** (scope: *Target*, e.g. `PD-1`, `VEGF`, `HER2`, `CD19`): resolves the target to synonyms + drug names (Open Targets / ChEMBL with a bundled offline fallback), pulls candidates from ClinicalTrials.gov and labels every trial **Targets** / **Measures only** / **Unclear** with hover evidence and a filter. See [docs/TARGET_SEARCH.md](docs/TARGET_SEARCH.md); `npm run test:target` runs the classifier tests.
- Data is fetched live from the ClinicalTrials.gov API v2 (up to 20,000 studies per search; larger result sets are flagged as capped).
