import React, { useEffect, useMemo, useState } from "react";
import { stockControlService } from "@/services/stockControlService";
import { Box, Calendar, Calculator, Filter, Loader2, RefreshCcw, Receipt, Search } from "lucide-react";
import toast from "react-hot-toast";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const COGSView: React.FC = () => {
  const [cogsData, setCogsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    void fetchCOGS();
  }, []);

  const fetchCOGS = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockControlService.getCOGSData();
      setCogsData(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load COGS ledger");
    } finally {
      setLoading(false);
    }
  };

  const totalCOGS = useMemo(
    () => cogsData.reduce((sum, item) => sum + Number(item.totalCost || 0), 0),
    [cogsData],
  );

  const filteredData = useMemo(
    () =>
      cogsData.filter(
        (entry) =>
          `${entry.reference} ${entry.itemName} ${entry.sku}`.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [cogsData, searchTerm],
  );

  const handleRunValuation = async () => {
    toast.promise(fetchCOGS(), {
      loading: "Recalculating inventory valuation impact...",
      success: "Valuation refreshed successfully",
      error: "Failed to run valuation",
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
                <Calculator className="text-emerald-300" size={32} />
              </div>
              <div className="min-w-0">
                <h2 className="flex flex-wrap items-center gap-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  COGS Ledger
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    Financial Postings
                  </span>
                </h2>
                <p className="mt-2 max-w-3xl text-sm font-medium text-emerald-200/70 sm:text-lg">
                  Cost of Goods Sold tracking for every dispatch event
                </p>
              </div>
            </div>
            <div className="w-full rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md sm:min-w-[250px]">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                Total COGS (MTD)
              </p>
              <p className="text-2xl font-black text-white sm:text-3xl">{currency.format(totalCOGS)}</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-10">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full flex-1 lg:max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:left-6" size={20} />
              <input
                type="text"
                placeholder="Search by Dispatch Ref or Item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 py-3 pl-12 pr-4 text-sm font-semibold outline-none transition-all focus:border-emerald-500/20 focus:bg-white focus:ring-8 focus:ring-emerald-500/5 sm:py-4 sm:pl-16 sm:pr-6 sm:text-base sm:font-bold"
              />
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <button className="rounded-2xl bg-slate-50 p-3 text-slate-500 transition-colors hover:text-emerald-600 sm:p-4">
                <Filter size={20} />
              </button>
              <button
                onClick={handleRunValuation}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95 sm:px-8 sm:py-4"
              >
                Run Valuation
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border-2 border-slate-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:px-10 sm:py-6">
                      Financial Ref
                    </th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:px-8 sm:py-6">
                      Item Details
                    </th>
                    <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:px-8 sm:py-6">
                      Units Dispatched
                    </th>
                    <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:px-8 sm:py-6">
                      Unit Cost
                    </th>
                    <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:px-10 sm:py-6">
                      Total COGS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-32 text-center">
                        <Loader2 className="mx-auto mb-4 animate-spin-slow text-emerald-600" size={48} />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Calculating Financial Impact...
                        </p>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-red-600">{error}</td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-32 text-center">
                        <Receipt size={64} className="mx-auto mb-4 text-slate-200" />
                        <p className="font-bold italic text-slate-400">No COGS entries found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((entry) => (
                      <tr key={entry.id} className="group transition-all duration-300 hover:bg-emerald-50/30">
                        <td className="px-4 py-5 sm:px-10 sm:py-7">
                          <div className="flex flex-col">
                            <span className="break-words text-base font-black tracking-tighter text-slate-900 transition-colors group-hover:text-emerald-700 sm:text-lg">
                              {entry.reference}
                            </span>
                            <span className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              <Calendar size={12} /> {entry.date}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-5 sm:px-8 sm:py-7">
                          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                              <Box size={20} className="text-slate-400" />
                            </div>
                            <div className="min-w-0 flex flex-col">
                              <span className="mb-1 break-words text-sm font-black leading-tight text-slate-800 sm:text-base">
                                {entry.itemName}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                                {entry.sku}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-right sm:px-8 sm:py-7">
                          <span className="text-base font-black text-slate-900 sm:text-lg">{entry.quantity}</span>
                        </td>
                        <td className="px-4 py-5 text-right sm:px-8 sm:py-7">
                          <span className="font-bold text-slate-500">{currency.format(Number(entry.unitCost || 0))}</span>
                        </td>
                        <td className="px-4 py-5 text-right sm:px-10 sm:py-7">
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-black tracking-tighter text-emerald-700 sm:text-xl">
                              {currency.format(Number(entry.totalCost || 0))}
                            </span>
                            <span className="mt-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                              Posted
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            COGS is connected to outbound material movements and refreshes after valuation recalculation.
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default COGSView;
