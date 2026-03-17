"use client";

export const PROPERTY_TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "Apartment", label: "Apartment" },
  { value: "Detached House", label: "Detached" },
  { value: "Semi-Detached House", label: "Semi-detached" },
  { value: "Terraced House", label: "Terraced" },
];

export type ViewMode = "grid" | "map";

interface FilterBarProps {
  bedrooms: string;
  bedroomOptions: { value: string; label: string }[];
  propertyType: string;
  county: string;
  counties: string[];
  viewMode: ViewMode;
  onBedroomsChange: (value: string) => void;
  onPropertyTypeChange: (value: string) => void;
  onCountyChange: (value: string) => void;
  onViewModeChange: (value: ViewMode) => void;
}

export default function FilterBar({
  bedrooms,
  bedroomOptions,
  propertyType,
  county,
  counties,
  viewMode,
  onBedroomsChange,
  onPropertyTypeChange,
  onCountyChange,
  onViewModeChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* View toggle + county filter row */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        {/* View mode toggle */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 border-r border-gray-200 dark:border-gray-700 ${
              viewMode === "grid"
                ? "bg-emerald-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Grid
          </button>
          <button
            onClick={() => onViewModeChange("map")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === "map"
                ? "bg-emerald-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Map
          </button>
        </div>

        {/* County filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="county-filter" className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
            County:
          </label>
          <select
            id="county-filter"
            value={county}
            onChange={(e) => onCountyChange(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bedroom & property type filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Filter by:</span>

        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          {bedroomOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onBedroomsChange(opt.value)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${
                bedrooms === opt.value
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          {PROPERTY_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onPropertyTypeChange(opt.value)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${
                propertyType === opt.value
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
