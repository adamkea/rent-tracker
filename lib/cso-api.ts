// CSO PxStat API — fetches and transforms RIA02
// JSON-stat format: values are a flat array indexed by dimension order

const BASE_URL =
  "https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset";

export interface RentRecord {
  location: string;
  locationCode: string;
  year: number;
  bedrooms: string;
  propertyType: string;
  averageRent: number | null;
}

export interface RentDataset {
  records: RentRecord[];
  years: number[];
  locations: string[];
  bedroomCategories: string[];
  propertyTypes: string[];
  lastUpdated: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJsonStat(data: any): RentRecord[] {
  const dataset = data.dataset ?? data;
  const dims = dataset.dimension;
  const values: (number | null)[] = dataset.value;
  const dimIds: string[] = dataset.id;

  const dimCategories = dimIds.map((id: string) => {
    const cats = dims[id].category;
    return Object.keys(cats.index ?? cats.label);
  });

  const dimLabels = dimIds.map((id: string) => {
    const cats = dims[id].category;
    return cats.label as Record<string, string>;
  });

  // Strides for row-major traversal
  const strides: number[] = new Array(dimIds.length).fill(1);
  for (let i = dimIds.length - 2; i >= 0; i--) {
    strides[i] = strides[i + 1] * dimCategories[i + 1].length;
  }

  const get = (coords: number[], name: string) => {
    const pos = dimIds.indexOf(name);
    if (pos === -1) return null;
    const code = dimCategories[pos][coords[pos]];
    return { code, label: dimLabels[pos][code] ?? code };
  };

  // Find the year dimension by looking for 4-digit codes
  const findYearDimId = () => {
    return dimIds.find((id) =>
      dimCategories[dimIds.indexOf(id)][0]?.match(/^\d{4}$/)
    );
  };

  const yearDimId = "TLIST(A1)" in dims ? "TLIST(A1)" : findYearDimId() ?? "";

  const records: RentRecord[] = [];

  for (let idx = 0; idx < values.length; idx++) {
    const coords: number[] = [];
    let remaining = idx;
    for (let d = 0; d < dimIds.length; d++) {
      coords.push(Math.floor(remaining / strides[d]));
      remaining = remaining % strides[d];
    }

    const area = get(coords, "CL_AREA");
    const yearDim = yearDimId ? get(coords, yearDimId) : null;
    const beds = get(coords, "F_BEDS") ?? get(coords, "Bedrooms");
    const propType =
      get(coords, "PROPERTY_TYPE") ?? get(coords, "PropertyType");

    if (!area || !yearDim) continue;

    const rawValue = values[idx];
    records.push({
      location: area.label,
      locationCode: area.code,
      year: parseInt(yearDim.code, 10),
      bedrooms: beds?.label ?? "All",
      propertyType: propType?.label ?? "All",
      averageRent: rawValue === null || rawValue === 0 ? null : rawValue,
    });
  }

  return records;
}

export async function fetchRentData(): Promise<RentDataset> {
  const url = `${BASE_URL}/RIA02/JSON-stat/1.0/en`;
  const res = await fetch(url, { next: { revalidate: 86400 } });

  if (!res.ok) {
    throw new Error(`CSO API error: ${res.status} ${res.statusText}`);
  }

  const raw = await res.json();
  const records = parseJsonStat(raw);

  const years = Array.from(new Set(records.map((r) => r.year))).sort();
  const locations = Array.from(new Set(records.map((r) => r.location))).sort();
  const bedroomCategories = Array.from(new Set(records.map((r) => r.bedrooms)));
  const propertyTypes = Array.from(new Set(records.map((r) => r.propertyType)));

  return {
    records,
    years,
    locations,
    bedroomCategories,
    propertyTypes,
    lastUpdated: new Date().toISOString(),
  };
}

export function filterRecords(
  records: RentRecord[],
  filters: {
    location?: string;
    bedrooms?: string;
    propertyType?: string;
    year?: number;
  }
): RentRecord[] {
  return records.filter((r) => {
    if (filters.location && r.location !== filters.location) return false;
    if (filters.bedrooms && r.bedrooms !== filters.bedrooms) return false;
    if (filters.propertyType && r.propertyType !== filters.propertyType)
      return false;
    if (filters.year !== undefined && r.year !== filters.year) return false;
    return true;
  });
}
