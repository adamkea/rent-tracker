# 🗺️ Irish Rent Tracker — Project Plan

A public-facing web app that visualises real Irish rental data from the RTB/CSO, letting anyone explore rent trends by county, property type, and bedroom count — and check whether their own rent is above or below the market average.

---

## Data Layer

**Primary source:** CSO PxStat API — no key required, free, updates quarterly.

### Endpoints

| Endpoint | Description |
|---|---|
| `RIA02` | Annual average rent by location, bedroom count, and property type (2008–2024). Backbone of the app. |
| `RIQ02` | Quarterly rent index data — more granular but structured differently. V2 candidate. |

**Base URL:** `https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/{TABLE}/JSON-stat/1.0/en`

### Caching Strategy

Fetch and cache data at build time using **Next.js ISR (Incremental Static Regeneration)** with a 24-hour revalidation window. A `/api/rent-data` route fetches, transforms, and caches server-side — keeping the app fast with no client-side API calls on load.

### Data Shape

- ~120 locations across Ireland
- 7 bedroom categories (1 bed → 4+ bed)
- 5 property types (apartment, detached, semi-d, terrace, other)
- 17 years of annual data (2008–2024)

---

## Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | ISR caching, API routes, fast deploys |
| Mapping | `react-simple-maps` + TopoJSON | Lightweight, no API key, easy to colour-code counties |
| Charts | Recharts | Simple, composable, works well with React |
| Styling | Tailwind CSS | Fast to build, clean |
| Deployment | Vercel | Free tier, ISR support, zero config |

---

## Features (V1)

### 1. Interactive County Map

A choropleth map of Ireland where each county is colour-coded by average rent for the currently selected filters (bedroom count, property type). Clicking a county drills down to that county's detail view. The colour scale updates live as filters change — so you can immediately see how a "2-bed apartment" map differs from a "3-bed house" map.

> Requires: Irish county TopoJSON (freely available from Ordnance Survey Ireland open data)

### 2. Rent Trend Charts

For any selected county, show a line chart of average rent from 2008 to present. Users can overlay multiple counties on the same chart for comparison (up to 3–4 at once). A second chart showing year-on-year percentage change reveals the boom, the COVID dip, and the current surge all in one view.

- `LineChart` with custom tooltip showing absolute rent + % change
- Multi-county overlay (up to 4 counties)
- YoY % change as a secondary chart

### 3. "Is My Rent Fair?" Checker

A simple form: select county, property type, bedrooms, enter monthly rent. The app compares against the latest RTB average and shows:

- Whether you're paying above or below the current market average (as a %)
- How your rent compares to the historical trend

> This is the shareable/viral hook — people will screenshot and post it.

---

## App Structure

```
/app
  page.tsx                  ← Homepage with map + filters
  /county/[slug]
    page.tsx                ← County detail: trend chart + breakdown
  /checker
    page.tsx                ← "Is my rent fair?" tool

/components
  IrelandMap.tsx            ← Choropleth county map
  RentTrendChart.tsx        ← Line chart, multi-county overlay
  CountyCompareChart.tsx    ← YoY % change chart
  RentChecker.tsx           ← Fair rent form + result
  FilterBar.tsx             ← Bedroom / property type selectors

/lib
  cso-api.ts                ← Fetch + transform RTB data from PxStat
  data-helpers.ts           ← Format currency, calculate % change etc
  ireland-geo.ts            ← County name → TopoJSON ID mapping

/app/api
  rent-data/route.ts        ← Cached server-side data endpoint
```

---

## Build Phases

### Phase 1 — Data Foundation (Day 1–2)
- Get the CSO API call working
- Parse JSON-stat format (values are in a flat array indexed by dimension order — use the `jsonstat` npm package)
- Transform into a clean shape: `{ location, year, bedrooms, propertyType, averageRent }`
- Write the ISR API route
- Validate data looks correct

### Phase 2 — Map (Day 3–4)
- Get Irish county TopoJSON rendering with `react-simple-maps`
- Wire up colour scale using rent data
- Add filter bar (bedrooms + property type)
- Make counties clickable → navigate to county detail

### Phase 3 — Charts (Day 5–6)
- Build county detail page with trend line chart
- Add multi-county comparison overlay
- Add YoY % change chart

### Phase 4 — Rent Checker (Day 7)
- Build checker form and result UI
- Lookup + percentage calculation against RTB average
- Handle missing data combinations gracefully

### Phase 5 — Polish + Deploy (Day 8–9)
- Mobile responsiveness
- Loading states and skeleton UI
- Empty state handling (some county/bedroom combinations have no data — show "not enough data" rather than €0)
- SEO metadata (title, description, og:image per county)
- Deploy to Vercel

---

## Known Gotchas

| Issue | Detail |
|---|---|
| **JSON-stat format** | CSO returns JSON-stat, not plain JSON. Values are a flat array — use the `jsonstat` npm package to reconstruct records. |
| **Nil returns** | Some location/bedroom/type combinations return `0` meaning insufficient data. Must be handled gracefully. |
| **Location code mapping** | API uses numeric location codes. Build a lookup table mapping codes → readable names → TopoJSON county IDs. |
| **Annual vs quarterly** | `RIA02` gives clean annual data. `RIQ02` is richer but structured differently. Start with annual for v1. |

---

## V2 Feature Ideas

- PDF scraping of quarterly LEA-level reports for sub-county granularity
- EirGrid carbon intensity overlay (combining another Irish open API)
- Shareable URLs for specific county/filter combinations (e.g. `/county/dublin?beds=2&type=apartment`)
- Email alert when new quarterly data drops
- Daft.ie asking price comparison (scrape or manual input) vs RTB actual rents

---

## Data Notes

- The RTB index captures **actual rents being paid**, not advertised asking prices — this is its key advantage over Daft.ie
- The national standardised average rent for new tenancies stood at €1,731 in Q2 2025 — €248/month higher than the average existing tenancy rent of €1,482
- The gap between new and existing tenancy rents is itself a compelling story to visualise
- In Q4 2024, Leitrim had 19% year-on-year growth in new tenancy rents — the highest in the country

---

## Resources

- [CSO PxStat API docs](https://data.cso.ie/)
- [RTB Rent Index data set](https://rtb.ie/data-insights/rtb-data-hub/rtb-esri-rent-index-data-set/)
- [RIA02 dataset on data.gov.ie](https://data.gov.ie/dataset/ria02-rtb-average-monthly-rent-report)
- [OSi TopoJSON / county boundaries](https://data-osi.opendata.arcgis.com/search?tags=boundaries)
- [react-simple-maps docs](https://www.react-simple-maps.io/)
- [jsonstat npm package](https://www.npmjs.com/package/jsonstat)
