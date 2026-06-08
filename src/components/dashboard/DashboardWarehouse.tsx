import React, { useState, useEffect } from "react";
import { dashboardService } from "@/services/dashboardService";
import { WarehouseStockReport } from "@/types";
import {
  Warehouse,
  Loader2,
  Boxes,
  IndianRupeeIcon,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Input } from "@/components/ui/input";

const DashboardWarehouse: React.FC = () => {
  const [report, setReport] = useState<WarehouseStockReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await dashboardService.getWarehouseStockReport();
    setReport(data);
    setLoading(false);
  };

  const filteredReport = report.filter((wh) =>
    wh.warehouseName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 text-blue-500 p-2 rounded-xl">
            <Warehouse size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Warehouse Distribution
            </h2>
            <p className="text-xs text-slate-400">
              Stock value & utilization by location
            </p>
          </div>
        </div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={14}
          />
          <Input
            placeholder="Search warehouse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 w-full sm:w-64 text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-300">
          <Loader2 size={24} className="animate-spin-slow" />
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredReport}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="warehouseName"
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
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [
                    `₹${v.toLocaleString()}`,
                    "Stock Value",
                  ]}
                />
                <Bar
                  dataKey="totalValue"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  name="Stock Value (₹)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredReport.map((wh) => {
              const isHigh = wh.utilization > 80;
              return (
                <div
                  key={wh.warehouseId}
                  className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <div className="bg-blue-50 text-blue-500 p-1.5 rounded-lg shrink-0 mt-0.5">
                      <Warehouse size={13} />
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">
                      {wh.warehouseName}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <IndianRupeeIcon size={11} /> Total Value
                      </span>
                      <span className="font-bold text-slate-800">
                        ₹{wh.totalValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <Boxes size={11} /> SKUs
                      </span>
                      <span className="font-semibold text-slate-700">
                        {wh.totalItems}
                      </span>
                    </div>
                  </div>

                  {/* Utilization bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span className="text-slate-400 font-medium uppercase tracking-wide">
                        Utilization
                      </span>
                      <span
                        className={`font-bold ${isHigh ? "text-red-500" : "text-emerald-500"}`}
                      >
                        {wh.utilization}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${isHigh ? "bg-red-400" : "bg-emerald-400"}`}
                        style={{ width: `${wh.utilization}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardWarehouse;
