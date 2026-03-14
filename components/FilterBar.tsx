"use client";

export const BEDROOM_OPTIONS = [
  { value: "all", label: "All bedrooms" },
  { value: "1 Bedroom", label: "1 bed" },
  { value: "2 Bedrooms", label: "2 beds" },
  { value: "3 Bedrooms", label: "3 beds" },
  { value: "4 Bedrooms", label: "4 beds" },
  { value: "5 or more Bedrooms", label: "5+ beds" },
];

export const PROPERTY_TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "Apartment", label: "Apartment" },
  { value: "Detached House", label: "Detached" },
  { value: "Semi-Detached House", label: "Semi-detached" },
  { value: "Terraced House", label: "Terraced" },
];

interface FilterBarProps {
  bedrooms: string;
  propertyType: string;
  onBedroomsChange: (value: string) => void;
  onPropertyTypeChange: (value: string) => void;
}

export default function FilterBar({
  bedrooms,
  propertyType,
  onBedroomsChange,
  onPropertyTypeChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <span className="text-sm font-medium text-gray-500">Filter by:</span>

      <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
        {BEDROOM_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onBedroomsChange(opt.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors border-r border-gray-200 last:border-r-0 ${
              bedrooms === opt.value
                ? "bg-emerald-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
        {PROPERTY_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPropertyTypeChange(opt.value)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors border-r border-gray-200 last:border-r-0 ${
              propertyType === opt.value
                ? "bg-emerald-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
