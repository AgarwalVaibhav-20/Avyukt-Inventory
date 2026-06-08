import React, { useEffect, useMemo, useState } from "react";
import { stockControlService } from "@/services/stockControlService";
import { Loader2, Package, Search, SlidersHorizontal, Warehouse } from "lucide-react";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const ItemWiseValuationView: React.FC = () => {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [warehouse, setWarehouse] = useState("All");
  const [includeZero, setIncludeZero] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockControlService.getValuationReport({
        search: searchTerm,
        category,
        warehouse,
        includeZero,
        sortBy: "totalValue",
        sortDir: "desc",
        limit: 500,
      });
      setReport(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load item-wise valuation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, category, warehouse, includeZero]);

  const categories = useMemo(() => {
    const values = new Set<string>();
    report.forEach((item) => item.category && values.add(item.category));
    return ["All", ...Array.from(values).sort()];
  }, [report]);

  const warehouses = useMemo(() => {
    const values = new Set<string>();
    report.forEach((item) => (item.warehouseNames || []).forEach((w: string) => values.add(w)));
    return ["All", ...Array.from(values).sort()];
  }, [report]);

  const filtered = useMemo(
    () =>
      report.filter((item) => {
        const nameMatch =
          item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = category === "All" || item.category === category;
        const warehouseMatch =
          warehouse === "All" || (item.warehouseNames || []).some((w: string) => w === warehouse);
        const zeroMatch = includeZero || Number(item.totalValuation || 0) !== 0;
        return nameMatch && categoryMatch && warehouseMatch && zeroMatch;
      }),
    [report, searchTerm, category, warehouse, includeZero],
  );

  const totalValue = filtered.reduce((sum, item) => sum + Number(item.totalValuation || 0), 0);
  const totalUnits = filtered.reduce((sum, item) => sum + Number(item.stock || 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Package className="text-blue-600" size={20} /> Item-wise Valuation
            </h2>
            <p className="text-sm text-slate-500">
              Breakdown of inventory value by SKU, category, and warehouse.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:w-[720px]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Items shown</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{filtered.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Stock units</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{totalUnits.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Total value</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{currency.format(totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search item or SKU"
              className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-sm outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            {warehouses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIncludeZero((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
              includeZero
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            <SlidersHorizontal size={16} />
            Include zero value
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="font-bold text-slate-800">Item-wise valuation table</h3>
          <p className="text-sm text-slate-500">Reads from the stock ledger, item pricing, and warehouse stock buckets.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Warehouses</th>
                <th className="px-6 py-4 text-right">Stock Qty</th>
                <th className="px-6 py-4 text-right">Unit Value</th>
                <th className="px-6 py-4 text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-3 animate-spin-slow text-blue-600" />
                    Calculating item-wise valuation...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No items found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.itemId} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{item.itemName}</p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{item.category}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {(item.warehouseNames || []).slice(0, 2).join(", ") || "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">{Number(item.stock || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{currency.format(Number(item.unitValuation || 0))}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-700">
                      {currency.format(Number(item.totalValuation || 0))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>
            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of{" "}
            <span className="font-semibold text-slate-900">{report.length}</span> items
          </p>
          <p>Interconnected with stock ledger, item master, and warehouse stock data.</p>
        </div>
      </div>
    </div>
  );
};

export default ItemWiseValuationView;
