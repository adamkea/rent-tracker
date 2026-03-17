"use client";

import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/data-helpers";

const WIDTH = 600;
const HEIGHT = 680;

/** Map a GeoJSON county name to the canonical county name used in app data. */
function geoNameToCounty(geoName: string): string {
  const specials: Record<string, string> = {
    "Dublin City": "Dublin",
    "South Dublin": "Dublin",
    Fingal: "Dublin",
    "Dún Laoghaire-Rathdown": "Dublin",
    "Galway City": "Galway",
    "Galway County": "Galway",
    "Limerick City": "Limerick",
    "Limerick County": "Limerick",
    "Waterford City": "Waterford",
    "Waterford County": "Waterford",
    "Cork City": "Cork",
    "Cork County": "Cork",
    "North Tipperary": "Tipperary",
    "South Tipperary": "Tipperary",
  };
  if (specials[geoName]) return specials[geoName];
  // Strip "County" suffix
  return geoName.replace(/\s+County$/, "").trim();
}

const COLOUR_STEPS = ["#d1fae5", "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857", "#065f46"];

function rentColour(rent: number | null, min: number, max: number): string {
  if (rent === null || max === min) return "#e5e7eb";
  const ratio = Math.min((rent - min) / (max - min), 1);
  const idx = Math.round(ratio * (COLOUR_STEPS.length - 1));
  return COLOUR_STEPS[idx];
}

interface CountyRent {
  county: string;
  averageRent: number | null;
}

interface IrelandGeoMapProps {
  data: CountyRent[];
  selectedCounty: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dublinAreaData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allAreaData?: any;
}

export default function IrelandGeoMap({ data, selectedCounty }: IrelandGeoMapProps) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    fetch("/ireland-counties.geojson")
      .then((r) => { if (!r.ok) throw new Error("failed"); return r.json(); })
      .then((geo) => { setFeatures(geo.features); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  // Build lookup: county name → average rent
  const rentMap = useMemo(() => {
    const m = new Map<string, number | null>();
    for (const d of data) m.set(d.county, d.averageRent);
    return m;
  }, [data]);

  const rents = useMemo(
    () => data.map((d) => d.averageRent).filter((r): r is number => r !== null),
    [data],
  );
  const minRent = rents.length ? Math.min(...rents) : 0;
  const maxRent = rents.length ? Math.max(...rents) : 1;

  // Compute projection AFTER features are loaded so fitSize works correctly
  const { pathFn, projectionReady } = useMemo(() => {
    if (features.length === 0) return { pathFn: null, projectionReady: false };
    const collection = { type: "FeatureCollection" as const, features };
    const proj = geoMercator().fitSize([WIDTH, HEIGHT], collection);
    return { pathFn: geoPath(proj), projectionReady: true };
  }, [features]);

  const hoveredCounty = hovered ? geoNameToCounty(hovered) : null;
  const hoveredRent = hoveredCounty ? (rentMap.get(hoveredCounty) ?? null) : null;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Map container */}
      <div className="relative w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden"
           style={{ aspectRatio: `${WIDTH}/${HEIGHT}` }}>

        {(loading || error) && (
          <div className="absolute inset-0 flex items-center justify-center">
            {error
              ? <p className="text-sm text-gray-400">Could not load map data.</p>
              : <p className="text-sm text-gray-400 animate-pulse">Loading map…</p>
            }
          </div>
        )}

        {/* Hover tooltip */}
        {hovered && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md px-3 py-2 text-sm">
            <p className="font-semibold text-gray-800 dark:text-gray-100">{hovered}</p>
            <p className="text-gray-500 dark:text-gray-400">
              {hoveredRent
                ? `€${hoveredRent.toLocaleString("en-IE")} / month`
                : "No data"}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">Click to explore →</p>
          </div>
        )}

        {projectionReady && pathFn && (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            {features.map((f, i) => {
              const geoName: string = f.properties?.name ?? "";
              const county = geoNameToCounty(geoName);
              const rent = rentMap.get(county) ?? null;
              const isSelected = selectedCounty ? county === selectedCounty : false;
              const isHovered = hovered === geoName;
              const d = pathFn(f) ?? "";

              return (
                <path
                  key={i}
                  d={d}
                  fill={rentColour(rent, minRent, maxRent)}
                  stroke="#ffffff"
                  strokeWidth={isSelected || isHovered ? 2 : 0.7}
                  opacity={selectedCounty && !isSelected ? 0.4 : 1}
                  style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                  onClick={() => router.push(`/county/${slugify(county)}`)}
                  onMouseEnter={() => setHovered(geoName)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Lower rent</span>
        <div className="flex flex-1 h-2 rounded-full overflow-hidden">
          {COLOUR_STEPS.map((c) => (
            <div key={c} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span>Higher rent</span>
      </div>
    </div>
  );
}
