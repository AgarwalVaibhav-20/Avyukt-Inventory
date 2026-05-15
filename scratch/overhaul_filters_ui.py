import os
import re

# --- Update FilterPanel.tsx ---
path_panel = r"c:\Users\agarw\Desktop\ACT Business\inventory\avyukt-inventary\src\components\common\FilterPanel.tsx"

new_panel_content = """import React, { useState } from "react";
import { X, Filter, ChevronRight, ChevronDown, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreeNodeData {
  label: string;
  value: string;
  children: TreeNodeData[];
}

const buildTree = (options: any[]): TreeNodeData[] => {
  const map: Record<string, TreeNodeData> = {};
  const roots: TreeNodeData[] = [];

  options.forEach((opt) => {
    map[opt.value] = { ...opt, children: [] };
  });

  options.forEach((opt) => {
    if (opt.parentId && map[opt.parentId]) {
      map[opt.parentId].children.push(map[opt.value]);
    } else {
      roots.push(map[opt.value]);
    }
  });

  return roots;
};

const TreeNode: React.FC<{
  node: TreeNodeData;
  selectedValue: string;
  onSelect: (val: string) => void;
  level: number;
}> = ({ node, selectedValue, onSelect, level }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer hover:bg-slate-50 text-sm transition-colors",
          selectedValue === node.value && "bg-blue-50 text-blue-700 font-medium"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node.value)}
      >
        {hasChildren ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-slate-200 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-4.5" />
        )}
        <span className="truncate">{node.label}</span>
      </div>
      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeNode 
              key={child.value} 
              node={child} 
              selectedValue={selectedValue} 
              onSelect={onSelect} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export interface FilterField {
  id: string;
  label: string;
  type: "text" | "select" | "date" | "number" | "range" | "multi-select" | "tree-select";
  placeholder?: string;
  options?: { label: string; value: string; parentId?: string | null }[];
  value?: any;
}

interface FilterPanelProps {
  fields: FilterField[];
  onFilterChange: (filters: Record<string, any>) => void;
  onReset?: () => void;
  className?: string;
  title?: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  showToggle?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  fields,
  onFilterChange,
  onReset,
  className = "",
  title = "Filters",
  isOpen = true,
  onToggle,
  showToggle = true,
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

  const activeFiltersCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v && v !== 'all';
  }).length;

  return (
    <div className={cn("flex flex-col", className)}>
      {showToggle && (
        <button
          onClick={() => {
            const newState = !showFilters;
            setShowFilters(newState);
            if (onToggle) onToggle(newState);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium shadow-sm transition-all active:scale-95"
        >
          <Filter className="w-4 h-4 text-slate-500" />
          {title}
          {activeFiltersCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-blue-600 rounded-full ring-2 ring-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
      )}

      {showFilters && (
        <div className={cn(
          "bg-white rounded-xl overflow-hidden flex flex-col border border-slate-200 shadow-xl",
          showToggle ? "mt-4" : ""
        )}>
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
            {activeFiltersCount > 0 && (
              <button 
                onClick={handleReset}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={10} />
                RESET
              </button>
            )}
          </div>

          <div className="p-4 space-y-5 max-h-[400px] overflow-y-auto custom-scrollbar">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {field.label}
                  </label>
                  {filters[field.id] && (
                    <button
                      onClick={() => handleRemoveFilter(field.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="relative">
                  {field.type === "text" && (
                    <input
                      type="text"
                      placeholder={field.placeholder || `Search ${field.label}...`}
                      value={filters[field.id] || ""}
                      onChange={(e) => handleFilterChange(field.id, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                    />
                  )}

                  {field.type === "select" && (
                    <div className="relative">
                      <select
                        value={filters[field.id] || ""}
                        onChange={(e) => handleFilterChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none transition-all cursor-pointer"
                      >
                        <option value="">All {field.label}s</option>
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  )}

                  {field.type === "date" && (
                    <input
                      type="date"
                      value={filters[field.id] || ""}
                      onChange={(e) => handleFilterChange(field.id, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                    />
                  )}

                  {field.type === "number" && (
                    <input
                      type="number"
                      placeholder={field.placeholder}
                      value={filters[field.id] || ""}
                      onChange={(e) => handleFilterChange(field.id, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                    />
                  )}

                  {field.type === "range" && (
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        placeholder="Min"
                        value={(filters[field.id]?.[0] as any) || ""}
                        onChange={(e) => {
                          const newRange = [e.target.value, filters[field.id]?.[1] || ""];
                          handleFilterChange(field.id, newRange);
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                      />
                      <span className="text-slate-300 text-xs">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={(filters[field.id]?.[1] as any) || ""}
                        onChange={(e) => {
                          const newRange = [filters[field.id]?.[0] || "", e.target.value];
                          handleFilterChange(field.id, newRange);
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                      />
                    </div>
                  )}

                  {field.type === "multi-select" && (
                    <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-lg custom-scrollbar">
                      {(!field.options || field.options.length === 0) ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-2">No options available</p>
                      ) : (
                        field.options.map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-blue-50 p-1.5 rounded-md transition-colors group">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={(filters[field.id] || []).includes(opt.value)}
                                onChange={(e) => {
                                  const currentValues = filters[field.id] || [];
                                  const newValues = e.target.checked
                                    ? [...currentValues, opt.value]
                                    : currentValues.filter((v: string) => v !== opt.value);
                                  handleFilterChange(field.id, newValues);
                                }}
                                className="peer h-4 w-4 appearance-none rounded border border-slate-300 bg-white transition-all checked:bg-blue-600 checked:border-blue-600 focus:outline-none"
                              />
                              <Check size={10} className="absolute text-white scale-0 transition-transform peer-checked:scale-100" />
                            </div>
                            <span className="truncate text-slate-600 group-hover:text-blue-700">{opt.label}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}

                  {field.type === "tree-select" && (
                    <div className="max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg custom-scrollbar">
                      {(!field.options || field.options.length === 0) ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-2">No hierarchy available</p>
                      ) : (
                        buildTree(field.options || []).map((node) => (
                          <TreeNode 
                            key={node.value} 
                            node={node} 
                            selectedValue={filters[field.id]} 
                            onSelect={(val) => handleFilterChange(field.id, val)}
                            level={0}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
             <p className="text-[10px] text-slate-400">Showing {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
"""

with open(path_panel, "w", encoding="utf-8") as f:
    f.write(new_panel_content)

# --- Update MasterCrud.tsx to fix Popover styling ---
path_master = r"c:\Users\agarw\Desktop\ACT Business\inventory\avyukt-inventary\src\components\admin\MasterCrud.tsx"
with open(path_master, "r", encoding="utf-8") as f:
    content = f.read()

# Adjust PopoverContent width and alignment
content = content.replace('<PopoverContent className="w-80 p-0" align="end">', '<PopoverContent className="w-72 p-0 bg-transparent border-none shadow-none" align="end">')

with open(path_master, "w", encoding="utf-8") as f:
    f.write(content)

print("Success")
