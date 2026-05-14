import React, { useState, useEffect } from "react";
import { reportService } from "@/services/reportService";
import { exportService } from "@/services/exportService";
import ExportDialog, {
  ExportPeriod,
  ExportFormat,
} from "@/components/common/ExportDialog";
import { AgingAnalysisItem } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Clock,
  Loader2,
  Package,
  AlertTriangle,
  TrendingUp,
  Download,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
const AGE_RANGES = ["0-30 Days", "31-60 Days", "61-90 Days", ">90 Days"];

const AgingAnalysisView: React.FC = () => {
  const [data, setData] = useState<AgingAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    const res = await reportService.getAgingReport({
      search: searchQuery,
      category: selectedCategory === "all" ? "" : selectedCategory,
    });
    setData(res || []);
    const totalStock = res?.reduce((sum, item) => sum + item.totalStock, 0) || 0;
    const ageStats = AGE_RANGES.map((range) => {
      const qty = res?.reduce((sum, item) => {
        const bucket = item.buckets.find((b) => b.range === range);
        return sum + (bucket?.quantity || 0);
      }, 0) || 0;
      return {
        range,
        qty,
        percentage: totalStock > 0 ? ((qty / totalStock) * 100).toFixed(1) : "0",
      };
    });
    setStats({
      totalStock,
      freshStock: ageStats[0].qty,
      mediumStock: ageStats[1].qty + ageStats[2].qty,
      oldStock: ageStats[3].qty,
      oldPercentage: ageStats[3].percentage,
    });
    setChartData(
      AGE_RANGES.map((range) => {
        const qty = res?.reduce((sum, item) => {
          const bucket = item.buckets.find((b) => b.range === range);
          return sum + (bucket?.quantity || 0);
        }, 0) || 0;
        return {
          name: range,
          value: qty,
          percentage: totalStock > 0 ? ((qty / totalStock) * 100).toFixed(1) : "0",
        };
      }),
    );
    setLoading(false);
  };

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportAgingAnalysis(period, format);
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-blue-500 mr-2" size={24} />
        <span className="text-slate-500 text-sm">
          Loading aging analysis...
        </span>
      </div>
    );

  const summaryCards = [
    {
      label: "Total Stock",
      value: stats.totalStock.toLocaleString(),
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Fresh Stock (0-30d)",
      value: stats.freshStock.toLocaleString(),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Medium Age (31-90d)",
      value: stats.mediumStock.toLocaleString(),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Old Stock (>90d)",
      value: stats.oldStock.toLocaleString(),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      sub: `${stats.oldPercentage}% of total`,
    },
  ];

  return (
    <div className="space-y-6 pb-8 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Stock Aging Analysis
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Analyze inventory age and optimize stock rotation
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowExportDialog(true)}
          className="gap-2"
        >
          <Download size={15} /> Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <Card key={label} className="border border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {value}
                  </p>
                  {sub && (
                    <p className={`text-xs mt-1 font-medium ${color}`}>{sub}</p>
                  )}
                </div>
                <div className={`${bg} ${color} p-2 rounded-lg`}>
                  <Icon size={18} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <Clock size={16} className="text-slate-400" /> Stock Age
            Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="35%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    fontSize: 13,
                  }}
                  formatter={(value: any, _: string, props: any) => [
                    `${value} units (${props.payload.percentage}%)`,
                    "Qty",
                  ]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-700">
                Item-wise Aging Analysis
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Stock distribution by age range
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={15}
                />
                <Input
                  placeholder="Search item or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-52 text-sm"
                />
              </div>
              <Select
                value={selectedCategory || "all"}
                onValueChange={(v) => setSelectedCategory(v)}
              >
                <SelectTrigger className="h-9 w-40 text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Raw Material">Raw Material</SelectItem>
                  <SelectItem value="Finished Goods">Finished Goods</SelectItem>
                  <SelectItem value="Consumable">Consumable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Item Name
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                  0-30d
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  31-60d
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wide">
                  61-90d
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-red-600 uppercase tracking-wide">
                  &gt;90d
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((item) => {
                const b30 =
                  item.buckets.find((b) => b.range === "0-30 Days")?.quantity ||
                  0;
                const b60 =
                  item.buckets.find((b) => b.range === "31-60 Days")
                    ?.quantity || 0;
                const b90 =
                  item.buckets.find((b) => b.range === "61-90 Days")
                    ?.quantity || 0;
                const b90plus =
                  item.buckets.find((b) => b.range === ">90 Days")?.quantity ||
                  0;
                return (
                  <tr
                    key={item.itemId}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {item.itemName}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700">
                      {item.totalStock}
                    </td>
                    <td className="px-5 py-3 text-right text-emerald-600 font-medium">
                      {b30 || "–"}
                    </td>
                    <td className="px-5 py-3 text-right text-blue-600 font-medium">
                      {b60 || "–"}
                    </td>
                    <td className="px-5 py-3 text-right text-amber-600 font-medium">
                      {b90 || "–"}
                    </td>
                    <td className="px-5 py-3 text-right text-red-600 font-semibold">
                      {b90plus || "–"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        reportName="Stock Aging Analysis"
      />
    </div>
  );
};

export default AgingAnalysisView;
