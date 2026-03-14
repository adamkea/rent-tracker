"use client";

import { useState, useMemo } from "react";
import FilterBar, { type ViewMode } from "./FilterBar";
import IrelandMap from "./IrelandMap";
import IrelandGeoMap from "./IrelandGeoMap";
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

  const countyData = useMemo(() => {
    const filtered = filterRecords(records, {
      bedrooms: bedrooms === "all" ? undefined : bedrooms,
      propertyType: propertyType === "all" ? undefined : propertyType,
      year: latestYear,
    });

    // Average across all matching records per county
    const byLocation: Record<string, number[]> = {};
    for (const r of filtered) {
      if (r.averageRent === null) continue;
      const county = extractCounty(r.location);
      if (!byLocation[county]) byLocation[county] = [];
      byLocation[county].push(r.averageRent);
    }

    return Object.entries(byLocation)
      .map(([c, rents]) => ({
        county: c,
        averageRent: Math.round(rents.reduce((a, b) => a + b, 0) / rents.length),
      }))
      .sort((a, b) => a.county.localeCompare(b.county));
  }, [records, bedrooms, propertyType, latestYear]);

  const counties = useMemo(() => countyData.map((d) => d.county), [countyData]);

  const displayData = useMemo(() => {
    if (county === "all") return countyData;
    return countyData.filter((d) => d.county === county);
  }, [countyData, county]);

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
        <IrelandMap data={displayData} selectedCounty={county === "all" ? null : county} />
      ) : (
        <IrelandGeoMap data={countyData} selectedCounty={county === "all" ? null : county} />
      )}
    </div>
  );
}
