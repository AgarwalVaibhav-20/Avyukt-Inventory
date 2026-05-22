import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
  Calendar,
  Filter,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NCR {
  id: string;
  ncrNumber: string;
  itemName: string;
  refType: "GRN" | "Production" | "Customer Return";
  refId: string;
  description: string;
  status: "Open" | "In Review" | "Closed" | "Rejected";
  quantity: number;
  raisedBy: string;
  createdAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const getRelativeDateString = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

const MOCK_NCRS: NCR[] = [
  { id: "1", ncrNumber: "NCR-2026-001", itemName: "Steel Rod 12mm", refType: "GRN", refId: "GRN-2026-045", description: "Surface corrosion found on 40% of received batch. Does not meet IS 2062 specification.", status: "Open", quantity: 120, raisedBy: "Ravi Kumar", createdAt: getRelativeDateString(0) },
  { id: "2", ncrNumber: "NCR-2026-002", itemName: "Bearing 6205-2RS", refType: "Production", refId: "PROD-2026-012", description: "Abnormal noise during assembly. Bearing inner race found to be out of tolerance.", status: "In Review", quantity: 24, raisedBy: "Anjali Singh", createdAt: getRelativeDateString(2) },
  { id: "3", ncrNumber: "NCR-2026-003", itemName: "Copper Wire 2.5mm", refType: "Customer Return", refId: "RET-2026-007", description: "Insulation cracking observed after 3 months of installation. Batch traced to lot CW-2025-88.", status: "Closed", quantity: 500, raisedBy: "Manoj Patel", createdAt: getRelativeDateString(5) },
  { id: "4", ncrNumber: "NCR-2026-004", itemName: "Hydraulic Seal Kit", refType: "GRN", refId: "GRN-2026-051", description: "O-rings are undersized by 0.5mm. Supplier deviation not approved.", status: "Open", quantity: 60, raisedBy: "Sunita Sharma", createdAt: getRelativeDateString(12) },
  { id: "5", ncrNumber: "NCR-2026-005", itemName: "Paint - Epoxy Red Oxide", refType: "GRN", refId: "GRN-2026-053", description: "Viscosity out of spec. Drying time exceeds 8 hours instead of 4.", status: "Rejected", quantity: 200, raisedBy: "Ravi Kumar", createdAt: getRelativeDateString(18) },
  { id: "6", ncrNumber: "NCR-2026-006", itemName: "Hex Bolt M16x60", refType: "Production", refId: "PROD-2026-021", description: "Thread pitch incorrect. 1.5mm found instead of specified 2.0mm.", status: "Open", quantity: 800, raisedBy: "Deepak Rao", createdAt: getRelativeDateString(25) },
  { id: "7", ncrNumber: "NCR-2026-007", itemName: "Aluminium Sheet 3mm", refType: "Customer Return", refId: "RET-2026-011", description: "Waviness and bow deformation reported. Exceeds flatness tolerance of 1mm/m.", status: "In Review", quantity: 30, raisedBy: "Anjali Singh", createdAt: getRelativeDateString(45) },
  { id: "8", ncrNumber: "NCR-2026-008", itemName: "Motor 5HP 3-Phase", refType: "GRN", refId: "GRN-2026-062", description: "Nameplate rating does not match test results. Actual output is 4.2HP.", status: "Closed", quantity: 5, raisedBy: "Suresh Nair", createdAt: getRelativeDateString(60) },
  { id: "9", ncrNumber: "NCR-2026-009", itemName: "Gasket Rubber EPDM", refType: "Production", refId: "PROD-2026-034", description: "Premature failure in steam application. Material not heat resistant above 120°C.", status: "Open", quantity: 150, raisedBy: "Manoj Patel", createdAt: getRelativeDateString(90) },
  { id: "10", ncrNumber: "NCR-2026-010", itemName: "Control Panel Box", refType: "Customer Return", refId: "RET-2026-015", description: "IP54 rating not met. Water ingress found during on-site audit.", status: "In Review", quantity: 3, raisedBy: "Sunita Sharma", createdAt: getRelativeDateString(120) },
  { id: "11", ncrNumber: "NCR-2026-011", itemName: "Steel Rod 12mm", refType: "GRN", refId: "GRN-2026-071", description: "Tensile strength below minimum threshold. Lot rejected pending supplier corrective action.", status: "Open", quantity: 250, raisedBy: "Deepak Rao", createdAt: getRelativeDateString(180) },
  { id: "12", ncrNumber: "NCR-2026-012", itemName: "Pump Impeller Cast Iron", refType: "Production", refId: "PROD-2026-049", description: "Casting porosity detected in ultrasonic test. Affects structural integrity.", status: "Closed", quantity: 8, raisedBy: "Ravi Kumar", createdAt: getRelativeDateString(380) },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<NCR["status"], { bg: string; text: string; icon: React.ReactNode; dot: string }> = {
  Open:        { bg: "bg-red-50",    text: "text-red-700",    icon: <XCircle size={12} />,      dot: "bg-red-500" },
  "In Review": { bg: "bg-amber-50",  text: "text-amber-700",  icon: <Clock size={12} />,        dot: "bg-amber-500" },
  Closed:      { bg: "bg-green-50",  text: "text-green-700",  icon: <CheckCircle2 size={12} />, dot: "bg-green-500" },
  Rejected:    { bg: "bg-slate-100", text: "text-slate-600",  icon: <XCircle size={12} />,      dot: "bg-slate-400" },
};

const REF_TYPE_CONFIG: Record<NCR["refType"], string> = {
  GRN:              "bg-blue-50 text-blue-700",
  Production:       "bg-purple-50 text-purple-700",
  "Customer Return": "bg-orange-50 text-orange-700",
};

function exportToCSV(data: NCR[], filename: string) {
  const headers = ["NCR Number", "Item Name", "Source", "Reference ID", "Status", "Qty Affected", "Raised By", "Date"];
  const rows = data.map((n) => [n.ncrNumber, n.itemName, n.refType, n.refId, n.status, n.quantity, n.raisedBy, n.createdAt]);
  const csv = [headers, ...rows].map((r) => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Export Modal ─────────────────────────────────────────────────────────────

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  allData: NCR[];
  filteredData: NCR[];
}

const ExportModal: React.FC<ExportModalProps> = ({ open, onClose, allData, filteredData }) => {
  const [period, setPeriod] = useState<"all" | "daily" | "weekly" | "monthly" | "yearly" | "custom">("all");
  const [format, setFormat] = useState<"csv" | "excel">("excel");
  const [scope, setScope] = useState<"filtered" | "all">("filtered");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  if (!open) return null;

  const handleDownload = () => {
    const source = scope === "filtered" ? filteredData : allData;
    let filtered = source;
    const now = new Date();

    if (period !== "custom" && period !== "all") {
      const from = new Date(now);
      if (period === "daily") from.setDate(from.getDate() - 1);
      else if (period === "weekly") from.setDate(from.getDate() - 7);
      else if (period === "monthly") from.setMonth(from.getMonth() - 1);
      else from.setFullYear(from.getFullYear() - 1);
      filtered = source.filter((n) => new Date(n.createdAt) >= from);
    } else if (period === "custom" && customFrom && customTo) {
      filtered = source.filter((n) => {
        const d = new Date(n.createdAt);
        return d >= new Date(customFrom) && d <= new Date(customTo);
      });
    }

    const ts = new Date().toISOString().slice(0, 10);
    exportToCSV(filtered, `NCR-Report-${period}-${ts}.csv`);
    onClose();
  };

  const periodOptions: { key: typeof period; label: string }[] = [
    { key: "all", label: "All Time" },
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Export NCR Report</p>
              <p className="text-xs text-slate-500">Choose format and time period</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Data Scope */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Data Scope</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "filtered", label: `Filtered (${filteredData.length} records)` },
                { key: "all", label: `All Records (${allData.length})` },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setScope(opt.key as typeof scope)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                    scope === opt.key
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Period */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Time Period</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {periodOptions.slice(0, 5).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPeriod(opt.key)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    period === opt.key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPeriod("custom")}
              className={`w-full py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                period === "custom"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              <Calendar size={14} /> Custom Range
            </button>
            {period === "custom" && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">From</label>
                  <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">To</label>
                  <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
              </div>
            )}
          </div>

          {/* Format */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Export Format</p>
            <div className="space-y-2">
              {[
                { key: "csv", label: "CSV File", desc: "Comma-separated values, compatible with Excel" },
                { key: "excel", label: "Excel (XLSX)", desc: "Microsoft Excel format with formatting" },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    format === opt.key ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${format === opt.key ? "border-blue-600" : "border-slate-300"}`}>
                    {format === opt.key && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <input type="radio" className="sr-only" checked={format === opt.key} onChange={() => setFormat(opt.key as typeof format)} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleDownload} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Download size={16} /> Download
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

const NCRReportPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return MOCK_NCRS.filter((n) => {
      const matchSearch = !term || n.ncrNumber.toLowerCase().includes(term) || n.itemName.toLowerCase().includes(term) || n.refId.toLowerCase().includes(term) || n.description.toLowerCase().includes(term) || n.raisedBy.toLowerCase().includes(term);
      const matchStatus = statusFilter === "All" || n.status === statusFilter;
      const matchSource = sourceFilter === "All" || n.refType === sourceFilter;
      const matchFrom = !dateFrom || new Date(n.createdAt) >= new Date(dateFrom);
      const matchTo = !dateTo || new Date(n.createdAt) <= new Date(dateTo);
      return matchSearch && matchStatus && matchSource && matchFrom && matchTo;
    });
  }, [search, statusFilter, sourceFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(() => ({
    open: MOCK_NCRS.filter((n) => n.status === "Open").length,
    inReview: MOCK_NCRS.filter((n) => n.status === "In Review").length,
    closed: MOCK_NCRS.filter((n) => n.status === "Closed").length,
    total: MOCK_NCRS.length,
  }), []);

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(""); setStatusFilter("All"); setSourceFilter("All");
    setDateFrom(""); setDateTo(""); setPage(1);
  };

  const hasFilters = search || statusFilter !== "All" || sourceFilter !== "All" || dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} allData={MOCK_NCRS} filteredData={filtered} />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">NCR Report</h1>
              <p className="text-sm text-slate-500">Non-Conformance Reports — Quality Control</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <FileSpreadsheet size={16} className="text-green-600" />
            Export to Excel
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total NCRs", value: stats.total, color: "text-slate-800", bg: "bg-white", border: "border-slate-200", icon: <TrendingUp size={16} className="text-slate-400" /> },
            { label: "Open", value: stats.open, color: "text-red-700", bg: "bg-red-50", border: "border-red-100", icon: <XCircle size={16} className="text-red-400" /> },
            { label: "In Review", value: stats.inReview, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100", icon: <Clock size={16} className="text-amber-400" /> },
            { label: "Closed", value: stats.closed, color: "text-green-700", bg: "bg-green-50", border: "border-green-100", icon: <CheckCircle2 size={16} className="text-green-400" /> },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                {s.icon}
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal size={15} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-600">Filters</span>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="ml-auto text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors">
                <X size={12} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={handleFilterChange(setSearch)}
                placeholder="Search NCR, item, ref, raised by…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            {/* Status */}
            <select value={statusFilter} onChange={handleFilterChange(setStatusFilter)} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Review">In Review</option>
              <option value="Closed">Closed</option>
              <option value="Rejected">Rejected</option>
            </select>
            {/* Source */}
            <select value={sourceFilter} onChange={handleFilterChange(setSourceFilter)} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              <option value="All">All Sources</option>
              <option value="GRN">GRN</option>
              <option value="Production">Production</option>
              <option value="Customer Return">Customer Return</option>
            </select>
            {/* Date Range */}
            <div className="flex gap-2">
              <input type="date" value={dateFrom} onChange={handleFilterChange(setDateFrom)} className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" title="From date" />
              <input type="date" value={dateTo} onChange={handleFilterChange(setDateTo)} className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" title="To date" />
            </div>
          </div>
          {filtered.length !== MOCK_NCRS.length && (
            <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
              <Filter size={11} /> Showing <strong className="text-slate-700">{filtered.length}</strong> of {MOCK_NCRS.length} records
            </p>
          )}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {["NCR Number", "Item Name", "Source", "Reference ID", "Description", "Qty", "Status", "Raised By", "Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-slate-400 text-sm">
                      <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
                      No NCRs match the current filters.
                    </td>
                  </tr>
                ) : paginated.map((ncr) => {
                  const sc = STATUS_CONFIG[ncr.status];
                  const rc = REF_TYPE_CONFIG[ncr.refType];
                  return (
                    <tr key={ncr.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-4 font-mono font-semibold text-slate-800 text-xs whitespace-nowrap">{ncr.ncrNumber}</td>
                      <td className="px-5 py-4 text-slate-700 max-w-[160px]">
                        <span className="block truncate font-medium" title={ncr.itemName}>{ncr.itemName}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${rc}`}>{ncr.refType}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-mono text-xs whitespace-nowrap">{ncr.refId}</td>
                      <td className="px-5 py-4 text-slate-600 max-w-[220px]">
                        <span className="block truncate text-xs" title={ncr.description}>{ncr.description}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-700 font-medium whitespace-nowrap">{ncr.quantity.toLocaleString()}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {ncr.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap text-xs">{ncr.raisedBy}</td>
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap text-xs">{new Date(ncr.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing <strong className="text-slate-700">{filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</strong>–<strong className="text-slate-700">{Math.min(currentPage * PAGE_SIZE, filtered.length)}</strong> of <strong className="text-slate-700">{filtered.length}</strong> records
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                    p === currentPage
                      ? "bg-slate-800 text-white border border-slate-800"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NCRReportPage;