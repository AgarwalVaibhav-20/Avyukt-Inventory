import React, { useState, useEffect } from "react";
import { reportService } from "@/services/reportService";
import { exportService } from "@/services/exportService";
import ExportDialog, {
  ExportPeriod,
  ExportFormat,
} from "@/components/common/ExportDialog";
import { GstReportItem } from "@/types";
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
} from "recharts";
import {
  Receipt,
  Download,
  Loader2,
  DollarSign,
  TrendingUp,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899"];

const GstTaxReportView: React.FC = () => {
  const [data, setData] = useState<GstReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await reportService.getGstReport();
      setData(res);

      // Calculate statistics
      const totalTax = res.reduce(
        (acc, curr) =>
          acc + (curr.sgst || 0) + (curr.cgst || 0) + (curr.igst || 0),
        0,
      );
      const totalTaxable = res.reduce(
        (acc, curr) => acc + (curr.taxableAmount || 0),
        0,
      );
      const totalInvoiceAmount = res.reduce(
        (acc, curr) => acc + (curr.totalAmount || 0),
        0,
      );
      const totalSGST = res.reduce((acc, curr) => acc + (curr.sgst || 0), 0);
      const totalCGST = res.reduce((acc, curr) => acc + (curr.cgst || 0), 0);
      const totalIGST = res.reduce((acc, curr) => acc + (curr.igst || 0), 0);

      setStats({
        invoiceCount: res.length,
        totalTax,
        totalTaxable,
        totalInvoiceAmount,
        totalSGST,
        totalCGST,
        totalIGST,
      });

      // Tax breakdown chart
      const taxChart = [
        { name: "SGST", value: totalSGST },
        { name: "CGST", value: totalCGST },
        { name: "IGST", value: totalIGST },
      ].filter((t) => t.value > 0);

      setChartData(taxChart);
    } catch (error) {
      console.error("Error loading GST report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportGst(period, format);
  };

  const filtered = data.filter(
    (item) =>
      item.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      item.customerName.toLowerCase().includes(search.toLowerCase()),
  );

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  if (loading)
    return (
      <div className="flex h-screen justify-center items-center">
        <div className="text-center">
          <Loader2
            className="animate-spin text-blue-600 mx-auto mb-4"
            size={48}
          />
          <p className="text-slate-600 font-medium">Loading GST report...</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            GST & Tax Report
          </h1>
          <p className="text-slate-600">
            Monitor GST compliance and tax calculations for your business
          </p>
        </div>
        <button
          onClick={() => setShowExportDialog(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
        >
          <Download size={20} />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Total Invoices
              </p>
              <h3 className="text-4xl font-bold text-slate-900 mt-2">
                {stats.invoiceCount}
              </h3>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 shadow-sm group-hover:shadow-md transition-shadow">
              <FileText size={28} />
            </div>
          </div>
        </div>

        <div className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
                Taxable Amount
              </p>
              <h3 className="text-4xl font-bold text-slate-900 mt-2">
                ₹{(stats.totalTaxable / 1000).toFixed(1)}K
              </h3>
            </div>
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 shadow-sm group-hover:shadow-md transition-shadow">
              <TrendingUp size={28} />
            </div>
          </div>
        </div>

        <div className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-500">
                Total Tax liability
              </p>
              <h3 className="text-4xl font-bold text-purple-600 mt-2">
                ₹{(stats.totalTax / 1000).toFixed(1)}K
              </h3>
            </div>
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600 shadow-sm group-hover:shadow-md transition-shadow">
              <Receipt size={28} />
            </div>
          </div>
        </div>

        <div className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">
                Total Invoice Amount
              </p>
              <h3 className="text-4xl font-bold text-emerald-600 mt-2">
                ₹{(stats.totalInvoiceAmount / 1000).toFixed(1)}K
              </h3>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
              <TrendingUp size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Tax Breakdown and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tax by Type Pie Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 text-white">
              <Receipt size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Tax Breakdown by Type
            </h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>SGST: ₹{stats.totalSGST.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>CGST: ₹{stats.totalCGST.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span>IGST: ₹{stats.totalIGST.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Summary Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2 relative z-10">
            <Receipt className="text-yellow-400" size={24} /> GST Liability
            Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl p-5 backdrop-blur-md">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
                SGST (State GST)
              </p>
              <h4 className="text-3xl font-bold">
                ₹{stats.totalSGST.toFixed(2)}
              </h4>
            </div>
            <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl p-5 backdrop-blur-md">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
                CGST (Central GST)
              </p>
              <h4 className="text-3xl font-bold">
                ₹{stats.totalCGST.toFixed(2)}
              </h4>
            </div>
            <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl p-5 backdrop-blur-md">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
                IGST (Integrated GST)
              </p>
              <h4 className="text-3xl font-bold">
                ₹{stats.totalIGST.toFixed(2)}
              </h4>
            </div>
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-5 backdrop-blur-md">
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-2">
                Total Tax Payable
              </p>
              <h3 className="text-3xl font-bold text-yellow-400">
                ₹{stats.totalTax.toFixed(2)}
              </h3>
            </div>
          </div>
          <div className="mt-8 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl relative z-10">
            <p className="text-sm text-yellow-100 italic font-medium flex items-center gap-2">
              <TrendingUp size={16} /> Total invoice value including tax: ₹
              {stats.totalInvoiceAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* GST Details Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-white p-8 border-b border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="text-slate-700" size={24} /> GST Sales
                Register
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Detailed transaction history with tax breakdown
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search
                className="absolute left-3 top-3 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search invoices or customers..."
                className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-700">
                  Invoice No
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                <th className="px-6 py-4 font-semibold text-slate-700">
                  Customer
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">
                  Taxable Amt
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">
                  CGST
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">
                  SGST
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">
                  IGST
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.map((row, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                >
                  <td className="px-6 py-4 font-bold text-slate-900 font-mono text-xs">
                    {row.invoiceNo}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{row.date}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {row.customerName}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-700 font-medium">
                    ₹
                    {row.taxableAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600">
                    ₹
                    {row.cgst.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600">
                    ₹
                    {row.sgst.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600">
                    ₹
                    {row.igst.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-blue-700">
                    ₹
                    {row.totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-500 italic"
                  >
                    No records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600 font-medium">
            Showing{" "}
            <span className="text-slate-900">
              {filtered.length > 0 ? indexOfFirstItem + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="text-slate-900">
              {Math.min(indexOfLastItem, filtered.length)}
            </span>{" "}
            of <span className="text-slate-900">{filtered.length}</span> records
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              title="Previous Page"
            >
              <ChevronLeft size={20} className="text-slate-600" />
            </button>

            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                if (
                  totalPages <= 7 ||
                  i === 0 ||
                  i === totalPages - 1 ||
                  (i >= currentPage - 2 && i <= currentPage)
                ) {
                  return (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                        currentPage === i + 1
                          ? "bg-blue-500 text-white shadow-md"
                          : "hover:bg-white border border-transparent hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                } else if (
                  (i === 1 && currentPage > 4) ||
                  (i === totalPages - 2 && currentPage < totalPages - 3)
                ) {
                  return (
                    <span key={i} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              title="Next Page"
            >
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        reportName="GST & Tax Report"
      />
    </div>
  );
};

export default GstTaxReportView;
