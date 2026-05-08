import React, { useState, useEffect } from "react";
import { dashboardService } from "@/services/dashboardService";
import { MovementAnalysis } from "@/types";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Loader2,
} from "lucide-react";

type Filter = "All" | "Fast" | "Slow" | "Non";

const filters: { key: Filter; label: string; color: string }[] = [
  { key: "All", label: "All", color: "text-slate-600" },
  { key: "Fast", label: "Fast", color: "text-emerald-600" },
  { key: "Slow", label: "Slow", color: "text-amber-600" },
  { key: "Non", label: "Non-Moving", color: "text-red-600" },
];

const Badge: React.FC<{ cls: string }> = ({ cls }) => {
  if (cls === "Fast Moving")
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg text-xs font-semibold">
        <TrendingUp size={11} /> Fast
      </span>
    );
  if (cls === "Slow Moving")
    return (
      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg text-xs font-semibold">
        <TrendingDown size={11} /> Slow
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg text-xs font-semibold">
      <MinusCircle size={11} /> Static
    </span>
  );
};

const DashboardMovement: React.FC = () => {
  const [data, setData] = useState<MovementAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await dashboardService.getMovementAnalysis();
    setData(res);
    setLoading(false);
  };

  const filtered = data.filter(
    (d) =>
      filter === "All" ||
      (filter === "Fast" && d.classification === "Fast Moving") ||
      (filter === "Slow" && d.classification === "Slow Moving") ||
      (filter === "Non" && d.classification === "Non-Moving"),
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-500 p-2 rounded-xl">
            <Activity size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Movement Analysis
            </h2>
            <p className="text-xs text-slate-400">
              Last 30 days outgoing transactions
            </p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1 gap-0.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === f.key
                  ? `bg-white shadow-sm ${f.color}`
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wide">
              <th className="px-4 py-3 font-semibold">Item</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Last Moved</th>
              <th className="px-4 py-3 text-center font-semibold">
                30d Outflow
              </th>
              <th className="px-4 py-3 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-300">
                  <Loader2 size={22} className="animate-spin inline" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-slate-400 text-sm"
                >
                  No items found
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.itemId}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{item.itemName}</p>
                    <p className="text-slate-400 font-mono text-[10px] mt-0.5">
                      {item.sku}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.category}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {item.lastMovementDate}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">
                    {item.turnoverRate}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge cls={item.classification} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardMovement;
