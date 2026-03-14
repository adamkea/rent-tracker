# Irish Rent Tracker

A public web application that visualises real rental data across Ireland, letting you explore average rents by county, property type, and bedroom count — and check whether your own rent is fair against the market.

> **Data source**: Tracks *actual rents paid* (from RTB registrations), not advertised asking prices.

---

## Features

- **Interactive county map** — choropleth visualisation of average rents across all 26 counties
- **Filter by bedroom count & property type** — narrow results to what matters for your search
- **"Is my rent fair?" checker** — compare your rent against the local average
- **Historical trend charts** — rent movements from 2008 to present
- **National statistics** — year-on-year change, most/least expensive counties at a glance

---

## Data Sources

### Residential Tenancies Board (RTB) via CSO PxStat

All rent figures come from the **[CSO PxStat API](https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset)**, which publishes RTB rental registration data.

| Property | Detail |
|---|---|
| **Dataset** | [`RIA02`](https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/RIA02/JSON-stat/1.0/en) — RTB Average Monthly Rent |
| **Coverage** | 2008 – present, ~120 locations across Ireland |
| **Dimensions** | Year × Location × Bedroom count × Property type |
| **Format** | [JSON-stat](https://json-stat.org/) (values stored as a flat indexed array) |
| **Update cadence** | Quarterly |
| **Authentication** | None — fully public API |

The API response is in **JSON-stat format**, a compact statistical data format where all values are stored as a single flat array indexed by the Cartesian product of the dataset dimensions. The app uses the [`jsonstat`](https://www.npmjs.com/package/jsonstat) npm package plus a custom parser (`lib/cso-api.ts`) to decode this into normalised `RentRecord` objects.

#### How the data is consumed

```
CSO PxStat API (RIA02)
        │
        ▼
lib/cso-api.ts  →  fetchRentData()
  • Fetches JSON-stat response
  • Parses flat value array using dimension strides
  • Normalises into RentRecord[]
  • Treats 0/nil as null (insufficient data)
        │
        ▼
app/api/rent-data/route.ts  (cached server route)
  • Wraps fetchRentData() with Next.js ISR
  • 24-hour revalidation window
        │
        ▼
app/page.tsx  (server component)
  • Computes national averages, YoY change, county rankings
  • Passes records to client components
        │
        ▼
components/MapSection.tsx + IrelandMap.tsx
  • Client-side filtering by bedroom / property type
  • Choropleth colour scale per county
```

**Caching**: Data is fetched at build/request time with [Next.js ISR](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration) (`revalidate: 86400`). No API calls are made client-side; users always receive pre-processed data from the server.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Maps | [react-simple-maps](https://www.react-simple-maps.io/) |
| Data parsing | [jsonstat](https://www.npmjs.com/package/jsonstat) |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
npm run build   # production build
npm run lint    # ESLint
```

No environment variables or API keys are required — the CSO API is fully public.

---

## Project Structure

```
app/
  page.tsx                  # Homepage — stats, map, hero
  api/rent-data/route.ts    # Cached server endpoint
lib/
  cso-api.ts                # CSO API client & JSON-stat parser
  data-helpers.ts           # Currency formatting, slugs, % change
components/
  MapSection.tsx            # Map + filter container
  IrelandMap.tsx            # County choropleth (grid fallback)
  FilterBar.tsx             # Bedroom / property type selectors
```

---

## Data Attribution

Rent data is sourced from the **Central Statistics Office Ireland** under the [CSO Open Data Licence](https://www.cso.ie/en/media/csoie/aboutus/documents/csoopendatalicence.pdf), derived from **Residential Tenancies Board** registration data.

- CSO PxStat: [https://data.cso.ie](https://data.cso.ie)
- RTB Rent Index: [https://www.rtb.ie/rent-index](https://www.rtb.ie/rent-index)
- Dataset RIA02 direct link: [https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/RIA02/JSON-stat/1.0/en](https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/RIA02/JSON-stat/1.0/en)
