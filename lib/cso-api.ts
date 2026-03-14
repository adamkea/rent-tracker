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

  // In CSO JSON-stat 1.0, the ordered dimension ID list lives inside `dimension`
  const dimIds: string[] = dims.id;

  const dimCategories = dimIds.map((id: string) => {
    const cats = dims[id].category;
    return Object.keys(cats.index ?? cats.label);
  });

  const dimLabels = dimIds.map((id: string) => {
    const cats = dims[id].category;
    return cats.label as Record<string, string>;
  });

  // Identify semantic dimensions by their label (dimension keys are opaque CSO codes)
  const dimLabelNames = dimIds.map((id: string) =>
    (dims[id].label as string).toLowerCase()
  );

  const findDimPos = (keywords: string[]) =>
    dimLabelNames.findIndex((l) => keywords.some((k) => l.includes(k)));

  const yearPos = findDimPos(["year", "tlist"]) !== -1
    ? findDimPos(["year", "tlist"])
    : dimIds.findIndex((id) => dimCategories[dimIds.indexOf(id)][0]?.match(/^\d{4}$/));

  const locationPos = findDimPos(["location", "area", "region", "county"]);
  const bedroomsPos = findDimPos(["bedroom", "bed"]);
  const propertyTypePos = findDimPos(["property type", "property"]);

  // Strides for row-major flat-index traversal
  const strides: number[] = new Array(dimIds.length).fill(1);
  for (let i = dimIds.length - 2; i >= 0; i--) {
    strides[i] = strides[i + 1] * dimCategories[i + 1].length;
  }

  const decode = (idx: number): number[] => {
    const coords: number[] = [];
    let remaining = idx;
    for (let d = 0; d < dimIds.length; d++) {
      coords.push(Math.floor(remaining / strides[d]));
      remaining = remaining % strides[d];
    }
    return coords;
  };

  const getAt = (coords: number[], pos: number) => {
    if (pos === -1) return null;
    const code = dimCategories[pos][coords[pos]];
    return { code, label: dimLabels[pos][code] ?? code };
  };

  const records: RentRecord[] = [];

  for (let idx = 0; idx < values.length; idx++) {
    const coords = decode(idx);

    const yearDim = getAt(coords, yearPos);
    const area = getAt(coords, locationPos);

    if (!yearDim || !area) continue;

    // Skip aggregate rows (year code that isn't a 4-digit number)
    if (!yearDim.code.match(/^\d{4}$/)) continue;

    const beds = getAt(coords, bedroomsPos);
    const propType = getAt(coords, propertyTypePos);

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

// All 26 counties of the Republic of Ireland (canonical names)
export const IRISH_COUNTIES = [
  "Carlow", "Cavan", "Clare", "Cork", "Donegal", "Dublin",
  "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim",
  "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan",
  "Offaly", "Roscommon", "Sligo", "Tipperary", "Waterford",
  "Westmeath", "Wexford", "Wicklow",
] as const;

const COUNTY_SET = new Set(IRISH_COUNTIES);

/**
 * Extracts the county name from a CSO location string and normalises it
 * to one of the 26 canonical Irish county names.
 * e.g. "Ballsbridge, Dublin 4" → "Dublin"
 *      "Kildare Town"          → "Kildare"
 *      "Galway City"           → "Galway"
 */
export function extractCounty(location: string): string {
  const commaIdx = location.lastIndexOf(",");
  // Take the relevant part: after the last comma if present, else the whole string
  const raw = commaIdx !== -1
    ? location.slice(commaIdx + 1).trim()
    : location.trim();

  // Strip trailing postal/district numbers (e.g. "Dublin 4" → "Dublin")
  const stripped = raw.replace(/\s+\d+[A-Za-z]*$/, "").trim();

  // If it directly matches a county, return it
  if (COUNTY_SET.has(stripped as typeof IRISH_COUNTIES[number])) return stripped;

  // Otherwise check if the raw/stripped string starts with a known county name
  for (const county of IRISH_COUNTIES) {
    if (stripped.startsWith(county) || raw.startsWith(county)) return county;
  }

  // Fallback: return stripped string as-is
  return stripped;
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
