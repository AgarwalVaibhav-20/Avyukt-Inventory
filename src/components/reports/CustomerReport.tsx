import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCustomers } from "@/store/slices/customerSlice";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
const fmtCur = (n: number) => "₹" + fmt(n);
const hue = (id: string) =>
  Array.from(id).reduce((s, c) => s + c.charCodeAt(0), 0) % 360;

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Corporate:   { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  Wholesale:   { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  Retail:      { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" },
  Distributor: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
};

// ─── Helpers: real file download ──────────────────────────────────────────────

function downloadCSV(customers: any[]) {
  const headers = [
    "Name", "Code", "Mobile", "Email", "Type",
    "Credit Limit", "Outstanding", "Status", "City", "State",
  ];
  const rows = customers.map((c) => [
    `"${(c.name  || "").replace(/"/g, '""')}"`,
    `"${(c.code  || "").replace(/"/g, '""')}"`,
    `"${(c.mobile|| "").replace(/"/g, '""')}"`,
    `"${(c.email || "").replace(/"/g, '""')}"`,
    `"${(c.type  || "").replace(/"/g, '""')}"`,
    c.creditLimit  ?? 0,
    c.outstanding  ?? 0,
    `"${(c.status || "").replace(/"/g, '""')}"`,
    `"${(c.city  || "").replace(/"/g, '""')}"`,
    `"${(c.state || "").replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  triggerDownload(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    "customer_report.csv",
  );
}

async function downloadXLSX(customers: any[]) {
  // Dynamically import SheetJS so it doesn't bloat the initial bundle
  const XLSX = await import("xlsx");

  const data = [
    ["Name","Code","Mobile","Email","Type","Credit Limit","Outstanding","Status","City","State"],
    ...customers.map((c) => [
      c.name        || "",
      c.code        || "",
      c.mobile      || "",
      c.email       || "",
      c.type        || "",
      c.creditLimit ?? 0,
      c.outstanding ?? 0,
      c.status      || "",
      c.city        || "",
      c.state       || "",
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Auto-size columns
  const colWidths = data[0].map((_, ci) =>
    Math.min(30, Math.max(10, ...data.map((row) => String(row[ci] ?? "").length)))
  );
  ws["!cols"] = colWidths.map((w) => ({ wch: w }));

  // Style header row bold (SheetJS CE supports cell styles via cell_styles option)
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: "EFF6FF" } } };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  XLSX.writeFile(wb, "customer_report.xlsx");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Export Modal ─────────────────────────────────────────────────────────────
interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  customers: any[];
}

function ExportModal({ open, onClose, customers }: ExportModalProps) {
  const [period,      setPeriod]      = useState("Monthly");
  const [format,      setFormat]      = useState("CSV");
  const [downloading, setDownloading] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const periods = ["Daily", "Weekly", "Monthly", "Yearly"];

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      if (format === "CSV") {
        downloadCSV(customers);
      } else {
        await downloadXLSX(customers);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || "Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "480px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)", overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>Export Customer Report</h2>
              <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#94a3b8" }}>
                {customers.length} record{customers.length !== 1 ? "s" : ""} · Choose format and time period
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "8px", color: "#94a3b8", lineHeight: 1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          {/* Time Period */}
          <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: "#374151", letterSpacing: "0.04em", textTransform: "uppercase" }}>Time Period</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "13px 0", borderRadius: "12px",
                  border: period === p ? "2px solid transparent" : "2px solid #e2e8f0",
                  background: period === p ? "linear-gradient(135deg,#2563eb,#0ea5e9)" : "#f8fafc",
                  color: period === p ? "#fff" : "#475569",
                  fontSize: "15px", fontWeight: period === p ? 700 : 500,
                  cursor: "pointer", transition: "all 0.18s", fontFamily: "inherit",
                }}
              >{p}</button>
            ))}
          </div>

          {/* Export Format */}
          <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: "#374151", letterSpacing: "0.04em", textTransform: "uppercase" }}>Export Format</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { id: "CSV",  label: "CSV File",      desc: "Comma-separated values, compatible with Excel" },
              { id: "XLSX", label: "Excel (XLSX)",  desc: "Microsoft Excel format with formatting" },
            ].map(({ id, label, desc }) => (
              <button
                key={id}
                onClick={() => setFormat(id)}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px 16px", borderRadius: "12px",
                  border: format === id ? "2px solid #2563eb" : "2px solid #e2e8f0",
                  background: format === id ? "#eff6ff" : "#fff",
                  cursor: "pointer", textAlign: "left", transition: "all 0.18s", fontFamily: "inherit",
                }}
              >
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  border: format === id ? "6px solid #2563eb" : "2px solid #cbd5e1",
                  background: format === id ? "#fff" : "transparent",
                  flexShrink: 0, transition: "all 0.18s",
                }}/>
                <div>
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>{label}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px" }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px 24px", display: "flex", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "2px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >Cancel</button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              flex: 2, padding: "13px", borderRadius: "12px", border: "none",
              background: downloading ? "#93c5fd" : "linear-gradient(135deg,#2563eb,#0ea5e9)",
              color: "#fff", fontSize: "15px", fontWeight: 700, cursor: downloading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: "0 4px 12px rgba(37,99,235,0.3)", fontFamily: "inherit", transition: "all 0.18s",
            }}
          >
            {downloading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Preparing…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download {format}
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "20px", fontSize: "11.5px", fontWeight: 600,
      background: active ? "#f0fdf4" : "#fef2f2",
      color: active ? "#15803d" : "#dc2626",
      border: `1px solid ${active ? "#bbf7d0" : "#fecaca"}`,
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: active ? "#22c55e" : "#f87171" }}/>
      {status}
    </span>
  );
}

// ─── Type Badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS.Retail;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "11.5px", fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {type}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomerReport() {
  const dispatch = useAppDispatch();
  const { customers = [], loading } = useAppSelector((state: any) => state.customers || {});

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const [search,       setSearch]       = useState("");
  const [filterType,   setFilterType]   = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortCol,      setSortCol]      = useState("name");
  const [sortDir,      setSortDir]      = useState<"asc"|"desc">("asc");
  const [page,         setPage]         = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [exportModal,  setExportModal]  = useState(false);
  const PER_PAGE = 8;

  const now = new Date();

  const stats = [
    {
      label: "Total Customers", value: fmt(customers.length),
      color: "#2563eb", bg: "#eff6ff",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      label: "Active", value: fmt(customers.filter((c: any) => c.status === "Active").length),
      color: "#10b981", bg: "#f0fdf4",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
    },
    {
      label: "Inactive", value: fmt(customers.filter((c: any) => c.status === "Inactive").length),
      color: "#ef4444", bg: "#fef2f2",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>,
    },
    {
      label: "Outstanding", value: fmtCur(customers.reduce((s: number, c: any) => s + (c.outstanding || 0), 0)),
      color: "#f59e0b", bg: "#fffbeb",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>,
    },
    {
      label: "New This Month",
      value: fmt(customers.filter((c: any) => {
        if (!c.createdAt) return false;
        const d = new Date(c.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length),
      color: "#8b5cf6", bg: "#f5f3ff",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    },
  ];

  const filtered = useMemo(() => {
    let rows = [...customers];
    if (search)
      rows = rows.filter((c: any) =>
        [c.name, c.code, c.email, c.mobile, c.city]
          .join(" ").toLowerCase()
          .includes(search.toLowerCase())
      );
    if (filterType   !== "All") rows = rows.filter((c: any) => c.type   === filterType);
    if (filterStatus !== "All") rows = rows.filter((c: any) => c.status === filterStatus);
    rows.sort((a: any, b: any) => {
      const va = a[sortCol] ?? "";
      const vb = b[sortCol] ?? "";
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [customers, search, filterType, filterStatus, sortCol, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const sort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };
  const toggleRow = (id: string) =>
    setSelectedRows((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () =>
    setSelectedRows((s) =>
      s.size === paged.length ? new Set<string>() : new Set(paged.map((c: any) => c.id))
    );

  const SortArrow = ({ col }: { col: string }) =>
    sortCol !== col
      ? <span style={{ color: "#d1d5db", fontSize: "10px" }}>↕</span>
      : <span style={{ color: "#2563eb", fontSize: "10px" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;

  const thStyle: React.CSSProperties = {
    padding: "12px 14px", textAlign: "left", cursor: "pointer", userSelect: "none",
    fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.06em", color: "#9ca3af", whiteSpace: "nowrap",
  };

  // Customers to export = currently filtered set (respects search/filter)
  const exportData = filtered;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans','Inter',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#f1f5f9}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
      `}</style>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>Customer Report</h1>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>
              {loading ? "Loading…" : `${customers.length} total customers · Manage your customer base`}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => setExportModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                padding: "10px 18px", borderRadius: "12px",
                border: "2px solid #e2e8f0", background: "#fff",
                color: "#475569", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "14px", marginBottom: "24px" }}>
          {loading
            ? Array(5).fill(0).map((_, i) => (
              <div key={i} style={{ borderRadius: "16px", height: "96px", background: "#f1f5f9", animation: "pulse 1.5s ease-in-out infinite" }}/>
            ))
            : stats.map((s, i) => (
              <div key={i}
                style={{ borderRadius: "16px", padding: "16px", background: s.bg, cursor: "pointer", transition: "transform 0.15s", border: "2px solid transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", color: s.color }}>
                  {s.icon}
                </div>
                <p style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "2px" }}>{s.value}</p>
                <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
        </div>

        {/* ── Table Card ── */}
        <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>

          {/* Toolbar */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>Customer List</span>
              {selectedRows.size > 0 && (
                <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                  {selectedRows.size} selected
                </span>
              )}
              <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: "#f1f5f9", color: "#64748b" }}>
                {filtered.length}
              </span>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {/* Search */}
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" style={{ position: "absolute", left: "10px" }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search customers…"
                  style={{ paddingLeft: "30px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px", borderRadius: "10px", border: "2px solid #e2e8f0", fontSize: "12px", color: "#374151", outline: "none", fontFamily: "inherit", width: "190px" }}
                />
              </div>
              {/* Type filter */}
              <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                style={{ padding: "8px 12px", borderRadius: "10px", border: "2px solid #e2e8f0", fontSize: "12px", color: "#374151", outline: "none", cursor: "pointer", fontFamily: "inherit", background: "#fff" }}>
                <option value="All">All Types</option>
                {["Retail", "Wholesale", "Distributor", "Corporate"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {/* Status filter */}
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                style={{ padding: "8px 12px", borderRadius: "10px", border: "2px solid #e2e8f0", fontSize: "12px", color: "#374151", outline: "none", cursor: "pointer", fontFamily: "inherit", background: "#fff" }}>
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "12px 14px", width: "40px" }}>
                    <input type="checkbox"
                      checked={selectedRows.size === paged.length && paged.length > 0}
                      onChange={toggleAll}
                      style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#2563eb" }}
                    />
                  </th>
                  {([["name","Customer"],["code","Code"],["type","Type"],["creditLimit","Credit Limit"],["outstanding","Outstanding"],["status","Status"]] as [string,string][]).map(([col, lbl]) => (
                    <th key={col} style={thStyle} onClick={() => sort(col)}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>{lbl} <SortArrow col={col}/></span>
                    </th>
                  ))}
                  <th style={{ ...thStyle, textAlign: "center" }}>Mobile</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(8).fill(0).map((_, j) => (
                        <td key={j} style={{ padding: "13px 14px" }}>
                          <div style={{ height: "16px", borderRadius: "6px", background: "#f1f5f9", animation: "pulse 1.5s ease-in-out infinite" }}/>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "60px 20px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #e2e8f0" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          </svg>
                        </div>
                        <p style={{ fontWeight: 600, color: "#64748b" }}>No customers found</p>
                        <p style={{ fontSize: "13px", color: "#94a3b8" }}>Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : paged.map((c: any) => (
                  <tr key={c.id ?? c._id}
                    style={{ borderBottom: "1px solid #f8fafc", background: selectedRows.has(c.id) ? "#eff6ff" : "transparent", transition: "background 0.12s" }}
                    onMouseEnter={(e) => { if (!selectedRows.has(c.id)) e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = selectedRows.has(c.id) ? "#eff6ff" : "transparent"; }}
                  >
                    <td style={{ padding: "13px 14px" }}>
                      <input type="checkbox" checked={selectedRows.has(c.id)} onChange={() => toggleRow(c.id)}
                        style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#2563eb" }}/>
                    </td>
                    <td style={{ padding: "13px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "10px",
                          background: `hsl(${hue(c.id ?? c._id ?? "0")},55%,55%)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "13px", fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>{(c.name || "?").charAt(0)}</div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>{c.name}</p>
                          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{c.city}{c.city && c.state ? ", " : ""}{c.state}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 14px" }}>
                      <span style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: 700, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "3px 8px", borderRadius: "8px" }}>
                        {c.code}
                      </span>
                    </td>
                    <td style={{ padding: "13px 14px" }}><TypeBadge type={c.type}/></td>
                    <td style={{ padding: "13px 14px", fontSize: "13px", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
                      {fmtCur(c.creditLimit ?? 0)}
                    </td>
                    <td style={{ padding: "13px 14px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: (c.outstanding ?? 0) > 0 ? "#d97706" : "#d1d5db" }}>
                        {(c.outstanding ?? 0) > 0 ? fmtCur(c.outstanding) : "—"}
                      </span>
                    </td>
                    <td style={{ padding: "13px 14px" }}><StatusBadge status={c.status}/></td>
                    <td style={{ padding: "13px 14px", fontSize: "13px", color: "#475569", whiteSpace: "nowrap", textAlign: "center" }}>
                      {c.mobile}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa" }}>
            <p style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
              {filtered.length === 0
                ? "No records"
                : `Showing ${Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length}`}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", opacity: page === 1 ? 0.4 : 1 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  style={{
                    width: "30px", height: "30px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
                    cursor: "pointer",
                    background: page === p ? "linear-gradient(135deg,#2563eb,#0ea5e9)" : "#fff",
                    color: page === p ? "#fff" : "#64748b",
                    border: page === p ? "none" : "1px solid #e2e8f0",
                  }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", opacity: page === pages ? 0.4 : 1 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Export Modal — passes real filtered data */}
      <ExportModal
        open={exportModal}
        onClose={() => setExportModal(false)}
        customers={exportData}
      />

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}