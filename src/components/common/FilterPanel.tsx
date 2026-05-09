import React, { useState } from "react";
import { X, Filter } from "lucide-react";

export interface FilterField {
  id: string;
  label: string;
  type: "text" | "select" | "date" | "number" | "range";
  placeholder?: string;
  options?: { label: string; value: string }[];
  value?: string | string[] | number;
}

interface FilterPanelProps {
  fields: FilterField[];
  onFilterChange: (filters: Record<string, any>) => void;
  onReset?: () => void;
  className?: string;
  title?: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  fields,
  onFilterChange,
  onReset,
  className = "",
  title = "Filters",
  isOpen = true,
  onToggle,
}) => {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(isOpen);

  const handleFilterChange = (fieldId: string, value: any) => {
    const newFilters = { ...filters, [fieldId]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    if (onReset) {
      onReset();
    } else {
      onFilterChange({});
    }
  };

  const handleRemoveFilter = (fieldId: string) => {
    const newFilters = { ...filters };
    delete newFilters[fieldId];
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v).length;

  return (
    <div className={className}>
      {/* Filter Toggle Button */}
      <button
        onClick={() => {
          const newState = !showFilters;
          setShowFilters(newState);
          if (onToggle) onToggle(newState);
        }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
      >
        <Filter className="w-4 h-4" />
        {title}
        {activeFiltersCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>

                  {field.type === "text" && (
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={filters[field.id] || ""}
                      onChange={(e) =>
                        handleFilterChange(field.id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  )}

                  {field.type === "select" && (
                    <select
                      value={filters[field.id] || ""}
                      onChange={(e) =>
                        handleFilterChange(field.id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === "date" && (
                    <input
                      type="date"
                      value={filters[field.id] || ""}
                      onChange={(e) =>
                        handleFilterChange(field.id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  )}

                  {field.type === "number" && (
                    <input
                      type="number"
                      placeholder={field.placeholder}
                      value={filters[field.id] || ""}
                      onChange={(e) =>
                        handleFilterChange(field.id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  )}

                  {field.type === "range" && (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={
                          (filters[field.id]?.[0] as any) || ""
                        }
                        onChange={(e) => {
                          const newRange = [
                            e.target.value,
                            filters[field.id]?.[1] || "",
                          ];
                          handleFilterChange(field.id, newRange);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={
                          (filters[field.id]?.[1] as any) || ""
                        }
                        onChange={(e) => {
                          const newRange = [
                            filters[field.id]?.[0] || "",
                            e.target.value,
                          ];
                          handleFilterChange(field.id, newRange);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  )}
                </div>

                {filters[field.id] && (
                  <button
                    onClick={() => handleRemoveFilter(field.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title={`Remove ${field.label} filter`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleReset}
              className="mt-4 w-full py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
