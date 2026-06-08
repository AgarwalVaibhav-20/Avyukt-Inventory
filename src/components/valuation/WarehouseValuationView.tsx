import React, { useEffect, useMemo, useState } from "react";
import { stockControlService } from "@/services/stockControlService";
import { Loader2, Warehouse, Search } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#0f172a"];

const WarehouseValuationView: React.FC = () => {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockControlService.getWarehouseValuation();
      setReport(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load warehouse valuation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = useMemo(
    () =>
      report.filter((row) =>
        `${row.warehouseName} ${row.location}`.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [report, searchTerm],
  );

  const totalValue = filtered.reduce((sum, row) => sum + Number(row.valuation || 0), 0);
  const totalItems = filtered.reduce((sum, row) => sum + Number(row.itemCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Warehouse className="text-blue-600" size={20} /> Warehouse Valuation Report
            </h2>
            <p className="text-sm text-slate-500">
              Warehouse-wise value distribution, tied back to stock ledger and item pricing.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Warehouses</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{filtered.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Total value</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{currency.format(totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search warehouse or location"
              className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-sm outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={loadData}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Refresh data
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="font-bold text-slate-800">Warehouse valuation table</h3>
            <p className="text-sm text-slate-500">Each row is connected to the warehouse master and stock buckets.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Warehouse</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-center">SKUs Held</th>
                  <th className="px-6 py-4 text-center">Quantity</th>
                  <th className="px-6 py-4 text-right">Avg Unit Value</th>
                  <th className="px-6 py-4 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      <Loader2 className="mx-auto mb-3 animate-spin-slow text-blue-600" />
                      Loading warehouse valuation...
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
                      No warehouses found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.warehouseId} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-800">{row.warehouseName}</td>
                      <td className="px-6 py-4 text-slate-600">{row.location}</td>
                      <td className="px-6 py-4 text-center text-slate-700">{row.itemCount}</td>
                      <td className="px-6 py-4 text-center text-slate-700">{Number(row.quantity || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-slate-600">{currency.format(Number(row.avgUnitValue || 0))}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-700">{currency.format(Number(row.valuation || 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
            <p>
              Showing <span className="font-semibold text-slate-900">{filtered.length}</span> warehouses
            </p>
            <p>
              Total SKUs: <span className="font-semibold text-slate-900">{totalItems.toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-slate-800">Value Distribution</h3>
          <div className="h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-slate-500">
                <Loader2 className="animate-spin-slow text-slate-400" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filtered}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="valuation"
                    nameKey="warehouseName"
                  >
                    {filtered.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => currency.format(val)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Warehouse valuation feeds the dashboard summary and closing stock reports.
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseValuationView;
