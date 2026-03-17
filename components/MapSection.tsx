"use client";

import { useState, useMemo } from "react";
import FilterBar, { type ViewMode } from "./FilterBar";
import IrelandGeoMap from "./IrelandGeoMap";
import CountyAreasPanel from "./CountyAreasPanel";
import type { RentRecord } from "@/lib/cso-api";
import { filterRecords, extractCounty } from "@/lib/cso-api";

interface MapSectionProps {
  records: RentRecord[];
  latestYear: number;
}

/** Convert a raw CSO bedroom label to a short display label. */
function bedroomDisplayLabel(category: string): string {
  const m = category.match(/^(\d+)\s+bedroom/i);
  if (m) return `${m[1]} bed${Number(m[1]) !== 1 ? "s" : ""}`;
  if (/5\s+or\s+more/i.test(category)) return "5+ beds";
  return category;
}

export default function MapSection({ records, latestYear }: MapSectionProps) {
  const [bedrooms, setBedrooms] = useState("all");
  const [propertyType, setPropertyType] = useState("all");
  const [county, setCounty] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Derive bedroom options directly from the records so values always match the data.
  const bedroomOptions = useMemo(() => {
    const cats = Array.from(new Set(records.map((r) => r.bedrooms)))
      .filter((b) => b !== "All")
      .sort((a, b) => {
        const na = parseInt(a) || 999;
        const nb = parseInt(b) || 999;
        return na - nb;
      });
    return [
      { value: "all", label: "All bedrooms" },
      ...cats.map((c) => ({ value: c, label: bedroomDisplayLabel(c) })),
    ];
  }, [records]);

  // Filtered records for the current year + bedroom/property type filters
  const filtered = useMemo(() => {
    return filterRecords(records, {
      bedrooms: bedrooms === "all" ? undefined : bedrooms,
      propertyType: propertyType === "all" ? undefined : propertyType,
      year: latestYear,
    });
  }, [records, bedrooms, propertyType, latestYear]);

  // County-level averages (one entry per county)
  const countyData = useMemo(() => {
    const byCounty: Record<string, number[]> = {};
    for (const r of filtered) {
      if (r.averageRent === null) continue;
      const c = extractCounty(r.location);
      if (!byCounty[c]) byCounty[c] = [];
      byCounty[c].push(r.averageRent);
    }
    return Object.entries(byCounty)
      .map(([c, rents]) => ({
        county: c,
        averageRent: Math.round(rents.reduce((a, b) => a + b, 0) / rents.length),
      }))
      .sort((a, b) => a.county.localeCompare(b.county));
  }, [filtered]);

  // Per-location averages for EVERY area (used for markers on the geo map)
  const allAreaData = useMemo(() => {
    const byLocation: Record<string, number[]> = {};
    for (const r of filtered) {
      if (r.averageRent === null) continue;
      if (!byLocation[r.location]) byLocation[r.location] = [];
      byLocation[r.location].push(r.averageRent);
    }
    return Object.entries(byLocation).map(([loc, rents]) => ({
      location: loc,
      averageRent: Math.round(rents.reduce((a, b) => a + b, 0) / rents.length),
    }));
  }, [filtered]);

  // Dublin area data for coloring the 4 Dublin admin areas on the geo map
  const dublinAreaData = useMemo(
    () => allAreaData.filter((a) => extractCounty(a.location) === "Dublin"),
    [allAreaData]
  );

  // Areas filtered by selected county (used for grid view and geo map panel)
  const filteredAreas = useMemo(() => {
    const areas = county === "all"
      ? allAreaData
      : allAreaData.filter((a) => extractCounty(a.location) === county);
    return areas.sort((a, b) => a.location.localeCompare(b.location));
  }, [allAreaData, county]);

  const counties = useMemo(() => countyData.map((d) => d.county), [countyData]);

  // On the geo map, filter visible markers to the selected county (or show all)
  const visibleAreaData = useMemo(() => {
    if (county === "all") return allAreaData;
    return allAreaData.filter((a) => extractCounty(a.location) === county);
  }, [allAreaData, county]);

  const showPanel = county !== "all" && filteredAreas.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <FilterBar
        bedrooms={bedrooms}
        bedroomOptions={bedroomOptions}
        propertyType={propertyType}
        county={county}
        counties={counties}
        viewMode={viewMode}
        onBedroomsChange={setBedrooms}
        onPropertyTypeChange={setPropertyType}
        onCountyChange={setCounty}
        onViewModeChange={setViewMode}
      />
      {viewMode === "grid" ? (
        <CountyAreasPanel county={county} areas={filteredAreas} />
      ) : (
        <>
          <IrelandGeoMap
            data={countyData}
            selectedCounty={county === "all" ? null : county}
            dublinAreaData={dublinAreaData}
            allAreaData={visibleAreaData}
          />
          {showPanel && <CountyAreasPanel county={county} areas={filteredAreas} />}
        </>
      )}
    </div>
  );
}
