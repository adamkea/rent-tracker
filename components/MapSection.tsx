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

  // Per-location breakdown for the selected county (or Dublin for geo map colouring)
  const selectedCountyAreas = useMemo(() => {
    // We always compute Dublin areas for the geo map admin-area colouring.
    // We also compute areas for whichever county the user has selected.
    const targetCounties = new Set<string>(["Dublin"]);
    if (county !== "all") targetCounties.add(county);

    const byLocationByCounty: Record<string, Record<string, number[]>> = {};

    for (const r of filtered) {
      if (r.averageRent === null) continue;
      const c = extractCounty(r.location);
      if (!targetCounties.has(c)) continue;
      if (!byLocationByCounty[c]) byLocationByCounty[c] = {};
      if (!byLocationByCounty[c][r.location]) byLocationByCounty[c][r.location] = [];
      byLocationByCounty[c][r.location].push(r.averageRent);
    }

    const result: Record<string, { location: string; averageRent: number | null }[]> = {};
    for (const [c, byLoc] of Object.entries(byLocationByCounty)) {
      result[c] = Object.entries(byLoc)
        .map(([loc, rents]) => ({
          location: loc,
          averageRent: Math.round(rents.reduce((a, b) => a + b, 0) / rents.length),
        }))
        .sort((a, b) => a.location.localeCompare(b.location));
    }
    return result;
  }, [filtered, county]);

  const counties = useMemo(() => countyData.map((d) => d.county), [countyData]);

  const displayData = useMemo(() => {
    if (county === "all") return countyData;
    return countyData.filter((d) => d.county === county);
  }, [countyData, county]);

  // Dublin area data for geo map (always computed so 4 admin areas get individual colours)
  const dublinAreaData = selectedCountyAreas["Dublin"] ?? null;

  // Areas to show in the panel below the map (only when a specific county is selected)
  const panelAreas = county !== "all" ? (selectedCountyAreas[county] ?? []) : [];
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
          />
          {showPanel && <CountyAreasPanel county={county} areas={panelAreas} />}
        </>
      )}
    </div>
  );
}
