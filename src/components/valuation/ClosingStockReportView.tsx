import React, { useEffect, useMemo, useState } from "react";
import { stockControlService } from "@/services/stockControlService";
import { Calendar, Download, FileText, Loader2, Search } from "lucide-react";

type ReportFormat = "All" | "Summary" | "Detailed";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const ClosingStockReportView: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("12");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [format, setFormat] = useState<ReportFormat>("All");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockControlService.getClosingStockHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load closing stock reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = useMemo(() => {
    const maxAgeMonths = Number(period || 12);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - maxAgeMonths);

    return history.filter((row) => {
      const rowDate = row.date ? new Date(row.date) : null;
      const withinPeriod = !rowDate || Number.isNaN(rowDate.getTime()) ? true : rowDate >= cutoff;
      const withinFrom = !fromDate || !rowDate || Number.isNaN(rowDate.getTime()) ? true : rowDate >= new Date(fromDate);
      const withinTo = !toDate || !rowDate || Number.isNaN(rowDate.getTime()) ? true : rowDate <= new Date(`${toDate}T23:59:59`);
      const matchesSearch =
        `${row.date} ${row.method}`.toLowerCase().includes(search.toLowerCase()) ||
        String(row.totalValue || "").includes(search);
      const matchesFormat = format === "All" || row.method === format || (format === "Detailed" && Number(row.itemCount || 0) > 0);
      return withinPeriod && withinFrom && withinTo && matchesSearch && matchesFormat;
    });
  }, [history, period, fromDate, toDate, format, search]);

  const totalValue = filtered.reduce((sum, row) => sum + Number(row.totalValue || 0), 0);
  const totalItems = filtered.reduce((sum, row) => sum + Number(row.itemCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <FileText className="text-indigo-600" size={20} /> Closing Stock Reports
            </h2>
            <p className="text-sm text-slate-500">
              Period-based closing stock snapshots with valuation method history.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <Download size={16} />
            Export All
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[0.7fr_1fr_1fr_0.8fr_1fr_0.8fr]">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
          >
            {["12", "6", "3", "1"].map((item) => (
              <option key={item} value={item}>
                Last {item} month{item === "1" ? "" : "s"}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ReportFormat)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
          >
            <option value="All">All Formats</option>
            <option value="Summary">Summary</option>
            <option value="Detailed">Detailed</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search method or value"
              className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={loadData}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Reports</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{filtered.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Total value</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{currency.format(totalValue)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Total SKUs</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{totalItems.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="font-bold text-slate-800">Closing stock history</h3>
          <p className="text-sm text-slate-500">Used by reports and finance to retain the method at the time of generation.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Report Date</th>
                <th className="px-6 py-4 text-right">Total Inventory Value</th>
                <th className="px-6 py-4 text-center">Total SKUs</th>
                <th className="px-6 py-4 text-center">Valuation Method</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-3 animate-spin-slow text-indigo-600" />
                    Loading closing stock reports...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    No closing stock reports found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        {row.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-700">{currency.format(Number(row.totalValue || 0))}</td>
                    <td className="px-6 py-4 text-center">{Number(row.itemCount || 0)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{row.method}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-xs font-medium text-blue-600 hover:underline">View Details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
        Filtering here mirrors the reference spec: period, from/to date, report format, and search. Warehouse/category filters can be wired through the backend as the data source expands.
      </div>
    </div>
  );
};

export default ClosingStockReportView;
