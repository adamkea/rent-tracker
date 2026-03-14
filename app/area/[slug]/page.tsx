import { fetchRentData, filterRecords } from "@/lib/cso-api";
import { formatCurrency, calcPercentChange, formatPercent, slugify } from "@/lib/data-helpers";
import AreaTrendsChart from "@/components/AreaTrendsChart";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dataset = await fetchRentData().catch(() => null);
  const location = dataset?.locations.find((l) => slugify(l) === slug);
  if (!location) return { title: "Area Not Found" };
  return { title: `${location} Rent Trends | Irish Rent Tracker` };
}

export default async function AreaTrendsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dataset = await fetchRentData().catch(() => null);

  if (!dataset) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Could not load rent data. CSO API may be temporarily unavailable.</p>
        <Link href="/" className="mt-4 inline-block text-emerald-600 underline">← Back to home</Link>
      </main>
    );
  }

  const location = dataset.locations.find((l) => slugify(l) === slug);
  if (!location) return notFound();

  // Get all-type, all-bedroom records for this location across all years
  const records = filterRecords(dataset.records, { location, bedrooms: "All", propertyType: "All" });

  // Build a year → average rent map
  const byYear: Record<number, number[]> = {};
  for (const r of records) {
    if (r.averageRent === null) continue;
    if (!byYear[r.year]) byYear[r.year] = [];
    byYear[r.year].push(r.averageRent);
  }

  const yearlyData = dataset.years
    .map((year) => {
      const rents = byYear[year];
      const avg = rents && rents.length > 0
        ? Math.round(rents.reduce((a, b) => a + b, 0) / rents.length)
        : null;
      return { year, avg };
    })
    .filter((d) => d.avg !== null) as { year: number; avg: number }[];

  // Attach year-on-year change
  const trendsData = yearlyData.map((d, i) => {
    const prev = i > 0 ? yearlyData[i - 1].avg : null;
    const change = calcPercentChange(prev, d.avg);
    return { ...d, change };
  });

  const latestEntry = trendsData[trendsData.length - 1];
  const firstEntry = trendsData[0];
  const totalChange = calcPercentChange(firstEntry?.avg ?? null, latestEntry?.avg ?? null);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mb-6">
        ← Back to map
      </Link>

      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{location}</h1>
      <p className="text-gray-500 text-sm mb-8">
        Rent price trends · {firstEntry?.year ?? ""}–{latestEntry?.year ?? ""} · RTB data via CSO PxStat
      </p>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide mb-1">Latest avg rent</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(latestEntry?.avg ?? null)}<span className="text-sm font-normal text-gray-500">/mo</span></p>
          <p className="text-xs text-gray-500 mt-0.5">{latestEntry?.year}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Year-on-year</p>
          <p className={`text-2xl font-bold ${latestEntry?.change != null && latestEntry.change > 0 ? "text-red-600" : latestEntry?.change != null && latestEntry.change < 0 ? "text-emerald-600" : "text-gray-900"}`}>
            {formatPercent(latestEntry?.change ?? null)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{(latestEntry?.year ?? 1) - 1}→{latestEntry?.year}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total change</p>
          <p className={`text-2xl font-bold ${totalChange != null && totalChange > 0 ? "text-red-600" : totalChange != null && totalChange < 0 ? "text-emerald-600" : "text-gray-900"}`}>
            {formatPercent(totalChange)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{firstEntry?.year}→{latestEntry?.year}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Average monthly rent by year</h2>
        <AreaTrendsChart data={trendsData} />
      </div>

      {/* Year-by-year table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Year</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Avg rent/mo</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Change</th>
            </tr>
          </thead>
          <tbody>
            {[...trendsData].reverse().map((row, i) => (
              <tr key={row.year} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-3 font-medium text-gray-900">{row.year}</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(row.avg)}</td>
                <td className={`px-4 py-3 text-right font-medium ${row.change == null ? "text-gray-400" : row.change > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {row.change == null ? "—" : formatPercent(row.change)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
