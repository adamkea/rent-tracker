"use client";

import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { Delaunay } from "d3-delaunay";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/data-helpers";
import { getAreaCoords } from "@/lib/area-coords";

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

function getRentColour(rent: number, min: number, max: number): string {
  const ratio = max === min ? 0.5 : Math.min((rent - min) / (max - min), 1);
  const idx = Math.floor(ratio * (COLOUR_SCALE.length - 1));
  return COLOUR_SCALE[idx];
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

export default function IrelandGeoMap({ allAreaData }: IrelandGeoMapProps) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoFeatures, setGeoFeatures] = useState<any[]>([]);
  const [geoError, setGeoError] = useState(false);
  const [tooltip, setTooltip] = useState<{
    name: string;
    rent: number | null;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    fetch("/ireland-counties.geojson")
      .then((r) => {
        if (!r.ok) throw new Error(`GeoJSON fetch failed: ${r.status}`);
        return r.json();
      })
      .then((d) => setGeoFeatures(d.features))
      .catch(() => setGeoError(true));
  }, []);

  // Build markers: areas that have both rent data and known coordinates
  const markers = useMemo(
    () =>
      (allAreaData ?? [])
        .filter((a) => a.averageRent !== null)
        .flatMap((a) => {
          const coords = getAreaCoords(a.location);
          if (!coords) return [];
          const xy = projection(coords);
          if (!xy) return [];
          return [{ location: a.location, averageRent: a.averageRent as number, xy: xy as [number, number] }];
        }),
    [allAreaData]
  );

  const { min, max } = useMemo(() => {
    const rents = markers.map((m) => m.averageRent);
    return {
      min: rents.length ? Math.min(...rents) : 0,
      max: rents.length ? Math.max(...rents) : 1,
    };
  }, [markers]);

  // Voronoi tessellation in screen space — only recomputes when markers change
  const voronoiPaths = useMemo(() => {
    const paths: string[] = [];
    if (markers.length >= 3) {
      const delaunay = Delaunay.from(markers.map((m) => m.xy));
      const voronoi = delaunay.voronoi([0, 0, WIDTH, HEIGHT]);
      for (let i = 0; i < markers.length; i++) {
        paths.push(voronoi.renderCell(i));
      }
    }
    return paths;
  }, [markers]);

  // Ireland outline paths for clipPath + border — only recomputes when GeoJSON loads
  const irelandPaths = useMemo(
    () => geoFeatures.map((f) => pathGen(f) ?? ""),
    [geoFeatures]
  );

  const geoReady = geoFeatures.length > 0;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="relative w-full min-h-[400px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {/* Loading / error overlay — shown while GeoJSON is being fetched */}
        {!geoReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 rounded-xl z-10">
            {geoError
              ? <p className="text-gray-400 text-sm">Could not load map data.</p>
              : <p className="text-gray-400 text-sm animate-pulse">Loading map…</p>
            }
          </div>
        )}
        {/* Tooltip */}
        {tooltip && (
          <div className="absolute top-3 left-3 z-10 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm pointer-events-none">
            <p className="font-semibold text-gray-800">{tooltip.name}</p>
            <p className="text-gray-500">
              {tooltip.rent
                ? `€${tooltip.rent.toLocaleString("en-IE")}/mo avg`
                : "No data"}
            </p>
            <p className="text-emerald-600 text-xs mt-0.5">Click for yearly trends →</p>
          </div>
        )}

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <defs>
            {/* Clip Voronoi cells to Ireland's outline */}
            <clipPath id="ireland-clip">
              {irelandPaths.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </clipPath>
          </defs>

          {/* Voronoi zones clipped to Ireland */}
          <g clipPath="url(#ireland-clip)">
            {markers.map((m, i) => (
              <path
                key={m.location}
                d={voronoiPaths[i] ?? ""}
                fill={getRentColour(m.averageRent, min, max)}
                stroke="#ffffff"
                strokeWidth={0.8}
                style={{ cursor: "pointer" }}
                onClick={() => router.push(`/area/${slugify(m.location)}`)}
                onMouseEnter={() =>
                  setTooltip({ name: m.location, rent: m.averageRent, x: m.xy[0], y: m.xy[1] })
                }
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </g>

          {/* Ireland county borders (outline only, on top for context) */}
          <g pointerEvents="none">
            {irelandPaths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#ffffff"
                strokeWidth={1}
                opacity={0.4}
              />
            ))}
          </g>

          {/* Small dot at each area centre for orientation */}
          <g pointerEvents="none">
            {markers.map((m) => (
              <circle
                key={m.location}
                cx={m.xy[0]}
                cy={m.xy[1]}
                r={2}
                fill="#ffffff"
                opacity={0.6}
              />
            ))}
          </g>
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
        Each zone is a rental area. Click any zone for yearly trends.
      </p>
    </div>
  );
}
