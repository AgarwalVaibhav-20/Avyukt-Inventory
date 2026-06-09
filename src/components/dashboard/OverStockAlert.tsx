import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  ArrowUpDown,
  Package,
  Warehouse,
  ChevronDown,
  Search,
  IndianRupee,
  Ban,
  Filter,
  AlertCircle,
  CalendarClock,
  BarChart3,
  Layers,
  Loader2,
} from "lucide-react";
import { fetchItems } from "@/store/slices/inventorySlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { InventoryItem } from "@/types";

type OverstockLevel = "severe" | "moderate" | "mild";
type Action = "Clearance" | "Purchase Freeze" | "Redistribute" | "Review";

interface OverstockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  warehouse: string;
  currentQty: number;
  maxStock: number;
  overstockThreshold: number;
  excessQty: number;
  unit: string;
  holdingCostPerUnit: number;
  daysOfSupply: number;
  level: OverstockLevel;
  lastSold: string;
  suggestedAction: Action;
}

const levelConfig: Record<OverstockLevel, { label: string; color: string; bg: string; dot: string; barColor: string }> = {
  severe: { label: "Severe", color: "text-red-600", bg: "bg-red-50 border border-red-200", dot: "bg-red-500", barColor: "bg-red-400" },
  moderate: { label: "Moderate", color: "text-orange-600", bg: "bg-orange-50 border border-orange-200", dot: "bg-orange-500", barColor: "bg-orange-400" },
  mild: { label: "Mild", color: "text-yellow-600", bg: "bg-yellow-50 border border-yellow-200", dot: "bg-yellow-500", barColor: "bg-yellow-400" },
};

const actionConfig: Record<Action, { color: string; bg: string }> = {
  Clearance: { color: "text-red-700", bg: "bg-red-100" },
  "Purchase Freeze": { color: "text-blue-700", bg: "bg-blue-100" },
  Redistribute: { color: "text-green-700", bg: "bg-green-100" },
  Review: { color: "text-gray-700", bg: "bg-gray-100" },
};

const categoryColors: Record<string, string> = {
  "Raw Material": "bg-blue-100 text-blue-700",
  Packaging: "bg-purple-100 text-purple-700",
  "Spare Parts": "bg-teal-100 text-teal-700",
  "Finished Goods": "bg-green-100 text-green-700",
};

type SortKey = "level" | "category" | "warehouse" | "excessQty" | "holdingCost" | "daysOfSupply";
type FilterLevel = "all" | OverstockLevel;

const levelOrder: Record<OverstockLevel, number> = { severe: 0, moderate: 1, mild: 2 };

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

const getItemStock = (item: InventoryItem) =>
  Number(item.stock ?? item.stocks?.reduce((total, stock) => total + Number(stock.quantity || 0), 0) ?? 0);

const getLevel = (currentQty: number, maxStock: number): OverstockLevel => {
  const ratio = maxStock > 0 ? currentQty / maxStock : 0;
  if (ratio >= 2) return "severe";
  if (ratio >= 1.5) return "moderate";
  return "mild";
};

const getSuggestedAction = (level: OverstockLevel, currentQty: number, maxStock: number): Action => {
  if (level === "severe") return "Purchase Freeze";
  if (currentQty > maxStock * 1.75) return "Clearance";
  if (level === "moderate") return "Redistribute";
  return "Review";
};

const toOverstockItem = (item: InventoryItem): OverstockItem => {
  const currentQty = getItemStock(item);
  const maxStock = Number(item.maximumStockLevel ?? 0);
  const excessQty = Math.max(0, currentQty - maxStock);
  const level = getLevel(currentQty, maxStock);
  const unitCost = Number(item.unitCost ?? item.unitPrice ?? 0);
  const monthlyConsumption = Math.max(1, Number(item.reorderQuantity || item.reorderLevel || maxStock * 0.25 || 1));
  const warehouseLabel = item.stocks?.length
    ? item.stocks.map(stock => String(stock.warehouseId || "Unassigned").slice(-6)).join(", ")
    : item.warehouseId
      ? String(item.warehouseId).slice(-6)
      : "Unassigned";
  const extra = item as InventoryItem & { updatedAt?: string; lastSold?: string };

  return {
    id: item.id,
    name: item.name || "Unnamed Item",
    sku: item.sku || item.itemCode || "-",
    category: item.category || "Uncategorized",
    warehouse: warehouseLabel,
    currentQty,
    maxStock,
    overstockThreshold: maxStock,
    excessQty,
    unit: item.stockUom || item.uom || "units",
    holdingCostPerUnit: unitCost * 0.02,
    daysOfSupply: Math.ceil((currentQty / monthlyConsumption) * 30),
    level,
    lastSold: extra.lastSold || extra.updatedAt || item.lastUpdated || "-",
    suggestedAction: getSuggestedAction(level, currentQty, maxStock),
  };
};

export default function OverstockAlerts() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.inventory);
  const [sortBy, setSortBy] = useState<SortKey>("level");
  const [filter, setFilter] = useState<FilterLevel>("all");
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("All");

  useEffect(() => {
    if (!items.length && !loading) {
      dispatch(fetchItems());
    }
  }, [dispatch, items.length, loading]);

  const overstockItems = useMemo(
    () =>
      items
        .filter((item) => {
          const maxStock = Number(item.maximumStockLevel ?? 0);
          return maxStock > 0 && getItemStock(item) > maxStock;
        })
        .map(toOverstockItem),
    [items],
  );

  const warehouses = ["All", ...Array.from(new Set(overstockItems.map(i => i.warehouse)))];

  const filtered = overstockItems
    .filter(item => filter === "all" || item.level === filter)
    .filter(item => selectedWarehouse === "All" || item.warehouse === selectedWarehouse)
    .filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "level") return levelOrder[a.level] - levelOrder[b.level];
      if (sortBy === "excessQty") return b.excessQty - a.excessQty;
      if (sortBy === "holdingCost") return (b.excessQty * b.holdingCostPerUnit) - (a.excessQty * a.holdingCostPerUnit);
      if (sortBy === "daysOfSupply") return b.daysOfSupply - a.daysOfSupply;
      if (sortBy === "category") return a.category.localeCompare(b.category);
      if (sortBy === "warehouse") return a.warehouse.localeCompare(b.warehouse);
      return 0;
    });

  const counts = {
    severe: overstockItems.filter(i => i.level === "severe").length,
    moderate: overstockItems.filter(i => i.level === "moderate").length,
    mild: overstockItems.filter(i => i.level === "mild").length,
  };

  const totalHoldingCost = overstockItems.reduce((s, i) => s + i.excessQty * i.holdingCostPerUnit, 0);
  const totalExcess = overstockItems.reduce((s, i) => s + i.excessQty, 0);

  const overstockPct = (item: OverstockItem) =>
    item.maxStock > 0 ? Math.min(200, Math.round((item.currentQty / item.maxStock) * 100)) : 0;

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">Overstock Alerts</h1>
              <p className="text-xs text-gray-500">Capital blockage & excess inventory monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{loading ? "Syncing inventory..." : "Live inventory data"}</span>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm">
              <Ban className="w-3.5 h-3.5" />
              Freeze Orders
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <IndianRupee className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Est. Holding Cost (Excess)</p>
              <p className="text-2xl font-bold text-gray-800">INR {fmt(totalHoldingCost)}</p>
              <p className="text-xs text-gray-400">across {overstockItems.length} overstocked items</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Excess Units</p>
              <p className="text-2xl font-bold text-gray-800">{fmt(totalExcess)}</p>
              <p className="text-xs text-gray-400">units above max thresholds</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(["severe", "moderate", "mild"] as OverstockLevel[]).map((lvl) => {
            const cfg = levelConfig[lvl];
            return (
              <button
                key={lvl}
                onClick={() => setFilter(filter === lvl ? "all" : lvl)}
                className={`rounded-xl p-4 text-left transition-all border-2 ${
                  filter === lvl ? cfg.bg + " border-current " + cfg.color : "bg-white border-gray-100 hover:border-gray-200"
                } shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${filter === lvl ? cfg.color : "text-gray-500"}`}>
                    {cfg.label}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                </div>
                <p className={`text-3xl font-bold ${filter === lvl ? cfg.color : "text-gray-800"}`}>{counts[lvl]}</p>
                <p className="text-xs text-gray-400 mt-1">items above max limit</p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
            />
          </div>

          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 cursor-pointer hover:border-gray-300 select-none">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <span>Sort: </span>
              <span className="font-medium capitalize">{sortBy.replace(/([A-Z])/g, " $1")}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
            </div>
            <select
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
            >
              {([
                ["level", "Level"],
                ["excessQty", "Excess Qty"],
                ["holdingCost", "Holding Cost"],
                ["daysOfSupply", "Days of Supply"],
                ["category", "Category"],
                ["warehouse", "Warehouse"],
              ] as [SortKey, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 cursor-pointer hover:border-gray-300 select-none">
              <Warehouse className="w-3.5 h-3.5 text-gray-400" />
              <span>{selectedWarehouse}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
            </div>
            <select
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              value={selectedWarehouse}
              onChange={e => setSelectedWarehouse(e.target.value)}
            >
              {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
            <Filter className="w-3.5 h-3.5" />
            <span>{filtered.length} of {overstockItems.length} items</span>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Warehouse</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock vs Max</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Holding Cost</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Days of Supply</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Level</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && overstockItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <Loader2 className="w-8 h-8 text-orange-400 mx-auto mb-3 animate-spin" />
                    <p className="text-gray-400 text-sm">Loading overstock items...</p>
                  </td>
                </tr>
              )}
              {filtered.map((item, idx) => {
                const pct = overstockPct(item);
                const cfg = levelConfig[item.level];
                const actCfg = actionConfig[item.suggestedAction];
                const holdingCost = item.excessQty * item.holdingCostPerUnit;
                const categoryClass = categoryColors[item.category] || "bg-gray-100 text-gray-700";
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/40"}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryClass}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Warehouse className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm">{item.warehouse}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 min-w-[170px]">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-gray-700">
                            {fmt(item.currentQty)} <span className="font-normal text-gray-400">{item.unit}</span>
                          </span>
                          <span className="text-gray-400">Max: {fmt(item.maxStock)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${cfg.barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <p className="text-xs text-red-500 mt-1 font-medium">+{fmt(item.excessQty)} excess {item.unit}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold text-gray-700">INR {fmt(holdingCost)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">INR {fmt(item.holdingCostPerUnit)}/unit</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-gray-400" />
                        <span className={`font-semibold ${item.daysOfSupply > 200 ? "text-red-600" : item.daysOfSupply > 120 ? "text-orange-600" : "text-gray-700"}`}>
                          {item.daysOfSupply}d
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Last sold: {item.lastSold}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${actCfg.bg} ${actCfg.color}`}>
                        {item.suggestedAction}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <BarChart3 className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No items match your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-start gap-2 text-xs text-gray-400 pb-4">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>Holding costs are estimated as 2% of unit cost times excess quantity. Days of supply uses current stock and configured reorder quantity where available. Figures shown in INR.</span>
        </div>
      </div>
    </div>
  );
}
