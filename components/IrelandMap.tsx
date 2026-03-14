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
  selectedCounty: string | null;
}

function getRentColour(rent: number | null, min: number, max: number): string {
  if (rent === null) return "#e5e7eb"; // gray-200 — no data
  const ratio = Math.min((rent - min) / (max - min), 1);
  const idx = Math.floor(ratio * (COLOUR_SCALE.length - 1));
  return COLOUR_SCALE[idx];
}

export default function IrelandMap({ data, selectedCounty }: IrelandMapProps) {
  const router = useRouter();

  const rents = data.map((d) => d.averageRent).filter((r): r is number => r !== null);
  const min = Math.min(...rents);
  const max = Math.max(...rents);

  const handleCountyClick = (county: string) => {
    router.push(`/county/${slugify(county)}`);
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-xl border border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-auto p-4">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
            {data.map((d) => {
              const isSelected = selectedCounty === d.county;
              return (
                <button
                  key={d.county}
                  onClick={() => handleCountyClick(d.county)}
                  title={d.averageRent ? `€${d.averageRent.toLocaleString("en-IE")}/mo` : "No data"}
                  className={`flex flex-col items-center justify-center p-1.5 rounded text-xs font-medium transition-transform hover:scale-105 hover:shadow-md cursor-pointer ${
                    isSelected ? "ring-2 ring-offset-1 ring-gray-800 scale-105 shadow-lg" : ""
                  }`}
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
              );
            })}
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
