import React, { useState, useEffect } from "react";
import { dashboardService } from "@/services/dashboardService";
import { InOutSummary } from "@/types";
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const DashboardInOut: React.FC = () => {
  const [summary, setSummary] = useState<InOutSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await dashboardService.getInOutSummary();
    setSummary(data);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-50 text-blue-500 p-2 rounded-xl">
          <ArrowDownToLine size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Inward vs Outward
          </h2>
          <p className="text-xs text-slate-400">
            Monthly stock flow comparison
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-300">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={summary}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="period"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => (
                    <span className="text-xs text-slate-500">{val}</span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="inwardValue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#gIn)"
                  name="Inward ($)"
                />
                <Area
                  type="monotone"
                  dataKey="outwardValue"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#gOut)"
                  name="Outward ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wide">
                  <th className="px-4 py-3 font-semibold">Period</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <span className="flex items-center justify-end gap-1 text-emerald-600">
                      <ArrowDownToLine size={11} /> In Qty
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-emerald-600">
                    In Value
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <span className="flex items-center justify-end gap-1 text-red-500">
                      <ArrowUpFromLine size={11} /> Out Qty
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-red-500">
                    Out Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summary.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-700">
                      {row.period}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {row.inwardQty}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      ${row.inwardValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {row.outwardQty}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-500">
                      ${row.outwardValue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardInOut;
