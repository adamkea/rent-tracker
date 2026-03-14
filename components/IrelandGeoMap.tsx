"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/data-helpers";

// Maps GeoJSON feature names → CSO county names used in our data
const GEO_TO_CSO: Record<string, string> = {
  "Limerick City": "Limerick",
  "Limerick County": "Limerick",
  "North Tipperary": "Tipperary",
  "South Tipperary": "Tipperary",
  "Waterford City": "Waterford",
  "Waterford County": "Waterford",
  "Galway City": "Galway",
  "Galway County": "Galway",
  "Leitrim County": "Leitrim",
  "Mayo County": "Mayo",
  "Roscommon County": "Roscommon",
  "Sligo County": "Sligo",
  "Cavan County": "Cavan",
  "Donegal County": "Donegal",
  "Monaghan County": "Monaghan",
  "Carlow County": "Carlow",
  "Dublin City": "Dublin",
  "South Dublin": "Dublin",
  "Fingal": "Dublin",
  "Dún Laoghaire-Rathdown": "Dublin",
  "Kildare County": "Kildare",
  "Kilkenny County": "Kilkenny",
  "Laois County": "Laois",
  "Longford County": "Longford",
  "Louth County": "Louth",
  "Meath County": "Meath",
  "Offaly County": "Offaly",
  "Westmeath County": "Westmeath",
  "Wexford County": "Wexford",
  "Wicklow County": "Wicklow",
  "Clare County": "Clare",
  "Cork City": "Cork",
  "Cork County": "Cork",
  "Kerry County": "Kerry",
};

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

interface IrelandGeoMapProps {
  data: CountyRent[];
  selectedCounty: string | null;
}

function getRentColour(rent: number | null, min: number, max: number): string {
  if (rent === null) return "#e5e7eb";
  const ratio = Math.min((rent - min) / (max - min), 1);
  const idx = Math.floor(ratio * (COLOUR_SCALE.length - 1));
  return COLOUR_SCALE[idx];
}

export default function IrelandGeoMap({ data, selectedCounty }: IrelandGeoMapProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ name: string; rent: number | null } | null>(null);

  const rentByCounty = Object.fromEntries(data.map((d) => [d.county, d.averageRent]));

  const rents = data.map((d) => d.averageRent).filter((r): r is number => r !== null);
  const min = Math.min(...rents);
  const max = Math.max(...rents);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="relative w-full rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Tooltip */}
        {tooltip && (
          <div className="absolute top-3 left-3 z-10 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm pointer-events-none">
            <p className="font-semibold text-gray-800">{tooltip.name}</p>
            <p className="text-gray-500">
              {tooltip.rent ? `€${tooltip.rent.toLocaleString("en-IE")}/mo avg` : "No data"}
            </p>
          </div>
        )}

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [-8, 53.4],
            scale: 3200,
          }}
          width={500}
          height={580}
          style={{ width: "100%", height: "auto" }}
        >
          <ZoomableGroup>
            <Geographies geography="/ireland-counties.geojson">
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName: string = geo.properties.name;
                  const csoName = GEO_TO_CSO[geoName] ?? geoName;
                  const rent = rentByCounty[csoName] ?? null;
                  const isSelected = selectedCounty === csoName;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => router.push(`/county/${slugify(csoName)}`)}
                      onMouseEnter={() => setTooltip({ name: csoName, rent })}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill: getRentColour(rent, min, max),
                          stroke: isSelected ? "#1f2937" : "#ffffff",
                          strokeWidth: isSelected ? 2 : 0.5,
                          outline: "none",
                          cursor: "pointer",
                          filter: isSelected ? "drop-shadow(0 0 4px rgba(0,0,0,0.4))" : "none",
                        },
                        hover: {
                          fill: getRentColour(rent, min, max),
                          stroke: "#1f2937",
                          strokeWidth: 1.5,
                          outline: "none",
                          cursor: "pointer",
                          opacity: 0.85,
                        },
                        pressed: {
                          fill: getRentColour(rent, min, max),
                          stroke: "#1f2937",
                          strokeWidth: 1.5,
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
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
        Click a county to view detailed rent trends. Scroll to zoom, drag to pan.
      </p>
    </div>
  );
}
