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

const WORD_TO_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
};

/** Numeric sort key for a raw CSO bedroom label. */
function bedroomSortKey(category: string): number {
  const digit = category.match(/^(\d+)\s+bedroom/i);
  if (digit) return parseInt(digit[1]);
  const word = category.match(/^(\w+)\s+bedroom/i);
  if (word) return WORD_TO_NUM[word[1].toLowerCase()] ?? 999;
  const range = category.match(/^(\d+)\s+to\s+(\d+)/i);
  if (range) return (parseInt(range[1]) + parseInt(range[2])) / 2;
  if (/or\s+more/i.test(category)) return 5;
  return 999;
}

/** Convert a raw CSO bedroom label to a short display label. */
function bedroomDisplayLabel(category: string): string {
  // "2 bedrooms" / "1 bedroom"
  const digit = category.match(/^(\d+)\s+bedroom/i);
  if (digit) {
    const n = parseInt(digit[1]);
    return `${n} bed${n !== 1 ? "s" : ""}`;
  }
  // "Two bedrooms" / "One bedroom"
  const word = category.match(/^(\w+)\s+bedroom/i);
  if (word) {
    const n = WORD_TO_NUM[word[1].toLowerCase()];
    if (n !== undefined) return `${n} bed${n !== 1 ? "s" : ""}`;
  }
  // "1 to 2 bedrooms"
  const range = category.match(/^(\d+)\s+to\s+(\d+)\s+bedroom/i);
  if (range) return `${range[1]}-${range[2]} beds`;
  // "5 or more bedrooms"
  if (/or\s+more/i.test(category)) return "5+ beds";
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
      .filter((b) => !/^all(\s|$)/i.test(b))
      .sort((a, b) => bedroomSortKey(a) - bedroomSortKey(b));
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
