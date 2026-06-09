import React, { useEffect, useMemo, useState } from "react";
import { stockControlService } from "@/services/stockControlService";
import { authService } from "@/services/authService";
import {
  ArrowUpDown,
  Banknote,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Download,
  Filter,
  Loader2,
  Package,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Warehouse,
  Sparkles,
} from "lucide-react";

type Section = "overview" | "item" | "warehouse" | "closing" | "methods" | "recalc" | "cogs";

type Filters = {
  search: string;
  category: string;
  warehouse: string;
  itemType: string;
  includeZero: boolean;
  valueMin: string;
  valueMax: string;
  months: string;
  status: string;
  sortDir: "asc" | "desc";
};

const SECTIONS: Array<{ id: Section; label: string; icon: React.ElementType }> = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "item", label: "Item-wise", icon: Package },
  { id: "warehouse", label: "Warehouse-wise", icon: Warehouse },
  { id: "closing", label: "Closing Stock", icon: CalendarRange },
  { id: "methods", label: "Methods", icon: SlidersHorizontal },
  { id: "recalc", label: "Recalculation", icon: RefreshCcw },
  { id: "cogs", label: "COGS", icon: Banknote },
];

const DEFAULT_FILTERS: Filters = {
  search: "",
  category: "All",
  warehouse: "All",
  itemType: "all",
  includeZero: true,
  valueMin: "",
  valueMax: "",
  months: "12",
  status: "All",
  sortDir: "desc",
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const ValuationPill = ({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all border ${
      active
        ? "bg-slate-900 text-white border-slate-900 shadow-md"
        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
    }`}
  >
    {label}
  </button>
);

const InventoryValuationWorkspace: React.FC<{ initialSection?: Section }> = ({ initialSection = "item" }) => {
  const organisationId = authService.getOrganisationId();
  const [section, setSection] = useState<Section>(initialSection);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(true);

  const [itemReport, setItemReport] = useState<any[]>([]);
  const [warehouseReport, setWarehouseReport] = useState<any[]>([]);
  const [closingReport, setClosingReport] = useState<any[]>([]);
  const [cogsReport, setCogsReport] = useState<any[]>([]);
  const [valuationMethod, setValuationMethod] = useState<"FIFO" | "LIFO" | "Avg">("FIFO");
  const [recalcHistory, setRecalcHistory] = useState<any[]>([]);
  const [recalcStatus, setRecalcStatus] = useState<"idle" | "running" | "done">("idle");
  const [summary, setSummary] = useState<any>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1 });

  const loadCoreData = async () => {
    if (!organisationId) {
      setError("Organisation ID not found. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [items, warehouseData, closing, method, cogs] = await Promise.all([
        stockControlService.getValuationReport({
          search: filters.search,
          category: filters.category,
          warehouse: filters.warehouse,
          itemType: filters.itemType,
          includeZero: filters.includeZero,
          valueMin: filters.valueMin,
          valueMax: filters.valueMax,
          page: pagination.page,
          limit: pagination.limit,
          sortDir: filters.sortDir,
        }),
        stockControlService.getWarehouseValuation(),
        stockControlService.getClosingStockHistory(),
        stockControlService.getValuationMethod(),
        stockControlService.getCOGSData(),
      ]);

      setItemReport(items);
      setSummary((items as any).summary || {});
      setCategories((items as any).categories || []);
      setWarehouses((items as any).warehouses || []);
      setPagination((items as any).pagination || pagination);
      setWarehouseReport(warehouseData);
      setClosingReport(closing);
      setValuationMethod(method);
      setCogsReport(cogs);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load valuation data");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await stockControlService.recalculateCosts();
      setRecalcStatus("done");
      setRecalcHistory((prev) => [
        { id: `run-${Date.now()}`, date: response, method: valuationMethod, items: summary.totalItems || 0, durationMs: 0, status: "Success", by: "You", scope: "all" },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to recalculate");
      setRecalcStatus("idle");
    }
  };

  useEffect(() => {
    void loadCoreData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, filters.search, filters.category, filters.warehouse, filters.itemType, filters.includeZero, filters.valueMin, filters.valueMax, filters.sortDir, filters.months, filters.status]);

  const topItems = useMemo(() => [...itemReport].sort((a, b) => b.totalValuation - a.totalValuation).slice(0, 5), [itemReport]);
  const closingRows = useMemo(() => {
    const rows = [...closingReport];
    if (filters.status !== "All") {
      return rows.filter((row: any) => row.status === filters.status);
    }
    return rows;
  }, [closingReport, filters.status]);

  const saveMethod = async (method: "FIFO" | "LIFO" | "Avg") => {
    setSaving(true);
    setError(null);
    try {
      await stockControlService.setValuationMethod(method);
      setValuationMethod(method);
    } catch (err: any) {
      setError(err?.message || "Failed to save valuation method");
    } finally {
      setSaving(false);
    }
  };

  const updateFilter = (key: keyof Filters, value: string | boolean) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilters((prev) => ({ ...prev, [key]: value } as Filters));
  };

  const activeSummary = {
    totalValue: Number(summary.totalValue || summary.overallTotalValue || 0),
    lowStockItems: Number(summary.lowStockItems || 0),
    totalItems: Number(summary.totalItems || summary.totalSkus || 0),
    dailyChange: Number(summary.dailyChange || 0),
  };

  const renderOverview = () => (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total inventory value", value: currency.format(activeSummary.totalValue), tone: "from-slate-900 to-slate-700" },
            { label: "Items valued", value: activeSummary.totalItems.toLocaleString(), tone: "from-blue-700 to-blue-500" },
            { label: "Low stock items", value: activeSummary.lowStockItems.toLocaleString(), tone: "from-amber-700 to-amber-500" },
            { label: "Daily change", value: currency.format(activeSummary.dailyChange), tone: "from-emerald-700 to-emerald-500" },
          ].map((card) => (
            <div key={card.label} className={`rounded-3xl bg-gradient-to-br ${card.tone} p-5 text-white shadow-xl`}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">{card.label}</p>
              <p className="mt-3 text-2xl font-black tracking-tight">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Top items by value</h3>
              <p className="text-sm text-slate-500">Derived from stock ledger + item pricing.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {valuationMethod}
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {topItems.map((item) => (
              <div key={item.itemId || item.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.itemName || item.name}</p>
                  <p className="text-xs text-slate-500">{item.sku} Â- {item.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{currency.format(item.totalValuation || item.totalValue || 0)}</p>
                  <p className="text-xs text-slate-500">{Number(item.stock || item.qty || 0).toLocaleString()} units</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Method</h3>
          <p className="mt-1 text-sm text-slate-500">Choose the costing rule used across valuation reports.</p>
          <div className="mt-4 space-y-3">
            {(["FIFO", "LIFO", "Avg"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => void saveMethod(method)}
                disabled={saving}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                  valuationMethod === method
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{method === "Avg" ? "Weighted Average Cost" : method}</span>
                  {valuationMethod === method && <CheckCircle2 size={18} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Interconnections</h3>
          <p className="mt-1 text-sm text-slate-500">How valuation reads from other modules.</p>
          <div className="mt-4 space-y-3 text-sm">
            {[
              "Stock Ledger -> current stock position and movement history",
              "Item Pricing -> purchase price / standard cost baseline",
              "Warehouse Master -> location and asset allocation",
              "Dashboard & Reports -> summary feeds and closing stock",
            ].map((line) => (
              <div key={line} className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderItems = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Item-wise valuation</h3>
            <p className="text-sm text-slate-500">Filters follow the reference spec: search, item, category, warehouse, value range, and zero-value toggle.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ValuationPill label="Overview" active={section === "overview"} onClick={() => setSection("overview")} />
            <ValuationPill label="Item-wise" active={section === "item"} onClick={() => setSection("item")} />
            <ValuationPill label="Warehouse" active={section === "warehouse"} onClick={() => setSection("warehouse")} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Search item, SKU, or category"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm outline-none ring-0 focus:border-slate-400"
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => updateFilter("category", e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="All">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={filters.warehouse}
            onChange={(e) => updateFilter("warehouse", e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="All">All warehouses</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse} value={warehouse}>{warehouse}</option>
            ))}
          </select>
          <select
            value={filters.sortDir}
            onChange={(e) => updateFilter("sortDir", e.target.value as "asc" | "desc")}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="desc">Highest value first</option>
            <option value="asc">Lowest value first</option>
          </select>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={() => setAdvancedOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Filter size={16} />
            Advanced filters
            {advancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button type="button" onClick={() => updateFilter("includeZero", !filters.includeZero)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filters.includeZero ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
            Include zero stock
          </button>
        </div>

        {advancedOpen && (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              type="number"
              value={filters.valueMin}
              onChange={(e) => updateFilter("valueMin", e.target.value)}
              placeholder="Min value"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />
            <input
              type="number"
              value={filters.valueMax}
              onChange={(e) => updateFilter("valueMax", e.target.value)}
              placeholder="Max value"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />
            <select
              value={filters.itemType}
              onChange={(e) => updateFilter("itemType", e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="all">All item types</option>
              <option value="product">Finished Goods</option>
              <option value="rawMaterial">Raw Material</option>
            </select>
            <select
              value={filters.months}
              onChange={(e) => updateFilter("months", e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
              <option value="18">Last 18 months</option>
              <option value="24">Last 24 months</option>
            </select>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Valuation table</h3>
            <p className="text-sm text-slate-500">Current page {pagination.page} of {pagination.totalPages}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Download size={16} />
            Export ready
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Warehouse</th>
                <th className="px-6 py-4 text-right">Qty</th>
                <th className="px-6 py-4 text-right">Unit</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-2 animate-spin" size={20} />
                    Calculating valuation...
                  </td>
                </tr>
              ) : itemReport.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    No items matched the current filters.
                  </td>
                </tr>
              ) : (
                itemReport.map((item: any) => (
                  <tr key={item.itemId} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{item.itemName}</p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{item.category}</td>
                    <td className="px-6 py-4 text-slate-600">{(item.warehouseNames || []).join(", ") || "All warehouses"}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">{Number(item.stock || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{currency.format(Number(item.unitValuation || 0))}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">{currency.format(Number(item.totalValuation || 0))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderWarehouse = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Warehouse-wise valuation</h3>
            <p className="text-sm text-slate-500">Actual stock allocation per location.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {warehouseReport.length} warehouses
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {warehouseReport.map((warehouse) => {
              const max = Math.max(...warehouseReport.map((row) => Number(row.valuation || 0)), 1);
              const pct = Math.max(5, (Number(warehouse.valuation || 0) / max) * 100);
              return (
                <div key={warehouse.warehouseId} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{warehouse.warehouseName}</p>
                      <p className="text-xs text-slate-500">{warehouse.location || "No location"}</p>
                    </div>
                    <p className="text-right font-bold text-slate-900">{currency.format(Number(warehouse.valuation || 0))}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <h4 className="text-lg font-bold">Inventory valuation principle</h4>
            <p className="mt-2 text-sm text-slate-300">
              The valuation module reads current lot quantities and costs, then rolls them up into warehouse-level assets. This keeps the report aligned with stock ledger reality.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              <div className="rounded-2xl bg-white/5 px-4 py-3">1. Stock Ledger produces movement history</div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">2. Item Pricing provides the cost basis</div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">3. Warehouse breakdown is derived from stock lots</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClosing = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Closing stock report</h3>
            <p className="text-sm text-slate-500">Period-end stock value summary for accounting and audit review.</p>
          </div>
          <div className="flex gap-2">
            <ValuationPill label="Summary" active={section === "closing"} onClick={() => setSection("closing")} />
            <ValuationPill label="Recalculation" active={section === "recalc"} onClick={() => setSection("recalc")} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
            <option value="All">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Final">Final</option>
          </select>
          <select value={filters.months} onChange={(e) => updateFilter("months", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="18">18 months</option>
            <option value="24">24 months</option>
          </select>
          <select value={filters.warehouse} onChange={(e) => updateFilter("warehouse", e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
            <option value="All">All warehouses</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse} value={warehouse}>{warehouse}</option>
            ))}
          </select>
          <button type="button" onClick={() => updateFilter("includeZero", !filters.includeZero)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
            {filters.includeZero ? "Zero stock included" : "Zero stock hidden"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-6 py-4">Report date</th>
              <th className="px-6 py-4 text-right">Inventory value</th>
              <th className="px-6 py-4 text-center">SKUs</th>
              <th className="px-6 py-4 text-center">Method</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500"><Loader2 className="mx-auto mb-2 animate-spin" size={20} />Loading report...</td></tr>
            ) : closingRows.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">No closing stock reports match the selected filters.</td></tr>
            ) : (
              closingRows.map((row: any) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-4 font-medium text-slate-900">{row.date}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">{currency.format(Number(row.totalValue || row.value || 0))}</td>
                  <td className="px-6 py-4 text-center">{Number(row.itemCount || row.skus || 0)}</td>
                  <td className="px-6 py-4 text-center"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{row.method}</span></td>
                  <td className="px-6 py-4 text-center"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.status === "Final" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{row.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMethods = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Valuation methods</h3>
        <p className="mt-1 text-sm text-slate-500">Change the costing method and automatically re-align valuation outputs across the system.</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {[
            { id: "FIFO", title: "FIFO", desc: "Oldest costs are consumed first. Great for perishable or time-sensitive stock.", tone: "from-emerald-500 to-emerald-700" },
            { id: "LIFO", title: "LIFO", desc: "Newest costs are consumed first. Helpful for certain cost inflation scenarios.", tone: "from-amber-500 to-amber-700" },
            { id: "Avg", title: "Weighted Average", desc: "Smooths purchase price fluctuations and is widely used for reporting.", tone: "from-blue-500 to-blue-700" },
          ].map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => void saveMethod(method.id as "FIFO" | "LIFO" | "Avg")}
              className={`rounded-3xl border p-5 text-left transition-all ${
                valuationMethod === method.id
                  ? "border-slate-900 bg-slate-900 text-white shadow-xl"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <div className={`mb-4 inline-flex rounded-full bg-gradient-to-r ${method.tone} px-3 py-1 text-xs font-bold text-white`}>
                {method.title}
              </div>
              <p className="text-sm leading-6">{method.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRecalc = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Cost recalculation</h3>
            <p className="text-sm text-slate-500">Run retroactive cost refreshes when late landed costs or price changes arrive.</p>
          </div>
          <button
            type="button"
            disabled={recalcStatus === "running"}
            onClick={async () => {
              setRecalcStatus("running");
              await loadHistory();
            }}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw size={16} className={recalcStatus === "running" ? "animate-spin" : ""} />
            Run recalculation
          </button>
        </div>
        <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Recommended during off-peak hours. The job updates valuation summaries derived from ledger and pricing data.
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-center">Method</th>
              <th className="px-6 py-4 text-center">Items</th>
              <th className="px-6 py-4 text-center">Duration</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recalcHistory.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">No recalculation jobs yet.</td></tr>
            ) : (
              recalcHistory.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-4">{job.date}</td>
                  <td className="px-6 py-4 text-center font-medium">{job.method}</td>
                  <td className="px-6 py-4 text-center">{job.items}</td>
                  <td className="px-6 py-4 text-center">{Math.max(1, Math.round((job.durationMs || 120000) / 1000))}s</td>
                  <td className="px-6 py-4 text-center">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{job.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCOGS = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">COGS posting snapshot</h3>
        <p className="mt-1 text-sm text-slate-500">Outward movements and cost impact tied back to valuation.</p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Item</th>
              <th className="px-6 py-4 text-right">Qty</th>
              <th className="px-6 py-4 text-right">Unit cost</th>
              <th className="px-6 py-4 text-right">Total cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cogsReport.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">No COGS rows found.</td></tr>
            ) : (
              cogsReport.slice(0, 25).map((row: any) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-4">{String(row.date || "").slice(0, 10)}</td>
                  <td className="px-6 py-4">{row.itemName}</td>
                  <td className="px-6 py-4 text-right">{Number(row.quantity || 0)}</td>
                  <td className="px-6 py-4 text-right">{currency.format(Number(row.unitCost || 0))}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">{currency.format(Number(row.totalCost || 0))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 text-white shadow-2xl shadow-slate-200/50">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              <Sparkles size={14} />
              Inventory Valuation
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Ledger-aware valuation with filter-rich reporting</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              This workspace reads from stock lots, stock ledger movement history, and item pricing to produce item-wise valuation, warehouse allocation, closing stock, and cost recalculation views.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px] xl:grid-cols-2">
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">As of</p>
              <p className="mt-2 text-lg font-bold">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Method</p>
              <p className="mt-2 text-lg font-bold">{valuationMethod === "Avg" ? "Weighted Average" : valuationMethod}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setSection(entry.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                section === entry.id
                  ? "bg-slate-900 text-white shadow-lg"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon size={15} />
              {entry.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {section === "overview" && renderOverview()}
      {section === "item" && renderItems()}
      {section === "warehouse" && renderWarehouse()}
      {section === "closing" && renderClosing()}
      {section === "methods" && renderMethods()}
      {section === "recalc" && renderRecalc()}
      {section === "cogs" && renderCOGS()}

      {loading && (
        <div className="fixed bottom-6 right-6 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-300">
          <Loader2 className="mr-2 inline animate-spin" size={16} />
          Updating valuation data
        </div>
      )}
    </div>
  );
};

export default InventoryValuationWorkspace;
