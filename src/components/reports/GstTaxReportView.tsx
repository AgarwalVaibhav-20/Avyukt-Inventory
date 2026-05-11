import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { exportService } from '@/services/exportService';
import ExportDialog, { ExportPeriod, ExportFormat } from '@/components/common/ExportDialog';
import { GstReportItem } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Receipt, Download, Loader2, DollarSign, TrendingUp, FileText } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899'];

const GstTaxReportView: React.FC = () => {
  const [data, setData] = useState<GstReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await reportService.getGstReport();
    setData(res);
    
    // Calculate statistics
    const totalTax = res.reduce((acc, curr) => acc + curr.sgst + curr.cgst + curr.igst, 0);
    const totalTaxable = res.reduce((acc, curr) => acc + curr.taxableAmount, 0);
    const totalInvoiceAmount = res.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalSGST = res.reduce((acc, curr) => acc + curr.sgst, 0);
    const totalCGST = res.reduce((acc, curr) => acc + curr.cgst, 0);
    const totalIGST = res.reduce((acc, curr) => acc + curr.igst, 0);

    setStats({
      invoiceCount: res.length,
      totalTax,
      totalTaxable,
      totalInvoiceAmount,
      totalSGST,
      totalCGST,
      totalIGST
    });

    // Tax breakdown chart
    const taxChart = [
      { name: 'SGST', value: totalSGST },
      { name: 'CGST', value: totalCGST },
      { name: 'IGST', value: totalIGST }
    ].filter(t => t.value > 0);

    setChartData(taxChart);
    setLoading(false);
  };

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportGst(period, format);
  };

  if (loading) return <div className="flex h-64 justify-center items-center"><Loader2 className="animate-spin text-slate-400"/></div>;

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">GST & Tax Report</h1>
            <p className="text-slate-600">Monitor GST compliance and tax calculations</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Invoices</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.invoiceCount}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><FileText size={24}/></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Taxable Amount</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">${(stats.totalTaxable / 1000).toFixed(1)}K</h3>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600"><DollarSign size={24}/></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Tax Liability</p>
                        <h3 className="text-3xl font-bold text-purple-600 mt-2">${(stats.totalTax / 1000).toFixed(1)}K</h3>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-purple-600"><Receipt size={24}/></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Invoice Amount</p>
                        <h3 className="text-3xl font-bold text-green-600 mt-2">${(stats.totalInvoiceAmount / 1000000).toFixed(2)}M</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-green-600"><TrendingUp size={24}/></div>
                </div>
            </div>
        </div>

        {/* Tax Breakdown and Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tax by Type Pie Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Tax Breakdown by Type</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {chartData.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>SGST: ${stats.totalSGST.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          <span>CGST: ${stats.totalCGST.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                          <span>IGST: ${stats.totalIGST.toLocaleString()}</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* Tax Summary Card */}
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-xl p-6 text-white shadow-lg">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Receipt className="text-yellow-400" size={24}/> GST Summary
              </h3>
              <div className="space-y-4">
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-purple-100 text-sm font-medium mb-1">SGST (State GST)</p>
                      <h4 className="text-2xl font-bold">${stats.totalSGST.toFixed(2)}</h4>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-purple-100 text-sm font-medium mb-1">CGST (Central GST)</p>
                      <h4 className="text-2xl font-bold">${stats.totalCGST.toFixed(2)}</h4>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-purple-100 text-sm font-medium mb-1">IGST (Integrated GST)</p>
                      <h4 className="text-2xl font-bold">${stats.totalIGST.toFixed(2)}</h4>
                  </div>
                  <div className="border-t border-white/20 pt-4 mt-4">
                      <p className="text-purple-100 text-sm font-medium mb-1">Total Tax Liability</p>
                      <h3 className="text-3xl font-bold text-yellow-400">${stats.totalTax.toFixed(2)}</h3>
                  </div>
              </div>
          </div>
        </div>

        {/* GST Details Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800">GST Sales Register Details</h3>
                <button className="flex items-center gap-2 border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
                    <Download size={16}/> Export
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Invoice No</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4 text-right">Taxable Amt</th>
                            <th className="px-6 py-4 text-right">CGST</th>
                            <th className="px-6 py-4 text-right">SGST</th>
                            <th className="px-6 py-4 text-right">IGST</th>
                            <th className="px-6 py-4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                         {data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-700">{row.invoiceNo}</td>
                                <td className="px-6 py-4 text-slate-600">{row.date}</td>
                                <td className="px-6 py-4 font-medium text-slate-800">{row.customerName}</td>
                                <td className="px-6 py-4 text-right text-slate-700">${row.taxableAmount.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right text-slate-600">${row.cgst.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right text-slate-600">${row.sgst.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right text-slate-600">${row.igst.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-bold text-purple-700">${row.totalAmount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
