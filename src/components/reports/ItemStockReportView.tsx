import React, { useState, useEffect } from "react";
import { reportService } from "@/services/reportService";
import { exportService } from "@/services/exportService";
import ExportDialog, {
  ExportPeriod,
  ExportFormat,
} from "@/components/common/ExportDialog";
import { InventoryItem } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  Download,
  Loader2,
  Package,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import Pagination from "@/components/common/Pagination";
import { useListControls } from "@/hooks/useListControls";
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

const ItemStockReportView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, pageSize, search, stockFilter]);

  const loadData = async () => {
    setLoading(true);
    // Fetch stats first (Total value, etc)
    const summaryRes = await reportService.getStockSummary();
    
    const response = await reportService.getItemStockReport({
      page,
      limit: pageSize,
      search,
      stock: stockFilter === "all" ? "" : stockFilter
    });
    
    const data = response?.data || [];
    setItems(data);
    setTotalItems(response?.total || 0);
    setTotalPages(response?.pages || 0);

    setStats({
      totalItems: summaryRes?.totalItems || 0,
      totalValue: summaryRes?.totalValue || 0,
      lowStockItems: summaryRes?.lowStock || 0,
      avgValue: summaryRes?.totalItems > 0 ? summaryRes?.totalValue / summaryRes?.totalItems : 0,
    });

    // For the chart, we might want the top items. 
    // Ideally the backend should provide top items, but for now we use what we have in the first page or a separate call.
    // Let's use the first page for the chart for now, or fetch a larger set once if needed.
    setChartData(
      [...data]
        .sort((a, b) => b.stock * b.unitPrice - a.stock * a.unitPrice)
        .slice(0, 10)
        .map((i) => ({
          name: i.name.substring(0, 15),
          numValue: i.stock * i.unitPrice,
        })),
    );
    setLoading(false);
  };

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportItemStock(period, format);
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin-slow text-blue-500 mr-2" size={24} />
        <span className="text-slate-500 text-sm">
          Loading item inventory...
        </span>
      </div>
    );

  return (
    <div className="space-y-6 pb-8 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Item Stock Report
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Detailed inventory analysis with stock valuations
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
            value: stats.totalItems,
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Total Value",
            value: `₹${(stats.totalValue / 1000000).toFixed(2)}M`,
            icon: IndianRupee,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Avg Item Value",
            value: `₹${stats.avgValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            icon: TrendingUp,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Low Stock Items",
            value: stats.lowStockItems,
            icon: Package,
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
                    {value}
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

      {/* Chart */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-400" /> Top 10 Items by
            Stock Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" barCategoryGap="25%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    fontSize: 13,
                  }}
                  formatter={(value: any) =>
                    `₹${Number(value).toLocaleString("en-IN")}`
                  }
                />
                <Bar dataKey="numValue" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-base font-semibold text-slate-700">
                Item Inventory Details
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete inventory with valuations
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={15}
                />
                <Input
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 w-52 text-sm"
                />
              </div>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="h-9 w-36 text-sm">
                  <SelectValue placeholder="All stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stock</SelectItem>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="low">Low stock</SelectItem>
                  <SelectItem value="out">Out of stock</SelectItem>
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
                  Reorder
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Unit Price
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item) => {
                const isLow = item.stock <= item.reorderLevel;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 transition-colors ${isLow ? "border-l-2 border-red-400" : ""}`}
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400 font-mono">
                        {item.sku}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {item.category}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700">
                      {item.stock} {item.uom}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500">
                      {item.reorderLevel}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      ₹{item.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                        ₹{(item.stock * item.unitPrice).toLocaleString("en-IN")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 border-t border-slate-100">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        reportName="Item Stock Report"
      />
    </div>
  );
};

export default ItemStockReportView;
