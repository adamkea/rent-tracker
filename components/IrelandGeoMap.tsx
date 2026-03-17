"use client";

import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, Geometry, GeoJsonProperties } from "geojson";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/data-helpers";
import { getAreaCoords } from "@/lib/area-coords";

const WIDTH = 600;
const HEIGHT = 680;

type Coord = number[];
type Ring = Coord[];

/** Fix GeoJSON winding order — this file has clockwise rings which D3 interprets
 *  as "entire globe minus the county". Reversing makes them counter-clockwise. */
function rewindFeature(f: Feature<Geometry, GeoJsonProperties>): Feature<Geometry, GeoJsonProperties> {
  const geom = f.geometry;
  const rev = (ring: Ring): Ring => ring.slice().reverse();
  if (geom.type === "Polygon") {
    return { ...f, geometry: { ...geom, coordinates: geom.coordinates.map(rev) } };
  } else if (geom.type === "MultiPolygon") {
    return { ...f, geometry: { ...geom, coordinates: geom.coordinates.map((poly) => poly.map(rev)) } };
  }
  return f;
}

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

interface AreaRent {
  location: string;
  averageRent: number | null;
}

interface IrelandGeoMapProps {
  data: CountyRent[];
  selectedCounty: string | null;
  dublinAreaData?: AreaRent[];
  allAreaData?: AreaRent[];
}

export default function IrelandGeoMap({ data, selectedCounty, allAreaData }: IrelandGeoMapProps) {
  const router = useRouter();
  const [features, setFeatures] = useState<Feature<Geometry, GeoJsonProperties>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredArea, setHoveredArea] = useState<{ location: string; averageRent: number | null; x: number; y: number } | null>(null);

  useEffect(() => {
    fetch("/ireland-counties.geojson")
      .then((r) => { if (!r.ok) throw new Error("failed"); return r.json(); })
      .then((geo) => { setFeatures(geo.features.map(rewindFeature)); setLoading(false); })
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
  const { pathFn, projection, projectionReady } = useMemo(() => {
    if (features.length === 0) return { pathFn: null, projection: null, projectionReady: false };
    const collection = { type: "FeatureCollection" as const, features };
    const proj = geoMercator().fitSize([WIDTH, HEIGHT], collection);
    return { pathFn: geoPath(proj), projection: proj, projectionReady: true };
  }, [features]);

  // Project area coordinates onto the SVG
  const areaMarkers = useMemo(() => {
    if (!projection || !allAreaData) return [];
    return allAreaData
      .map((area) => {
        const coords = getAreaCoords(area.location);
        if (!coords) return null;
        const projected = projection(coords);
        if (!projected) return null;
        return { ...area, x: projected[0], y: projected[1] };
      })
      .filter((m): m is AreaRent & { x: number; y: number } => m !== null);
  }, [projection, allAreaData]);

  const areaRents = useMemo(
    () => (allAreaData ?? []).map((a) => a.averageRent).filter((r): r is number => r !== null),
    [allAreaData],
  );
  const areaMinRent = areaRents.length ? Math.min(...areaRents) : 0;
  const areaMaxRent = areaRents.length ? Math.max(...areaRents) : 1;

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

        {/* Hover tooltip — county or area */}
        {(hovered || hoveredArea) && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md px-3 py-2 text-sm">
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              {hoveredArea ? hoveredArea.location : hovered}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              {hoveredArea
                ? (hoveredArea.averageRent
                    ? `€${hoveredArea.averageRent.toLocaleString("en-IE")} / month`
                    : "No data")
                : (hoveredRent
                    ? `€${hoveredRent.toLocaleString("en-IE")} / month`
                    : "No data")}
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
            {/* Area markers — individual locations from the grid view */}
            {areaMarkers.map((marker) => (
              <circle
                key={marker.location}
                cx={marker.x}
                cy={marker.y}
                r={hoveredArea?.location === marker.location ? 6 : 4}
                fill={rentColour(marker.averageRent, areaMinRent, areaMaxRent)}
                stroke="#ffffff"
                strokeWidth={1.5}
                opacity={0.9}
                style={{ cursor: "pointer", transition: "r 0.15s" }}
                onClick={() => router.push(`/area/${slugify(marker.location)}`)}
                onMouseEnter={() => { setHoveredArea(marker); setHovered(null); }}
                onMouseLeave={() => setHoveredArea(null)}
              />
            ))}
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
