"use client";

import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/data-helpers";

const WIDTH = 500;
const HEIGHT = 580;

const projection = geoMercator()
  .center([-8, 53.4])
  .scale(3200)
  .translate([WIDTH / 2, HEIGHT / 2]);

const pathGen = geoPath(projection);

const COLOUR_SCALE = [
  "#d1fae5",
  "#6ee7b7",
  "#34d399",
  "#10b981",
  "#059669",
  "#047857",
  "#065f46",
];

function getRentColour(rent: number | null, min: number, max: number): string {
  if (rent === null) return "#e5e7eb";
  const ratio = max === min ? 0.5 : Math.min((rent - min) / (max - min), 1);
  const idx = Math.floor(ratio * (COLOUR_SCALE.length - 1));
  return COLOUR_SCALE[idx];
}

/** Normalise county name for fuzzy matching (strip City/County suffix, lowercase) */
function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(city|county|north|south|east|west)$/g, "")
    .trim();
}

interface CountyRent {
  county: string;
  averageRent: number | null;
}

interface AreaRent {
  location: string;
  averageRent: number | null;
}

interface IrelandGeoMapProps {
  data: CountyRent[];
  selectedCounty: string | null;
  dublinAreaData?: AreaRent[] | null;
  allAreaData?: AreaRent[] | null;
}

export default function IrelandGeoMap({ data, selectedCounty }: IrelandGeoMapProps) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoFeatures, setGeoFeatures] = useState<any[]>([]);
  const [geoError, setGeoError] = useState(false);
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);

  useEffect(() => {
    fetch("/ireland-counties.geojson")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((geo) => setGeoFeatures(geo.features))
      .catch(() => setGeoError(true));
  }, []);

  // Build a map from normalised county name → rent value
  const rentByCounty = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const d of data) {
      map.set(normaliseName(d.county), d.averageRent);
    }
    return map;
  }, [data]);

  const rents = useMemo(
    () => data.map((d) => d.averageRent).filter((r): r is number => r !== null),
    [data]
  );
  const min = rents.length ? Math.min(...rents) : 0;
  const max = rents.length ? Math.max(...rents) : 1;

  const geoReady = geoFeatures.length > 0;

  // Find tooltip rent for hovered county
  const tooltipRent = hoveredCounty
    ? rentByCounty.get(normaliseName(hoveredCounty)) ?? null
    : null;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="relative w-full min-h-[400px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {!geoReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 rounded-xl z-10">
            {geoError
              ? <p className="text-gray-400 text-sm">Could not load map data.</p>
              : <p className="text-gray-400 text-sm animate-pulse">Loading map…</p>
            }
          </div>
        )}

        {/* Tooltip */}
        {hoveredCounty && (
          <div className="absolute top-3 left-3 z-10 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm pointer-events-none">
            <p className="font-semibold text-gray-800">{hoveredCounty}</p>
            <p className="text-gray-500">
              {tooltipRent
                ? `€${tooltipRent.toLocaleString("en-IE")}/mo avg`
                : "No data"}
            </p>
            <p className="text-emerald-600 text-xs mt-0.5">Click for details →</p>
          </div>
        )}

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          {geoFeatures.map((f, i) => {
            const name: string = f.properties?.name ?? "";
            const rent = rentByCounty.get(normaliseName(name)) ?? null;
            const isSelected = selectedCounty
              ? normaliseName(name) === normaliseName(selectedCounty)
              : false;
            const isHovered = hoveredCounty === name;
            const d = pathGen(f) ?? "";
            return (
              <path
                key={i}
                d={d}
                fill={getRentColour(rent, min, max)}
                stroke="#ffffff"
                strokeWidth={isSelected || isHovered ? 2 : 0.8}
                opacity={selectedCounty && !isSelected ? 0.5 : 1}
                style={{ cursor: "pointer" }}
                onClick={() => router.push(`/county/${slugify(name)}`)}
                onMouseEnter={() => setHoveredCounty(name)}
                onMouseLeave={() => setHoveredCounty(null)}
              />
            );
          })}
        </svg>
      </div>

      {/* Colour legend */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Lower rent</span>
        <div className="flex flex-1 h-2 rounded-full overflow-hidden">
          {COLOUR_SCALE.map((c) => (
            <div key={c} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span>Higher rent</span>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Each county is coloured by average rent. Click for details.
      </p>
    </div>
  );
}
