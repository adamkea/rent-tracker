"use client";

import Link from "next/link";
import { slugify } from "@/lib/data-helpers";

const COLOUR_SCALE = [
  "#d1fae5", // emerald-100
  "#6ee7b7", // emerald-300
  "#34d399", // emerald-400
  "#10b981", // emerald-500
  "#059669", // emerald-600
  "#047857", // emerald-700
  "#065f46", // emerald-800
];

function getRentColour(rent: number | null, min: number, max: number): string {
  if (rent === null) return "#e5e7eb";
  const ratio = max === min ? 0.5 : Math.min((rent - min) / (max - min), 1);
  const idx = Math.floor(ratio * (COLOUR_SCALE.length - 1));
  return COLOUR_SCALE[idx];
}

function textColour(bgColour: string): string {
  const darkShades = ["#059669", "#047857", "#065f46"];
  return darkShades.includes(bgColour) ? "#ffffff" : "#1f2937";
}

interface CountyArea {
  location: string;
  averageRent: number | null;
}

interface CountyAreasPanelProps {
  county: string;
  areas: CountyArea[];
}

export default function CountyAreasPanel({ county, areas }: CountyAreasPanelProps) {
  const rents = areas
    .map((a) => a.averageRent)
    .filter((r): r is number => r !== null);
  const min = Math.min(...rents);
  const max = Math.max(...rents);

  const sorted = [...areas].sort((a, b) => a.location.localeCompare(b.location));

  return (
    <div className="mt-2">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {county === "all" ? "All Areas" : `${county} — Individual Area Prices`}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {sorted.map((area) => {
          const bg = getRentColour(area.averageRent, min, max);
          const fg = textColour(bg);
          return (
            <Link
              key={area.location}
              href={`/area/${slugify(area.location)}`}
              className="rounded-lg p-3 block transition-opacity hover:opacity-80"
              style={{ backgroundColor: bg }}
            >
              <p
                className="text-xs font-medium leading-tight"
                style={{ color: fg, opacity: 0.85 }}
              >
                {area.location}
              </p>
              <p className="text-sm font-bold mt-1" style={{ color: fg }}>
                {area.averageRent
                  ? `€${area.averageRent.toLocaleString("en-IE")}/mo`
                  : "No data"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
