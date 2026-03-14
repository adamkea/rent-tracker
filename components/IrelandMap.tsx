"use client";

import { useRouter } from "next/navigation";
import { slugify } from "@/lib/data-helpers";

// Colour scale: low rent → high rent
const COLOUR_SCALE = [
  "#d1fae5", // emerald-100
  "#6ee7b7", // emerald-300
  "#34d399", // emerald-400
  "#10b981", // emerald-500
  "#059669", // emerald-600
  "#047857", // emerald-700
  "#065f46", // emerald-800
];

interface CountyRent {
  county: string;
  averageRent: number | null;
}

interface IrelandMapProps {
  data: CountyRent[];
}

function getRentColour(rent: number | null, min: number, max: number): string {
  if (rent === null) return "#e5e7eb"; // gray-200 — no data
  const ratio = Math.min((rent - min) / (max - min), 1);
  const idx = Math.floor(ratio * (COLOUR_SCALE.length - 1));
  return COLOUR_SCALE[idx];
}

// Placeholder SVG map of Ireland showing counties as labelled boxes.
// Replace this component body with react-simple-maps + TopoJSON once the
// GeoJSON/TopoJSON file is sourced from OSi open data.
export default function IrelandMap({ data }: IrelandMapProps) {
  const router = useRouter();

  const rents = data.map((d) => d.averageRent).filter((r): r is number => r !== null);
  const min = Math.min(...rents);
  const max = Math.max(...rents);

  const handleCountyClick = (county: string) => {
    router.push(`/county/${slugify(county)}`);
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Map placeholder — swap this div for <ComposableMap> once TopoJSON is ready */}
      <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-xl border border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
        <div className="text-center px-6">
          <p className="text-gray-400 text-sm font-medium mb-1">
            Interactive county map
          </p>
          <p className="text-gray-400 text-xs">
            Add Irish county TopoJSON from{" "}
            <a
              href="https://data-osi.opendata.arcgis.com/search?tags=boundaries"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-emerald-600"
            >
              OSi Open Data
            </a>{" "}
            to enable the choropleth map.
          </p>
        </div>

        {/* County legend grid — functional, clickable even without TopoJSON */}
        <div className="absolute inset-0 overflow-auto p-4">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
            {data.map((d) => (
              <button
                key={d.county}
                onClick={() => handleCountyClick(d.county)}
                title={d.averageRent ? `€${d.averageRent.toLocaleString("en-IE")}/mo` : "No data"}
                className="flex flex-col items-center justify-center p-1.5 rounded text-xs font-medium transition-transform hover:scale-105 hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: getRentColour(d.averageRent, min, max),
                  color: d.averageRent && d.averageRent > (min + (max - min) * 0.5) ? "white" : "#1f2937",
                }}
              >
                <span className="truncate w-full text-center leading-tight">
                  {d.county}
                </span>
                {d.averageRent && (
                  <span className="opacity-80 text-[10px]">
                    €{Math.round(d.averageRent / 100) * 100}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
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
    </div>
  );
}
