import React, { useEffect, useMemo, useState } from "react";
import { stockControlService } from "@/services/stockControlService";
import { BarChart3, Loader2, TrendingUp } from "lucide-react";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const ValuationAnalysisView: React.FC = () => {
  const [report, setReport] = useState<any[]>([]);
  const [method, setMethod] = useState<"FIFO" | "LIFO" | "Avg">("FIFO");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadInitial();
  }, []);

  const loadInitial = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentMethod = await stockControlService.getValuationMethod();
      setMethod(currentMethod);
      const data = await stockControlService.getValuationReport({
        sortBy: "totalValue",
        sortDir: "desc",
        limit: 100,
      });
      setReport(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load valuation analysis");
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockControlService.getValuationReport({
        sortBy: "totalValue",
        sortDir: "desc",
        limit: 100,
      });
      setReport(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load valuation analysis");
    } finally {
      setLoading(false);
    }
  };

  const applyMethod = async (nextMethod: "FIFO" | "LIFO" | "Avg") => {
    setLoading(true);
    setError(null);
    try {
      await stockControlService.setValuationMethod(nextMethod);
      setMethod(nextMethod);
      const data = await stockControlService.getValuationReport({
        sortBy: "totalValue",
        sortDir: "desc",
        limit: 100,
      });
      setReport(data);
    } catch (err: any) {
      setError(err?.message || "Failed to update valuation method");
    } finally {
      setLoading(false);
    }
  };

  const totalValuation = useMemo(
    () => report.reduce((sum, item) => sum + Number(item.totalValuation || 0), 0),
    [report],
  );

  const topItem = report[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <BarChart3 className="text-blue-600" size={20} /> Inventory Valuation
          </h2>
          <p className="text-sm text-slate-500">Calculate closing stock value based on the selected method.</p>
        </div>
        <div className="flex rounded-lg bg-slate-100 p-1">
          {(["FIFO", "LIFO", "Avg"] as const).map((m) => (
            <button
              key={m}
              onClick={() => void applyMethod(m)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                method === m ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {m === "Avg" ? "Weighted Avg" : m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
          <p className="text-xs uppercase tracking-wide text-blue-100">Total Inventory Value ({method})</p>
          <h3 className="mt-1 text-3xl font-bold">{currency.format(totalValuation)}</h3>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Items valued</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{report.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Largest item</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{topItem?.itemName || "—"}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-800">Item-wise Valuation Report</h3>
          <p className="text-sm text-slate-500">This view is connected to item pricing and stock ledger valuation.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4 text-right">Stock Qty</th>
                <th className="px-6 py-4 text-right">Unit Value ({method})</th>
                <th className="px-6 py-4 text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-3 animate-spin text-blue-600" />
                    Calculating...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-red-600">{error}</td>
                </tr>
              ) : report.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">No valuation data available.</td>
                </tr>
              ) : (
                report.map((item) => (
                  <tr key={item.itemId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-slate-500">{item.sku}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{item.itemName}</td>
                    <td className="px-6 py-4 text-right">{Number(item.stock || 0)}</td>
                    <td className="px-6 py-4 text-right">{currency.format(Number(item.unitValuation || 0))}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-700">
                      {currency.format(Number(item.totalValuation || 0))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-800">Interconnection</h3>
          <p className="mt-2 text-sm text-slate-500">
            Valuation analysis feeds dashboard cards, closing stock reports, and COGS calculations.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Method</p>
              <p className="font-bold text-slate-800">{method}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValuationAnalysisView;
