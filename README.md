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
- Data is fetched live from the ClinicalTrials.gov API v2 (up to 20,000 studies per search; larger result sets are flagged as capped).
