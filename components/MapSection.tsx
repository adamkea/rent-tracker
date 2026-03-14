"use client";

import { useState, useMemo } from "react";
import FilterBar, { type ViewMode } from "./FilterBar";
import IrelandMap from "./IrelandMap";
import IrelandGeoMap from "./IrelandGeoMap";
import CountyAreasPanel from "./CountyAreasPanel";
import type { RentRecord } from "@/lib/cso-api";
import { filterRecords, extractCounty } from "@/lib/cso-api";

interface MapSectionProps {
  records: RentRecord[];
  latestYear: number;
}

export default function MapSection({ records, latestYear }: MapSectionProps) {
  const [bedrooms, setBedrooms] = useState("all");
  const [propertyType, setPropertyType] = useState("all");
  const [county, setCounty] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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

  // Areas for the selected county (for the panel below the map)
  const panelAreas = useMemo(() => {
    if (county === "all") return [];
    return allAreaData
      .filter((a) => extractCounty(a.location) === county)
      .sort((a, b) => a.location.localeCompare(b.location));
  }, [allAreaData, county]);

  const counties = useMemo(() => countyData.map((d) => d.county), [countyData]);

  const displayData = useMemo(() => {
    if (county === "all") return countyData;
    return countyData.filter((d) => d.county === county);
  }, [countyData, county]);

  // On the geo map, filter visible markers to the selected county (or show all)
  const visibleAreaData = useMemo(() => {
    if (county === "all") return allAreaData;
    return allAreaData.filter((a) => extractCounty(a.location) === county);
  }, [allAreaData, county]);

  const showPanel = county !== "all" && panelAreas.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <FilterBar
        bedrooms={bedrooms}
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
        <>
          <IrelandMap data={displayData} selectedCounty={county === "all" ? null : county} />
          {showPanel && <CountyAreasPanel county={county} areas={panelAreas} />}
        </>
      ) : (
        <>
          <IrelandGeoMap
            data={countyData}
            selectedCounty={county === "all" ? null : county}
            dublinAreaData={dublinAreaData}
            allAreaData={visibleAreaData}
          />
          {showPanel && <CountyAreasPanel county={county} areas={panelAreas} />}
        </>
      )}
    </div>
  );
}
