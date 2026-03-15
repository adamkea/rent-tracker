import { fetchRentData, filterRecords } from "@/lib/cso-api";
import { formatCurrency, calcPercentChange, formatPercent } from "@/lib/data-helpers";
import MapSection from "@/components/MapSection";
import Link from "next/link";

export const revalidate = 86400;

async function getStats() {
  try {
    const dataset = await fetchRentData();
    const { records, years } = dataset;

    const latestYear = years[years.length - 1];
    const prevYear = years[years.length - 2];

    // National average for the latest year (all types, all bedrooms)
    const latestAll = filterRecords(records, { year: latestYear });
    const prevAll = filterRecords(records, { year: prevYear });

    const avgRent = (recs: typeof records) => {
      const valid = recs.map((r) => r.averageRent).filter((r): r is number => r !== null);
      return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    };

    const nationalLatest = avgRent(latestAll);
    const nationalPrev = avgRent(prevAll);
    const yoyChange = calcPercentChange(nationalPrev, nationalLatest);

    // Most expensive county
    const byCounty = dataset.locations.map((loc) => {
      const recs = filterRecords(records, { location: loc, year: latestYear });
      return { county: loc, avg: avgRent(recs) };
    });
    const mostExpensive = byCounty
      .filter((c) => c.avg !== null)
      .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))[0];
    const leastExpensive = byCounty
      .filter((c) => c.avg !== null)
      .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0))[0];

    return {
      nationalAvg: nationalLatest,
      yoyChange,
      mostExpensive,
      leastExpensive,
      latestYear,
      // Only pass the latest year's records to the client — passing the full
      // multi-year dataset inflates the RSC/ISR payload beyond Vercel's 19 MB limit.
      records: filterRecords(records, { year: latestYear }),
    };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const stats = await getStats();
  const latestYear = stats?.latestYear ?? 2024;

  return (
    <main>
      {/* Hero */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
              RTB data · {latestYear}
            </span>
            <span className="text-gray-400 text-xs">Updates quarterly</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight max-w-2xl">
            Real Irish rent data,{" "}
            <span className="text-emerald-600">no spin</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl">
            Explore what people are actually paying — not asking prices. Filter
            by county, bedroom count, and property type. Check whether your own
            rent is fair.
          </p>
          <div className="flex gap-3 flex-wrap pt-2">
            <Link
              href="/checker"
              className="bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-emerald-700 transition-colors"
            >
              Is my rent fair? →
            </Link>
            <a
              href="#map"
              className="border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Explore the map
            </a>
          </div>
        </div>
      </section>

      {/* Key stats strip */}
      <section className="bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-emerald-200 text-xs uppercase tracking-wide font-medium mb-1">
                  National avg rent
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.nationalAvg)}
                  <span className="text-emerald-200 text-sm font-normal">/mo</span>
                </p>
              </div>
              <div>
                <p className="text-emerald-200 text-xs uppercase tracking-wide font-medium mb-1">
                  Year-on-year change
                </p>
                <p className="text-2xl font-bold">
                  {formatPercent(stats.yoyChange)}
                </p>
              </div>
              <div>
                <p className="text-emerald-200 text-xs uppercase tracking-wide font-medium mb-1">
                  Most expensive county
                </p>
                <p className="text-2xl font-bold truncate">
                  {stats.mostExpensive?.county ?? "—"}
                </p>
                <p className="text-emerald-200 text-sm">
                  {formatCurrency(stats.mostExpensive?.avg ?? null)}/mo
                </p>
              </div>
              <div>
                <p className="text-emerald-200 text-xs uppercase tracking-wide font-medium mb-1">
                  Most affordable county
                </p>
                <p className="text-2xl font-bold truncate">
                  {stats.leastExpensive?.county ?? "—"}
                </p>
                <p className="text-emerald-200 text-sm">
                  {formatCurrency(stats.leastExpensive?.avg ?? null)}/mo
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: "National avg rent", value: "€1,731/mo", sub: "Q2 2025 new tenancies" },
                { label: "Year-on-year", value: "+8.2%", sub: "National average" },
                { label: "Most expensive", value: "Dublin", sub: "Historically highest" },
                { label: "Highest YoY growth", value: "Leitrim +19%", sub: "Q4 2024" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-emerald-200 text-xs uppercase tracking-wide font-medium mb-1">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-emerald-200 text-sm">{s.sub}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Map section */}
      <section id="map" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              Average rent by county
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {latestYear} annual averages · RTB data via CSO PxStat · Click a county for trends
            </p>

            {stats ? (
              <MapSection records={stats.records} latestYear={latestYear} />
            ) : (
              <div className="w-full aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Could not load rent data. CSO API may be temporarily unavailable.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 flex flex-col gap-6">
            {/* Rent checker CTA */}
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2">
                Is your rent fair?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Enter your county, property type, and monthly rent to see how
                you compare to the RTB average.
              </p>
              <Link
                href="/checker"
                className="block text-center bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Check my rent →
              </Link>
            </div>

            {/* About the data */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                About the data
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>
                  Source: RTB Rent Index via{" "}
                  <a
                    href="https://data.cso.ie/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 underline"
                  >
                    CSO PxStat API
                  </a>
                </li>
                <li>Captures actual rents paid, not asking prices</li>
                <li>Annual averages from 2008 to {latestYear}</li>
                <li>~120 locations across Ireland</li>
                <li>Updates quarterly · cached for 24 hours</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
