import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Package,
  ShoppingCart,
  Warehouse,
  ChevronDown,
  Search,
  Bell,
  TrendingDown,
  Filter,
  Loader2,
} from "lucide-react";
import { fetchItems } from "@/store/slices/inventorySlice";
import { fetchWarehouses } from "@/store/slices/warehouseSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { InventoryItem } from "@/types";

type Urgency = "critical" | "high" | "medium";

interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  warehouse: string;
  currentQty: number;
  reorderLevel: number;
  minStock: number;
  unit: string;
  urgency: Urgency;
  lastOrdered: string;
  supplier: string;
}

const urgencyConfig: Record<Urgency, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: "Critical", color: "text-red-600", bg: "bg-red-50 border border-red-200", dot: "bg-red-500" },
  high: { label: "High", color: "text-orange-600", bg: "bg-orange-50 border border-orange-200", dot: "bg-orange-500" },
  medium: { label: "Medium", color: "text-yellow-600", bg: "bg-yellow-50 border border-yellow-200", dot: "bg-yellow-500" },
};

const categoryColors: Record<string, string> = {
  "Raw Material": "bg-blue-100 text-blue-700",
  "Packaging": "bg-purple-100 text-purple-700",
  "Spare Parts": "bg-teal-100 text-teal-700",
  "Finished Goods": "bg-green-100 text-green-700",
};

type SortKey = "urgency" | "category" | "warehouse" | "name";
type FilterKey = "all" | Urgency;

const urgencyOrder: Record<Urgency, number> = { critical: 0, high: 1, medium: 2 };

const getItemStock = (item: InventoryItem) =>
  Number(item.stock ?? item.stocks?.reduce((total, stock) => total + Number(stock.quantity || 0), 0) ?? 0);

const getUrgency = (currentQty: number, reorderLevel: number, minStock: number): Urgency => {
  if (currentQty <= minStock || currentQty === 0) return "critical";
  if (reorderLevel > 0 && currentQty <= reorderLevel * 0.5) return "high";
  return "medium";
};

const getWarehouseLabel = (warehouseId: unknown, warehouseNames: Map<string, string>) => {
  if (!warehouseId) return "Unassigned";
  if (typeof warehouseId === "object") {
    const warehouse = warehouseId as { _id?: string; id?: string; name?: string; warehouseName?: string };
    return warehouse.name || warehouse.warehouseName || warehouseNames.get(String(warehouse._id || warehouse.id)) || "Unassigned";
  }

  const id = String(warehouseId);
  return warehouseNames.get(id) || id;
};

const toStockItem = (item: InventoryItem, warehouseNames: Map<string, string>): StockItem => {
  const currentQty = getItemStock(item);
  const reorderLevel = Number(item.reorderLevel ?? 0);
  const minStock = Number(item.minimumStockLevel ?? reorderLevel);
  const warehouseLabel = item.stocks?.length
    ? item.stocks.map(stock => getWarehouseLabel(stock.warehouseId, warehouseNames)).join(", ")
    : item.warehouseId
      ? getWarehouseLabel(item.warehouseId, warehouseNames)
      : "Unassigned";
  const extra = item as InventoryItem & {
    supplier?: string;
    supplierName?: string;
    vendorName?: string;
    updatedAt?: string;
  };

  return {
    id: item.id,
    name: item.name || "Unnamed Item",
    sku: item.sku || item.itemCode || "-",
    category: item.category || "Uncategorized",
    warehouse: warehouseLabel,
    currentQty,
    reorderLevel,
    minStock,
    unit: item.stockUom || item.uom || "units",
    urgency: getUrgency(currentQty, reorderLevel, minStock),
    lastOrdered: extra.updatedAt || item.lastUpdated || "-",
    supplier: extra.supplierName || extra.vendorName || extra.supplier || item.brand || "-",
  };
};

export default function LowStockAlerts() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.inventory);
  const { warehouses: warehouseList, loading: warehouseLoading } = useAppSelector((state) => state.warehouse);
  const [sortBy, setSortBy] = useState<SortKey>("urgency");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("All");

  useEffect(() => {
    if (!items.length && !loading) {
      dispatch(fetchItems());
    }
  }, [dispatch, items.length, loading]);

  useEffect(() => {
    if (!warehouseList.length && !warehouseLoading) {
      dispatch(fetchWarehouses());
    }
  }, [dispatch, warehouseList.length, warehouseLoading]);

  const warehouseNames = useMemo(() => {
    const names = new Map<string, string>();
    warehouseList.forEach((warehouse) => {
      names.set(String(warehouse.id), warehouse.name);
      const rawWarehouse = warehouse as typeof warehouse & { _id?: string };
      if (rawWarehouse._id) names.set(String(rawWarehouse._id), warehouse.name);
    });
    return names;
  }, [warehouseList]);

  const lowStockItems = useMemo(
    () =>
      items
        .filter((item) => {
          const currentQty = getItemStock(item);
          const reorderLevel = Number(item.reorderLevel ?? 0);
          return currentQty === 0 || (reorderLevel > 0 && currentQty <= reorderLevel);
        })
        .map(item => toStockItem(item, warehouseNames)),
    [items, warehouseNames],
  );

  const warehouses = ["All", ...Array.from(new Set(lowStockItems.map(i => i.warehouse)))];

  const filtered = lowStockItems
    .filter(item => filter === "all" || item.urgency === filter)
    .filter(item => selectedWarehouse === "All" || item.warehouse === selectedWarehouse)
    .filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "urgency") return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (sortBy === "category") return a.category.localeCompare(b.category);
      if (sortBy === "warehouse") return a.warehouse.localeCompare(b.warehouse);
      return a.name.localeCompare(b.name);
    });

  const counts = {
    critical: lowStockItems.filter(i => i.urgency === "critical").length,
    high: lowStockItems.filter(i => i.urgency === "high").length,
    medium: lowStockItems.filter(i => i.urgency === "medium").length,
  };

  const stockPercent = (item: StockItem) =>
    item.reorderLevel > 0 ? Math.min(100, Math.round((item.currentQty / item.reorderLevel) * 100)) : 0;

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500 flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">Low Stock Alerts</h1>
              <p className="text-xs text-gray-500">Procurement early-warning dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{loading || warehouseLoading ? "Syncing inventory..." : "Live inventory data"}</span>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors shadow-sm">
              <Bell className="w-3.5 h-3.5" />
              Raise PO
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {(["critical", "high", "medium"] as Urgency[]).map((u) => {
            const cfg = urgencyConfig[u];
            return (
              <button
                key={u}
                onClick={() => setFilter(filter === u ? "all" : u)}
                className={`rounded-xl p-4 text-left transition-all border-2 ${
                  filter === u ? cfg.bg + " border-current " + cfg.color : "bg-white border-gray-100 hover:border-gray-200"
                } shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${filter === u ? cfg.color : "text-gray-500"}`}>
                    {cfg.label}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                </div>
                <p className={`text-3xl font-bold ${filter === u ? cfg.color : "text-gray-800"}`}>{counts[u]}</p>
                <p className="text-xs text-gray-400 mt-1">items below threshold</p>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items, SKU, supplier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 cursor-pointer hover:border-gray-300 select-none">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <span>Sort: </span>
              <span className="font-medium capitalize">{sortBy}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
            </div>
            <select
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
            >
              {(["urgency", "category", "warehouse", "name"] as SortKey[]).map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Warehouse Filter */}
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
            <span>{filtered.length} of {lowStockItems.length} items</span>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Warehouse</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock Level</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Urgency</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && lowStockItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Loader2 className="w-8 h-8 text-red-400 mx-auto mb-3 animate-spin" />
                    <p className="text-gray-400 text-sm">Loading low stock items...</p>
                  </td>
                </tr>
              )}
              {filtered.map((item, idx) => {
                const pct = stockPercent(item);
                const cfg = urgencyConfig[item.urgency];
                const barColor = item.urgency === "critical" ? "bg-red-400" : item.urgency === "high" ? "bg-orange-400" : "bg-yellow-400";
                const categoryClass = categoryColors[item.category] || "bg-gray-100 text-gray-700";
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/40"}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-gray-500" />
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
                    <td className="px-4 py-4 min-w-[160px]">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-gray-700">{item.currentQty} <span className="font-normal text-gray-400">{item.unit}</span></span>
                          <span className="text-gray-400">Reorder: {item.reorderLevel}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Min: {item.minStock} {item.unit}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{item.supplier}</td>
                    <td className="px-4 py-4">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap">
                        <ShoppingCart className="w-3 h-3" />
                        Raise PO
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <TrendingDown className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No items match your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
