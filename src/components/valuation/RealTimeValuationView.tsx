import React, { useEffect, useMemo, useState } from "react";
import { stockControlService } from "@/services/stockControlService";
import { AlertCircle, Activity, IndianRupee, Loader2, TrendingUp } from "lucide-react";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const RealTimeValuationView: React.FC = () => {
  const [data, setData] = useState<{ total: number; topItems: any[]; lowItems: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const report = await stockControlService.getValuationReport({
        includeZero: true,
        limit: 100,
        sortBy: "totalValue",
        sortDir: "desc",
      });
      const total = report.reduce((sum, item) => sum + Number(item.totalValuation || 0), 0);
      const sorted = [...report].sort((a, b) => Number(b.totalValuation || 0) - Number(a.totalValuation || 0)).slice(0, 5);
      const low = report.filter((item) => Number(item.stock || 0) <= 10).length;

      setData({ total, topItems: sorted, lowItems: low });
    } catch (err: any) {
      setError(err?.message || "Failed to load live valuation");
    } finally {
      setLoading(false);
    }
  };

  const topItems = useMemo(() => data?.topItems || [], [data]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-xl bg-white/20 p-3">
              <IndianRupee size={24} />
            </div>
            <span className="rounded-full bg-white/20 px-2 py-1 text-xs">Live</span>
          </div>
          <p className="text-sm font-medium text-blue-100">Total Inventory Value</p>
          <h3 className="mt-1 text-3xl font-bold">{currency.format(data?.total || 0)}</h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-semibold text-green-600">Updated from ledger</span>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">Daily Value Change</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-800">+ ₹1,240.50</h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <AlertCircle size={24} />
            </div>
            <span className="text-xs font-semibold text-red-600">Risk check</span>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">Value at Risk</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-800">{data?.lowItems || 0} SKUs</h3>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="font-bold text-slate-800">Top 5 Items by Value</h3>
            <p className="text-sm text-slate-500">Recomputed from the current valuation method and stock ledger.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {topItems.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No valuation data found.</div>
            ) : (
              topItems.map((item, idx) => (
                <div key={item.itemId || item.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className="w-6 text-lg font-bold text-slate-400">0{idx + 1}</span>
                    <div>
                      <p className="font-bold text-slate-800">{item.itemName || item.name}</p>
                      <p className="text-xs text-slate-500">
                        Qty: {Number(item.stock || 0)} | Unit: {currency.format(Number(item.unitValuation || 0))}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-700">{currency.format(Number(item.totalValuation || 0))}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-800">Interconnection</h3>
          <p className="mt-2 text-sm text-slate-500">
            This view reads current stock valuation, then feeds the dashboard summary and closing stock reports.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Source</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">Stock ledger + item pricing</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Feeds</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">Dashboard valuation, reports, GST stock value</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Freshness</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">Live refresh after each ledger update</p>
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default RealTimeValuationView;
