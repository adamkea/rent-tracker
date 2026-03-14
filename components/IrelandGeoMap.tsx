"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/data-helpers";
import { getAreaCoords } from "@/lib/area-coords";

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

// The 4 Dublin GeoJSON area names
const DUBLIN_GEO_AREAS = new Set([
  "Dublin City",
  "South Dublin",
  "Fingal",
  "Dún Laoghaire-Rathdown",
]);

// Maps Dublin postal district numbers → GeoJSON admin area names
const DUBLIN_DISTRICT_TO_GEO: Record<string, string> = {
  "1": "Dublin City",
  "2": "Dublin City",
  "3": "Dublin City",
  "4": "Dublin City",
  "5": "Fingal",
  "6": "Dublin City",
  "6W": "Dún Laoghaire-Rathdown",
  "7": "Dublin City",
  "8": "Dublin City",
  "9": "Dublin City",
  "10": "South Dublin",
  "11": "Fingal",
  "12": "South Dublin",
  "13": "Fingal",
  "14": "Dún Laoghaire-Rathdown",
  "15": "Fingal",
  "16": "Dún Laoghaire-Rathdown",
  "17": "Fingal",
  "18": "Dún Laoghaire-Rathdown",
  "20": "South Dublin",
  "22": "South Dublin",
  "24": "South Dublin",
};

function extractDublinDistrict(location: string): string | null {
  const match = location.match(/Dublin\s+(\d+[A-Za-z]*)(?:\s*$|,)/i);
  return match ? match[1].toUpperCase() : null;
}

function computeDublinAdminRents(
  dublinAreaData: { location: string; averageRent: number | null }[]
): Record<string, number> {
  const byAdmin: Record<string, number[]> = {};
  for (const area of dublinAreaData) {
    if (area.averageRent === null) continue;
    const district = extractDublinDistrict(area.location);
    const geoArea = district
      ? (DUBLIN_DISTRICT_TO_GEO[district] ?? "Dublin City")
      : "Dublin City";
    if (!byAdmin[geoArea]) byAdmin[geoArea] = [];
    byAdmin[geoArea].push(area.averageRent);
  }
  const result: Record<string, number> = {};
  for (const [name, rents] of Object.entries(byAdmin)) {
    result[name] = Math.round(rents.reduce((a, b) => a + b, 0) / rents.length);
  }
  return result;
}

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

function getRentColour(rent: number | null, min: number, max: number): string {
  if (rent === null) return "#e5e7eb";
  const ratio = max === min ? 0.5 : Math.min((rent - min) / (max - min), 1);
  const idx = Math.floor(ratio * (COLOUR_SCALE.length - 1));
  return COLOUR_SCALE[idx];
}

export default function IrelandGeoMap({
  data,
  selectedCounty,
  dublinAreaData,
  allAreaData,
}: IrelandGeoMapProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ name: string; rent: number | null } | null>(null);

  const rentByCounty = Object.fromEntries(data.map((d) => [d.county, d.averageRent]));

  // Per-admin-area rents for the 4 Dublin regions
  const dublinAdminRents =
    dublinAreaData && dublinAreaData.length > 0
      ? computeDublinAdminRents(dublinAreaData)
      : null;

  // Build full rent range for a consistent colour scale
  const allRents: number[] = data
    .map((d) => d.averageRent)
    .filter((r): r is number => r !== null);
  if (dublinAdminRents) allRents.push(...Object.values(dublinAdminRents));
  if (allAreaData) {
    allRents.push(
      ...allAreaData.map((a) => a.averageRent).filter((r): r is number => r !== null)
    );
  }
  const min = allRents.length > 0 ? Math.min(...allRents) : 0;
  const max = allRents.length > 0 ? Math.max(...allRents) : 1;

  // Build markers from allAreaData (areas that have known coordinates)
  const markers = (allAreaData ?? [])
    .filter((a) => a.averageRent !== null)
    .map((a) => {
      const coords = getAreaCoords(a.location);
      if (!coords) return null;
      return { location: a.location, averageRent: a.averageRent!, coords };
    })
    .filter((m): m is { location: string; averageRent: number; coords: [number, number] } => m !== null);

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
            {/* County / admin-area fill layer */}
            <Geographies geography="/ireland-counties.geojson">
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName: string = geo.properties.name;
                  const csoName = GEO_TO_CSO[geoName] ?? geoName;

                  const isDublinArea = DUBLIN_GEO_AREAS.has(geoName);
                  const rent =
                    isDublinArea && dublinAdminRents
                      ? (dublinAdminRents[geoName] ?? null)
                      : (rentByCounty[csoName] ?? null);

                  const isSelected = selectedCounty === csoName;
                  const tooltipName =
                    isDublinArea && dublinAdminRents ? geoName : csoName;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => router.push(`/county/${slugify(csoName)}`)}
                      onMouseEnter={() => setTooltip({ name: tooltipName, rent })}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill: getRentColour(rent, min, max),
                          stroke: isSelected ? "#1f2937" : "#ffffff",
                          strokeWidth: isSelected ? 2 : 0.5,
                          outline: "none",
                          cursor: "pointer",
                          filter: isSelected
                            ? "drop-shadow(0 0 4px rgba(0,0,0,0.4))"
                            : "none",
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

            {/* Area markers — one dot per CSO location with known coordinates */}
            {markers.map((m) => (
              <Marker
                key={m.location}
                coordinates={m.coords}
                onClick={() => router.push(`/area/${slugify(m.location)}`)}
                onMouseEnter={() => setTooltip({ name: m.location, rent: m.averageRent })}
                onMouseLeave={() => setTooltip(null)}
              >
                <circle
                  r={4}
                  fill={getRentColour(m.averageRent, min, max)}
                  stroke="#ffffff"
                  strokeWidth={1}
                  style={{ cursor: "pointer" }}
                />
              </Marker>
            ))}
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
        Dots show individual rental areas. Click a dot for yearly trends. Scroll to zoom, drag to pan.
      </p>
    </div>
  );
}
