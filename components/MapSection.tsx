"use client";

import { useState, useMemo } from "react";
import FilterBar from "./FilterBar";
import IrelandMap from "./IrelandMap";
import type { RentRecord } from "@/lib/cso-api";
import { filterRecords } from "@/lib/cso-api";

interface MapSectionProps {
  records: RentRecord[];
  latestYear: number;
}

export default function MapSection({ records, latestYear }: MapSectionProps) {
  const [bedrooms, setBedrooms] = useState("all");
  const [propertyType, setPropertyType] = useState("all");

  const countyData = useMemo(() => {
    const filtered = filterRecords(records, {
      bedrooms: bedrooms === "all" ? undefined : bedrooms,
      propertyType: propertyType === "all" ? undefined : propertyType,
      year: latestYear,
    });

    // Average across all matching records per location
    const byLocation: Record<string, number[]> = {};
    for (const r of filtered) {
      if (r.averageRent === null) continue;
      if (!byLocation[r.location]) byLocation[r.location] = [];
      byLocation[r.location].push(r.averageRent);
    }

    return Object.entries(byLocation)
      .map(([county, rents]) => ({
        county,
        averageRent: Math.round(rents.reduce((a, b) => a + b, 0) / rents.length),
      }))
      .sort((a, b) => a.county.localeCompare(b.county));
  }, [records, bedrooms, propertyType, latestYear]);

  return (
    <div className="flex flex-col gap-6">
      <FilterBar
        bedrooms={bedrooms}
        propertyType={propertyType}
        onBedroomsChange={setBedrooms}
        onPropertyTypeChange={setPropertyType}
      />
      <IrelandMap data={countyData} />
    </div>
  );
}
