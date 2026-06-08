import React, { useState, useEffect, useCallback } from "react";
import { reportService } from "@/services/reportService";
import { exportService } from "@/services/exportService";
import ExportDialog, {
  ExportPeriod,
  ExportFormat,
} from "@/components/common/ExportDialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  BarChart3,
  Package,
  IndianRupee,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
];

const StockSummaryReportView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const fetchItems = useCallback(
    async (page: number, search: string, category: string) => {
      setItemsLoading(true);
      try {
        const result = await reportService.getItemStockReport({
          page,
          limit: pageSize,
          search,
          category,
        });
        setItems(result.data || []);
        setTotalItems(result.total || 0);
        setTotalPages(result.pages || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setItemsLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const statsData = await reportService.getStockSummary();
        setStats(statsData);
        const initialResult = await reportService.getItemStockReport({
          limit: 50,
        });
        const all = initialResult.data || [];
        const topItems = all
          .slice(0, 6)
          .map((i: any) => ({
            name: i.name.substring(0, 12),
            value: i.stock * i.unitPrice,
            quantity: i.stock,
          }));
        const categoryData = all.reduce((acc: any, item: any) => {
          const catName = item.category || "Uncategorized";
          const ex = acc.find((c: any) => c.name === catName);
          if (ex) ex.value += item.stock * item.unitPrice;
          else
            acc.push({
              name: catName,
              value: item.stock * item.unitPrice,
            });
          return acc;
        }, []);
        const valueData = [
          { month: "Jan", value: +(statsData.totalValue * 0.8).toFixed(0) },
          { month: "Feb", value: +(statsData.totalValue * 0.85).toFixed(0) },
          { month: "Mar", value: +(statsData.totalValue * 0.9).toFixed(0) },
          { month: "Apr", value: +(statsData.totalValue * 0.95).toFixed(0) },
          { month: "May", value: +statsData.totalValue.toFixed(0) },
        ];
        setChartData({ topItems, categoryData, valueData });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchItems(currentPage, searchQuery, selectedCategory);
  }, [currentPage, searchQuery, selectedCategory, fetchItems]);

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportStockSummary(period, format);
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin-slow text-blue-500 mr-2" size={24} />
        <span className="text-slate-500 text-sm">Loading stock summary...</span>
      </div>
    );

  return (
    <div className="space-y-6 pb-8 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Stock Summary Report
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time inventory valuation and stock analysis
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
        {[
          {
            label: "Total Items",
            value: stats?.totalItems,
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Total Quantity",
            value: stats?.totalStock?.toLocaleString(),
            icon: BarChart3,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Total Value",
            value: `₹${(stats?.totalValue / 1000000).toFixed(2)}M`,
            icon: IndianRupee,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Low Stock Items",
            value: stats?.lowStockItems,
            icon: AlertTriangle,
            color: "text-red-600",
            bg: "bg-red-50",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {value ?? "–"}
                  </p>
                </div>
                <div className={`${bg} ${color} p-2 rounded-lg`}>
                  <Icon size={18} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Items Bar Chart */}
        <Card className="border border-slate-100 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp size={15} className="text-slate-400" /> Top Items by
              Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData?.topItems} barCategoryGap="30%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
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
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                    formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-700">
              By Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData?.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {chartData?.categoryData?.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                    formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {chartData?.categoryData?.slice(0, 4).map((c: any, i: number) => (
                <span
                  key={c.name}
                  className="flex items-center gap-1 text-xs text-slate-600"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  {c.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Value Trend */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <BarChart3 size={15} className="text-slate-400" /> Inventory Value
            Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData?.valueData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                  formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                <Package size={16} />
              </div>
              <CardTitle className="text-base font-semibold text-slate-700">
                Inventory Details
              </CardTitle>
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-9 w-52 text-sm"
                />
              </div>
              <Select
                value={selectedCategory || "all"}
                onValueChange={(v) => {
                  setSelectedCategory(v === "all" ? "" : v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-40 text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {chartData?.categoryData?.map((c: any) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
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
                  Item
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Category
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Stock
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Unit Price
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total Value
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {itemsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                    </td>
                  </tr>
                ))
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400 font-mono">
                        {item.sku}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {item.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700">
                      {item.stock.toLocaleString()} {item.uom}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      ₹{item.unitPrice.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">
                      ₹{(item.stock * item.unitPrice).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {item.lastUpdated
                        ? new Date(item.lastUpdated).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )
                        : "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-400 text-sm"
                  >
                    No items found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1 || itemsLoading}
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let p = i + 1;
              if (totalPages > 5) {
                if (currentPage <= 3) p = i + 1;
                else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                else p = currentPage - 2 + i;
              }
              return (
                <Button
                  key={i}
                  variant={currentPage === p ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || itemsLoading}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </Card>

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        reportName="Stock Summary Report"
      />
    </div>
  );
};

export default StockSummaryReportView;
