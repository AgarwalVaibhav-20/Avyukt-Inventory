import React, { useState, useEffect } from "react";
import { reportService } from "@/services/reportService";
import { exportService } from "@/services/exportService";
import ExportDialog, {
  ExportPeriod,
  ExportFormat,
} from "@/components/common/ExportDialog";
import { Batch } from "@/types";
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
  CalendarX,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle,
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

const ExpiryAnalysisReportView: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    const data = await reportService.getExpiryReport({
      search: searchQuery,
      status: selectedStatus === "all" ? "" : selectedStatus,
    });
    setBatches(data || []);
    const today = new Date();
    const getDaysLeft = (d: string) => {
      if (!d || d === "N/A") return 999;
      return Math.ceil((new Date(d).getTime() - today.getTime()) / 86400000);
    };
    const expired = data?.filter((b: any) => getDaysLeft(b.expiryDate) < 0) || [];
    const expiringSoon =
      data?.filter((b: any) => {
        const d = getDaysLeft(b.expiryDate);
        return d >= 0 && d <= 30;
      }) || [];
    const safe = data?.filter((b: any) => getDaysLeft(b.expiryDate) > 30) || [];
    const expiredQty = expired.reduce((s: number, b: any) => s + b.quantity, 0);
    const expiringSoonQty = expiringSoon.reduce(
      (s: number, b: any) => s + b.quantity,
      0,
    );
    setStats({
      total: data?.length || 0,
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      safe: safe.length,
      expiredQty,
      expiringSoonQty,
    });
    setChartData([
      { range: "Expired", count: expired.length, qty: expiredQty },
      {
        range: "Expiring Soon",
        count: expiringSoon.length,
        qty: expiringSoonQty,
      },
      {
        range: "Safe (>30d)",
        count: safe.length,
        qty: safe.reduce((s: number, b: any) => s + b.quantity, 0),
      },
    ]);
    setLoading(false);
  };

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportExpiryAnalysis(period, format);
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin-slow text-blue-500 mr-2" size={24} />
        <span className="text-slate-500 text-sm">
          Loading expiry analysis...
        </span>
      </div>
    );

  return (
    <div className="space-y-6 pb-8 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Expiry Analysis Report
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor batch expiry dates and manage stock lifecycle
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
            label: "Total Batches",
            value: stats.total,
            icon: Clock,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Already Expired",
            value: stats.expired,
            icon: CalendarX,
            color: "text-red-600",
            bg: "bg-red-50",
            sub: `${stats.expiredQty} units`,
          },
          {
            label: "Expiring Soon (0-30d)",
            value: stats.expiringSoon,
            icon: AlertTriangle,
            color: "text-amber-600",
            bg: "bg-amber-50",
            sub: `${stats.expiringSoonQty} units`,
          },
          {
            label: "Safe (>30d)",
            value: stats.safe,
            icon: CheckCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
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
            <CalendarX size={16} className="text-slate-400" /> Batch Expiry
            Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="40%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="range"
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
                  formatter={(value: any, name: string) =>
                    name === "qty" ? `${value} units` : `${value} batches`
                  }
                />
                <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} />
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
                Batch Expiry Details
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Sorted by expiry date - most critical first
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={15}
                />
                <Input
                  placeholder="Search batch or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-52 text-sm"
                />
              </div>
              <Select
                value={selectedStatus || "all"}
                onValueChange={(v) => setSelectedStatus(v)}
              >
                <SelectTrigger className="h-9 w-40 text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                  <SelectItem value="safe">Safe</SelectItem>
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
                  Batch No.
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Item Name
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Qty
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Expiry Date
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {batches.map((b) => {
                const daysLeft = Math.ceil(
                  (new Date(b.expiryDate).getTime() - new Date().getTime()) /
                    86400000,
                );
                const isExpired = daysLeft < 0;
                const isSoon = !isExpired && daysLeft <= 30;
                const badgeClass = isExpired
                  ? "bg-red-50 text-red-700 border-red-200"
                  : isSoon
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200";
                const leftBorder = isExpired
                  ? "border-l-2 border-red-400"
                  : isSoon
                    ? "border-l-2 border-amber-400"
                    : "";

                return (
                  <tr
                    key={b.id}
                    className={`hover:bg-slate-50 transition-colors ${leftBorder}`}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">
                      {b.batchNumber}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {b.itemName}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700">
                      {b.quantity}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{b.expiryDate}</td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${badgeClass}`}
                      >
                        {isExpired ? "Expired" : `${daysLeft}d left`}
                      </span>
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
        reportName="Expiry Analysis Report"
      />
    </div>
  );
};

export default ExpiryAnalysisReportView;
