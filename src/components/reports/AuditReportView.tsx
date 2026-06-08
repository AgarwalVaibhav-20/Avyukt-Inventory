import React, { useState, useEffect } from "react";
import { reportService } from "@/services/reportService";
import { exportService } from "@/services/exportService";
import ExportDialog, {
  ExportPeriod,
  ExportFormat,
} from "@/components/common/ExportDialog";
import { AuditLog } from "@/types";
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
  Shield,
  Search,
  Loader2,
  Activity,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const AuditReportView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const loadData = async () => {
    setLoading(true);
    const data = await reportService.getAuditLogs();
    setLogs(data);
    const creates = data.filter((l) => l.action === "Create").length;
    const updates = data.filter((l) => l.action === "Update").length;
    const deletes = data.filter((l) => l.action === "Delete").length;
    const uniqueUsers = new Set(data.map((l) => l.user)).size;
    setStats({
      totalLogs: data.length,
      creates,
      updates,
      deletes,
      uniqueUsers,
    });
    setChartData([
      { action: "Create", count: creates },
      { action: "Update", count: updates },
      { action: "Delete", count: deletes },
    ]);
    setLoading(false);
  };

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportAudit(period, format);
  };

  const filtered = logs.filter(
    (l) =>
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.module.toLowerCase().includes(search.toLowerCase()) ||
      (l.description &&
        l.description.toLowerCase().includes(search.toLowerCase())),
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const actionBadge = (action: string) => {
    const map: Record<string, string> = {
      Create: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Update: "bg-blue-50 text-blue-700 border-blue-200",
      Delete: "bg-red-50 text-red-700 border-red-200",
    };
    return map[action] || "bg-slate-50 text-slate-600 border-slate-200";
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin-slow text-blue-500 mr-2" size={24} />
        <span className="text-slate-500 text-sm">Loading audit logs...</span>
      </div>
    );

  return (
    <div className="space-y-6 pb-8 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            System Audit Report
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track all system activities and user actions
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
            label: "Total Logs",
            value: stats.totalLogs,
            icon: Activity,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Creates",
            value: stats.creates,
            icon: () => <span className="font-bold text-base">+</span>,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Updates",
            value: stats.updates,
            icon: () => <span className="font-bold text-base">↻</span>,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Unique Users",
            value: stats.uniqueUsers,
            icon: () => <span className="text-base">👥</span>,
            color: "text-purple-600",
            bg: "bg-purple-50",
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
            <Shield size={16} className="text-slate-400" /> Audit Activity
            Distribution
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
                  dataKey="action"
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
                />
                <Bar dataKey="count" fill="#64748b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <Shield size={16} className="text-slate-400" /> System Audit
                Logs
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Detailed activity log of all system operations
              </p>
            </div>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={15}
              />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-56 text-sm"
              />
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Timestamp
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  User
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Action
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Module
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentItems.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3 text-xs">
                    <span className="font-medium text-slate-700">
                      {log.date}
                    </span>
                    <span className="text-slate-400 ml-1.5">
                      {log.timestamp}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {log.user}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${actionBadge(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{log.module}</td>
                  <td
                    className="px-5 py-3 text-slate-500 max-w-xs truncate"
                    title={log.description}
                  >
                    {log.description}
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-slate-400 text-sm"
                  >
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-xs text-slate-500">
            Showing{" "}
            {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–
            {Math.min(currentPage * itemsPerPage, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} />
            </Button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let p = i + 1;
              if (totalPages > 5) {
                if (currentPage <= 3) p = i + 1;
                else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                else p = currentPage - 2 + i;
              }
              return (
                <Button
                  key={p}
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
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
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
        reportName="System Audit Report"
      />
    </div>
  );
};

export default AuditReportView;
