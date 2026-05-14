import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Database,
  Globe,
  LineChart,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  Warehouse,
  Wifi,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchForecasts,
  fetchReorderSuggestions,
  fetchCompanies,
  fetchCurrencies,
  fetchIotDevices,
  fetchComplianceStatus,
} from "../../store/slices/advancedSlice";
import { fetchItems } from "../../store/slices/inventorySlice";
import { createPR } from "../../store/slices/procurementSlice";


type FocusFeature = "adv-forecast" | "adv-ai" | "adv-multi" | "adv-curr" | "adv-comp" | "adv-iot";

type FeatureConfig = {
  id: FocusFeature;
  title: string;
  badge: string;
  summary: string;
  detail: string;
  primaryFilters: string[];
  advancedFilters: string[];
  accent: string;
  icon: React.ElementType;
};

type MetricCard = {
  label: string;
  value: string;
  note: string;
  tone?: string;
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const configs: Record<FocusFeature, FeatureConfig> = {
  "adv-forecast": {
    id: "adv-forecast",
    title: "Demand Forecasting",
    badge: "Forecast Horizon",
    summary: "Predict future demand from stock ledger movement and order patterns.",
    detail:
      "Reads from stock ledger, item master, and sales history to forecast demand with confidence bands and replenishment guidance.",
    primaryFilters: ["Increase PR", "Watch", "General", "High Confidence"],
    advancedFilters: ["90%+", "80%+", "Next 30 Days", "Next 90 Days"],
    accent: "from-blue-600 to-indigo-600",
    icon: LineChart,
  },
  "adv-ai": {
    id: "adv-ai",
    title: "AI Reorder Suggestions",
    badge: "Decision Support",
    summary: "Turn forecasts into reorder recommendations with lead-time awareness.",
    detail:
      "Combines forecast output, current stock, open purchase orders, and vendor lead time data to suggest replenishment actions.",
    primaryFilters: ["Critical", "High", "Medium", "Primary Vendor"],
    advancedFilters: ["Lead Time", "Confidence", "Demand Spike", "Open PO"],
    accent: "from-emerald-600 to-teal-600",
    icon: BrainCircuit,
  },
  "adv-multi": {
    id: "adv-multi",
    title: "Multi-Company Inventory",
    badge: "Entity Control",
    summary: "Separate company books with a consolidated oversight layer.",
    detail:
      "Keeps entity-level ledgers, warehouses, and valuations isolated while allowing group-level reporting and intercompany visibility.",
    primaryFilters: ["Active", "Watch", "INR", "USD"],
    advancedFilters: ["Category", "Consolidated View", "Ledger Scope", "Intercompany"],
    accent: "from-fuchsia-600 to-indigo-600",
    icon: Globe,
  },
  "adv-curr": {
    id: "adv-curr",
    title: "Multi-Currency Support",
    badge: "FX Valuation",
    summary: "Convert foreign purchase costs into the base currency for valuation.",
    detail:
      "Handles exchange rates, landed cost, and gain/loss tracking so inventory value remains consistent across currencies.",
    primaryFilters: ["JPY", "EUR", "USD", "AED"],
    advancedFilters: ["Rate Source", "Gain/Loss", "Invoice Date", "Revaluation"],
    accent: "from-sky-600 to-blue-600",
    icon: Cloud,
  },
  "adv-comp": {
    id: "adv-comp",
    title: "Compliance Automation",
    badge: "Regulatory Flow",
    summary: "Automate GST, E-Way Bill, and maker-checker validations.",
    detail:
      "The reference flow sits between transaction creation and posting, applying document checks and rule-based automation before finalizing movement.",
    primaryFilters: ["GRN", "Dispatch", "Approved", "Pending approval"],
    advancedFilters: ["Rule Type", "Auto vs Manual", "Regulated Item", "Exception"],
    accent: "from-orange-600 to-rose-600",
    icon: ShieldAlert,
  },
  "adv-iot": {
    id: "adv-iot",
    title: "IoT / Smart Warehouse",
    badge: "Real-time Sensors",
    summary: "Blend live warehouse sensor data with stock records.",
    detail:
      "Sensors, RTLS, and smart shelf events feed the stock ledger and dashboard so exceptions can be acted on in real time.",
    primaryFilters: ["Temperature", "RFID", "Normal", "Alert"],
    advancedFilters: ["Battery", "Offline Only", "Signal Quality", "Zone"],
    accent: "from-cyan-600 to-blue-600",
    icon: Wifi,
  },
};

const featureRows = [
  { id: "f1", ref: "REF-2026-001", status: "Active", date: "2026-05-12", action: "View" },
  { id: "f2", ref: "REF-2026-002", status: "Pending", date: "2026-05-11", action: "Inspect" },
  { id: "f3", ref: "REF-2026-003", status: "Synced", date: "2026-05-10", action: "Open" },
];

const forecastRows = [
  { item: "Industrial Ball Bearing X200", category: "Components", current: 450, forecast: 620, conf: "92%", action: "Increase PR" },
  { item: "Hydraulic Pump HP-50", category: "Machinery", current: 12, forecast: 16, conf: "86%", action: "Watch" },
  { item: "Safety Gloves - Large", category: "Safety Gear", current: 2000, forecast: 1825, conf: "95%", action: "Hold" },
  { item: "M10 Stainless Bolt", category: "Fasteners", current: 15000, forecast: 17100, conf: "89%", action: "Plan bulk buy" },
];

const aiRows = [
  { item: "Industrial Ball Bearing X200", vendor: "SKF", qty: 250, eta: "12 days", score: "98%", reason: "Lead time breach in 21 days", priority: "Critical" },
  { item: "Hydraulic Pump HP-50", vendor: "Bosch", qty: 4, eta: "7 days", score: "91%", reason: "Production reserve drop", priority: "High" },
  { item: "Safety Gloves - Large", vendor: "3M", qty: 600, eta: "5 days", score: "84%", reason: "Seasonal spike", priority: "Medium" },
  { item: "Control Panel V3", vendor: "Siemens", qty: 8, eta: "18 days", score: "88%", reason: "Service backlog growth", priority: "High" },
];

const multiCompanyRows = [
  { company: "ACT Manufacturing Pvt Ltd", warehouses: 8, currency: "INR", value: 128400000, status: "Active", tone: "bg-blue-50 text-blue-700" },
  { company: "ACT Global Trading LLC", warehouses: 4, currency: "USD", value: 4180000, status: "Active", tone: "bg-indigo-50 text-indigo-700" },
  { company: "ACT Infra Projects", warehouses: 2, currency: "INR", value: 26400000, status: "Active", tone: "bg-violet-50 text-violet-700" },
  { company: "ACT Services Hub", warehouses: 1, currency: "INR", value: 2100000, status: "Watch", tone: "bg-amber-50 text-amber-700" },
];

const currencyRows = [
  { po: "PO/FX/00041", supplier: "Nippon Tech", currency: "JPY", rate: 0.56, converted: 842300, gainLoss: 12000, landed: 850400 },
  { po: "PO/FX/00054", supplier: "Alpine GmbH", currency: "EUR", rate: 89.12, converted: 1428000, gainLoss: -8500, landed: 1431200 },
  { po: "PO/FX/00061", supplier: "Texas Parts", currency: "USD", rate: 83.42, converted: 2685000, gainLoss: 21200, landed: 2712200 },
  { po: "PO/FX/00069", supplier: "Dubai Metals", currency: "AED", rate: 22.72, converted: 940000, gainLoss: 4300, landed: 949100 },
];

const complianceRows = [
  { doc: "GRN-2026-0412", module: "GRN", rule: "GST + QC", status: "Pending approval", due: "Today" },
  { doc: "DISP-2026-0291", module: "Dispatch", rule: "E-Way Bill", status: "Auto-generated", due: "Complete" },
  { doc: "STK-ADJ-0092", module: "Stock Adjustment", rule: "Maker-checker", status: "Awaiting checker", due: "1 day" },
  { doc: "PO-2026-0188", module: "Purchase Order", rule: "AVL only", status: "Approved", due: "Complete" },
];

const iotRows = [
  { device: "WH-01 / Temp sensor", type: "Temperature", reading: "4.2 C", severity: "Normal", lastSeen: "12 sec ago", battery: "88%" },
  { device: "WH-02 / RFID portal", type: "RFID", reading: "48 reads/min", severity: "Normal", lastSeen: "7 sec ago", battery: "91%" },
  { device: "WH-03 / Shelf load cell", type: "Weight", reading: "72% load", severity: "Warning", lastSeen: "23 sec ago", battery: "63%" },
  { device: "WH-04 / Door sensor", type: "Access", reading: "Open", severity: "Alert", lastSeen: "2 sec ago", battery: "54%" },
];

const Chip: React.FC<{
  children: React.ReactNode;
  tone?: string;
  onClick?: () => void;
  active?: boolean;
}> = ({
  children,
  tone = "bg-slate-50 text-slate-600 border-slate-200",
  onClick,
  active,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
      active ? "bg-slate-900 text-white border-slate-900 shadow-md" : tone
    } ${onClick ? "hover:scale-105 active:scale-95 cursor-pointer" : "cursor-default"}`}
  >
    {children}
  </button>
);

const StatCard: React.FC<MetricCard & { className?: string }> = ({ label, value, note, tone, className = "" }) => (
  <div className={`flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    <div>
      <p className="truncate text-[10px] uppercase tracking-[0.2em] text-slate-500" title={label}>{label}</p>
      <div className="mt-2 flex items-baseline justify-between gap-2 overflow-hidden">
        <p className="truncate text-xl font-black text-slate-900 sm:text-2xl" title={value}>{value}</p>
        {tone && <span className={`h-2 w-12 shrink-0 rounded-full ${tone}`} />}
      </div>
    </div>
    <p className="mt-2 line-clamp-2 text-sm text-slate-500" title={note}>{note}</p>
  </div>
);

const PageShell: React.FC<{
  config: FeatureConfig;
  children: React.ReactNode;
  aside?: React.ReactNode;
}> = ({ config, children, aside }) => {
  const Icon = config.icon;
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className={`h-2 bg-gradient-to-r ${config.accent}`} />
        <div className="grid gap-6 p-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
              <Sparkles size={14} className="text-slate-500" />
              {config.badge}
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${config.accent} text-white shadow-lg`}>
                <Icon size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">{config.title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">{config.summary}</p>
              </div>
            </div>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-500">{config.detail}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reference fit</p>
              <p className="mt-2 text-lg font-bold text-slate-900">Dedicated module page</p>
              <p className="mt-1 text-sm text-slate-600">Each submenu now has its own task flow and UI.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Theme</p>
              <p className="mt-2 text-lg font-bold text-slate-900">Matches the app shell</p>
              <p className="mt-1 text-sm text-slate-600">Uses the same blue/gray surfaces and rounded cards.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">{children}</div>
        {aside && <div className="space-y-6">{aside}</div>}
      </div>
    </div>
  );
};

const FilterBar: React.FC<{
  config: FeatureConfig;
  query?: string;
  onQuery?: (v: string) => void;
  activeFilters?: string[];
  onToggleFilter?: (f: string) => void;
  onClear?: () => void;
}> = ({
  config,
  query,
  onQuery,
  activeFilters = [],
  onToggleFilter,
  onClear,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900">Top filters</h2>
          {(query || activeFilters.length > 0) && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500">Primary filters stay visible. Advanced filters are collapsible.</p>
      </div>
      {onQuery && (
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={`Search ${config.title.toLowerCase()}`}
            className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </div>
      )}
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {config.primaryFilters.map((item) => (
        <Chip
          key={item}
          onClick={onToggleFilter ? () => onToggleFilter(item) : undefined}
          active={activeFilters.includes(item)}
        >
          {item}
        </Chip>
      ))}
    </div>
    <details className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-700">
        Advanced filters
        <ChevronDown size={16} className="text-slate-400" />
      </summary>
      <div className="mt-3 flex flex-wrap gap-2">
        {config.advancedFilters.map((item) => (
          <Chip
            key={item}
            tone="bg-white text-slate-600 border-slate-200"
            onClick={onToggleFilter ? () => onToggleFilter(item) : undefined}
            active={activeFilters.includes(item)}
          >
            {item}
          </Chip>
        ))}
      </div>
    </details>
  </div>
);

const TableCard: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 px-6 py-4">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
    <div className="overflow-x-auto">{children}</div>
  </section>
);

const Pagination: React.FC<{
  total: number;
  page: number;
  limit: number;
  onPageChange: (p: number) => void;
}> = ({ total, page, limit, onPageChange }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
      <div className="text-xs text-slate-500">
        Showing <span className="font-bold">{(page - 1) * limit + 1}</span> to{" "}
        <span className="font-bold">{Math.min(page * limit, total)}</span> of{" "}
        <span className="font-bold">{total}</span> results
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const ForecastPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [toastMsg, setToastMsg] = useState("");

  const dispatch = useAppDispatch();
  const { forecasts, forecastSummary, pagination } = useAppSelector((state) => state.advanced);

  useEffect(() => {
    dispatch(fetchForecasts({ page, limit: 10, search: query, filter: activeFilters[0] }));
  }, [dispatch, page, query, activeFilters]);

  // Reset page when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [query, activeFilters]);

  const forecastsList = useMemo(() => {
    return forecasts.map((f: any) => ({
      id: f._id,
      item: f.productId?.name || "Unknown Item",
      category: f.productId?.category || "General",
      current: f.currentStock || 0,
      forecast: f.demandForecast || 0,
      conf: f.confidence || "0%",
      action: f.action || "Watch",
      unitPrice: f.productId?.purchasePrice || 0
    }));
  }, [forecasts]);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  const filtered = useMemo(() => forecastsList, [forecastsList]);

  const handleAction = (row: any) => {
    const qtyToOrder = Math.max(1, row.forecast - row.current);
    
    dispatch(createPR({
      department: "Production",
      requestedBy: "AI Forecast System",
      date: new Date().toISOString().slice(0, 10),
      requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      justification: `AI Forecast suggest replenishment based on ${row.conf} confidence model.`,
      source: "AI Forecast",
      items: [{
        itemId: row.id,
        itemName: row.item,
        quantity: qtyToOrder,
        estimatedPrice: row.unitPrice
      }]
    }));

    setToastMsg(`Purchase Requisition drafted for ${row.item}.`);
    setTimeout(() => setToastMsg(""), 3000);
  };

  return (
    <PageShell
      config={configs["adv-forecast"]}
      aside={
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Forecast model</h3>
          <p className="mt-1 text-sm text-slate-500">Model output and reference add-ons.</p>
          <div className="mt-4 space-y-3">
            {[
              { label: "Model confidence", value: "92%", tone: "bg-blue-500" },
              { label: "Horizon", value: "6 mo", tone: "bg-indigo-500" },
              { label: "Actions", value: "28 PRs", tone: "bg-cyan-500" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className={`h-2 rounded-full ${item.tone}`}
                    style={{
                      width:
                        item.label === "Actions" ? "84%" : item.label === "Horizon" ? "68%" : "92%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Interconnection</p>
            <p className="mt-2 text-sm text-slate-700">
              Reads stock ledger + order history and feeds stock valuation and replenishment planning.
            </p>
          </div>
        </section>
      }
    >
      <FilterBar
        config={configs["adv-forecast"]}
        query={query}
        onQuery={setQuery}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClear={() => {
          setQuery("");
          setActiveFilters([]);
        }}
      />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 rounded-xl bg-slate-900 px-5 py-3.5 text-white shadow-xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <p className="text-sm font-medium">{toastMsg}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Trend" value={forecastSummary?.trend || "..."} note="Items with rising demand" tone="w-12 bg-blue-500" />
        <StatCard label="Confidence" value={forecastSummary?.confidence || "..."} note="Model variance within threshold" tone="w-12 bg-indigo-500" />
        <StatCard label="Impact" value={forecastSummary?.impact || "..."} note="Items ready for replenishment" tone="w-12 bg-cyan-500" />
        <StatCard label="Coverage" value={forecastSummary?.coverage || "6 mo"} note="Forecast horizon" tone="w-12 bg-slate-900" />
      </div>

      <TableCard title="Forecast output" subtitle="Item-wise demand forecast and action guidance">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-6 py-4">Item</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-right">Current</th>
              <th className="px-6 py-4 text-right">Forecast</th>
              <th className="px-6 py-4 text-right">Confidence</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-900">{row.item}</td>
                <td className="px-6 py-4 text-slate-600">{row.category}</td>
                <td className="px-6 py-4 text-right">{row.current}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">{row.forecast}</td>
                <td className="px-6 py-4 text-right">{row.conf}</td>
                <td className="px-6 py-4">
                  {row.action === "Increase PR" ? (
                    <button
                      onClick={() => handleAction(row)}
                      className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      Draft PR
                    </button>
                  ) : (
                    <Chip tone="bg-slate-50 text-slate-600 border-slate-200">{row.action}</Chip>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          total={pagination?.forecasts?.total ?? 0}
          page={pagination?.forecasts?.page ?? 1}
          limit={pagination?.forecasts?.limit ?? 10}
          onPageChange={setPage}
        />
      </TableCard>
    </PageShell>
  );
};

const AiPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const dispatch = useAppDispatch();
  const { reorderSuggestions, aiSummary, pagination } = useAppSelector((state) => state.advanced);

  useEffect(() => {
    dispatch(fetchReorderSuggestions({ page, limit: 10, search: query, filter: activeFilters[0] }));
  }, [dispatch, page, query, activeFilters]);

  // Reset page when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [query, activeFilters]);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  const filtered = useMemo(() => reorderSuggestions, [reorderSuggestions]);

  return (
    <PageShell
      config={configs["adv-ai"]}
      aside={
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Decision path</h3>
          <p className="mt-1 text-sm text-slate-500">Forecast to suggestion to approval.</p>
          <div className="mt-4 space-y-3">
            {["Forecast intake", "Reorder scoring", "Draft purchase request"].map((step, index) => (
              <div key={step} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{step}</p>
                  <p className="text-sm text-slate-500">Connected to live stock and vendor data.</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      }
    >
      <FilterBar
        config={configs["adv-ai"]}
        query={query}
        onQuery={setQuery}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClear={() => {
          setQuery("");
          setActiveFilters([]);
        }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Auto drafts" value={aiSummary?.autoDrafts.toString() || "0"} note="Purchase requests ready to review" tone="w-12 bg-emerald-500" />
        <StatCard label="High priority" value={aiSummary?.highPriority.toString() || "0"} note="Stock-out risk within lead window" tone="w-12 bg-amber-500" />
        <StatCard label="Confident matches" value={aiSummary?.confidence || "96%"} note="Strong vendor fit" tone="w-12 bg-slate-900" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Priority board</h3>
        <p className="mt-1 text-sm text-slate-500">Distinct lanes for critical, high, and medium reorder needs.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { title: "Critical", count: "4", tone: "bg-rose-50 text-rose-700" },
            { title: "High", count: "7", tone: "bg-amber-50 text-amber-700" },
            { title: "Medium", count: "10", tone: "bg-emerald-50 text-emerald-700" },
          ].map((lane) => (
            <div key={lane.title} className={`rounded-2xl border border-slate-200 p-5 ${lane.tone}`}>
              <p className="text-xs uppercase tracking-[0.2em]">{lane.title}</p>
              <p className="mt-3 text-4xl font-black text-slate-900">{lane.count}</p>
              <p className="mt-2 text-sm text-slate-600">Recommendations waiting for review</p>
            </div>
          ))}
        </div>
      </section>

      <TableCard title="AI reorder queue" subtitle="Recommendations derived from demand, lead times, and stock levels">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-6 py-4">Item</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4 text-right">Qty</th>
              <th className="px-6 py-4">ETA</th>
              <th className="px-6 py-4 text-right">Score</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-900">{row.item}</td>
                <td className="px-6 py-4 text-slate-600">{row.vendor}</td>
                <td className="px-6 py-4 text-right">{row.qty}</td>
                <td className="px-6 py-4">{row.eta}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">{row.score}</td>
                <td className="px-6 py-4 text-slate-600">{row.reason}</td>
                <td className="px-6 py-4">
                  <Chip
                    tone={
                      row.priority === "Critical"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : row.priority === "High"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }
                  >
                    {row.priority}
                  </Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          total={pagination?.reorderSuggestions?.total ?? 0}
          page={pagination?.reorderSuggestions?.page ?? 1}
          limit={pagination?.reorderSuggestions?.limit ?? 10}
          onPageChange={setPage}
        />
      </TableCard>
    </PageShell>
  );
};

const MultiCompanyPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const dispatch = useAppDispatch();
  const { companies, summary, pagination } = useAppSelector((state) => state.advanced);

  useEffect(() => {
    dispatch(fetchCompanies({ page, limit: 10, search: query, filter: activeFilters[0] }));
  }, [dispatch, page, query, activeFilters]);

  // Reset page when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [query, activeFilters]);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  const filtered = useMemo(() => companies, [companies]);

  return (
    <PageShell
      config={configs["adv-multi"]}
      aside={
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Entity map</h3>
          <p className="mt-1 text-sm text-slate-500">Separation with group visibility.</p>
          <div className="mt-4 space-y-3">
            {filtered.map((row) => (
              <div key={row.name} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{row.name}</p>
                  <Chip tone={row.tone}>{row.status}</Chip>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {row.baseCurrency} ledger, {row.warehouses} warehouses
                </p>
              </div>
            ))}
          </div>
        </section>
      }
    >
      <FilterBar
        config={configs["adv-multi"]}
        query={query}
        onQuery={setQuery}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClear={() => {
          setQuery("");
          setActiveFilters([]);
        }}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active entities" value={summary?.activeEntities.toString() || "0"} note="Company-wise inventory isolation" tone="w-12 bg-fuchsia-500" />
        <StatCard label="Warehouses" value={summary?.totalWarehouses.toString() || "0"} note="All entity warehouses combined" tone="w-12 bg-slate-900" />
        <StatCard label="Shared items" value={summary?.totalItems.toLocaleString() || "0"} note="Cross-company item master overlap" tone="w-12 bg-violet-500" />
        <StatCard label="Currency mix" value={summary?.currencyMix.toString() || "0"} note="INR and USD operational scope" tone="w-12 bg-blue-500" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Company cards</h3>
        <p className="mt-1 text-sm text-slate-500">Distinct entity blocks with group-level oversight.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filtered.map((row) => (
            <div
              key={row.name}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div>
                <p className="truncate text-xs font-semibold uppercase tracking-[0.15em] text-slate-500" title={row.name}>
                  {row.name}
                </p>
                <p className="mt-2 truncate text-xl font-black text-slate-900 lg:text-2xl" title={currency.format(row.value || 0)}>
                  {currency.format(row.value || 0)}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-white p-2.5 shadow-sm">
                  <p className="truncate text-[10px] uppercase tracking-wider text-slate-500">Warehouses</p>
                  <p className="mt-0.5 font-bold text-slate-900">{row.warehouses}</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 shadow-sm">
                  <p className="truncate text-[10px] uppercase tracking-wider text-slate-500">Currency</p>
                  <p className="mt-0.5 font-bold text-slate-900">{row.baseCurrency}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <TableCard title="Consolidated matrix" subtitle="Entity-by-entity inventory summary and group roll-up">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4 text-center">Warehouses</th>
              <th className="px-6 py-4">Currency</th>
              <th className="px-6 py-4 text-right">Inventory value</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row) => (
              <tr key={row.name} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-900">{row.name}</td>
                <td className="px-6 py-4 text-center">{row.warehouses}</td>
                <td className="px-6 py-4">{row.baseCurrency}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">{currency.format(row.value || 0)}</td>
                <td className="px-6 py-4">
                  <Chip tone={row.tone}>{row.status}</Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          total={pagination?.companies?.total ?? 0}
          page={pagination?.companies?.page ?? 1}
          limit={pagination?.companies?.limit ?? 10}
          onPageChange={setPage}
        />
      </TableCard>
    </PageShell>
  );
};

const CurrencyPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const dispatch = useAppDispatch();
  const { currencies, currencySummary, pagination } = useAppSelector((state) => state.advanced);

  useEffect(() => {
    dispatch(fetchCurrencies({ page, limit: 10, search: query, filter: activeFilters[0] }));
  }, [dispatch, page, query, activeFilters]);

  // Reset page when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [query, activeFilters]);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  const filtered = useMemo(() => currencies, [currencies]);

  return (
    <PageShell
      config={configs["adv-curr"]}
      aside={
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">FX trail</h3>
          <p className="mt-1 text-sm text-slate-500">Conversion and landed-cost chain.</p>
          <div className="mt-4 space-y-3">
            {[
              { label: "PO cost (Exposure)", value: currencySummary?.liveExposure || 0, tone: "bg-blue-500" },
              { label: "Exchange adjustment", value: currencySummary?.gainLoss || 0, tone: "bg-indigo-500" },
              { label: "Landing and duty", value: (currencySummary?.totalLanded || 0) - (currencySummary?.liveExposure || 0), tone: "bg-cyan-500" },
              { label: "Base currency value", value: currencySummary?.totalLanded || 0, tone: "bg-slate-900" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{item.label}</span>
                  <span>{currency.format(item.value)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className={`h-2 rounded-full ${item.tone}`}
                    style={{ width: `${Math.min(100, (item.value / (currencySummary?.totalLanded || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      }
    >
      <FilterBar
        config={configs["adv-curr"]}
        query={query}
        onQuery={setQuery}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClear={() => {
          setQuery("");
          setActiveFilters([]);
        }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Base currency" value={currencySummary?.baseCurrency || "INR"} note="All valuations normalized" tone="w-12 bg-sky-500" />
        <StatCard
          label="Live exposure"
          value={currency.format(currencySummary?.liveExposure || 0)}
          note="Foreign-currency inventory exposure"
          tone="w-12 bg-indigo-500"
        />
        <StatCard 
          label="FX gain / loss" 
          value={currency.format(currencySummary?.gainLoss || 0)} 
          note="Current net impact" 
          tone="w-12 bg-slate-900" 
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Conversion snapshot</h3>
        <p className="mt-1 text-sm text-slate-500">Top level conversion summary with landed-cost emphasis.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">PO currency</p>
                <p className="mt-2 text-2xl font-black text-slate-900">USD / EUR / JPY</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Rate source</p>
                <p className="mt-2 text-2xl font-black text-slate-900">Live feed</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Reference behavior</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Inventory valuation stays stable in the base currency while rate variance is tracked separately for transparency.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-5 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Matched view</p>
            <p className="mt-2 text-3xl font-black">Landed cost</p>
            <p className="mt-2 text-sm text-white/80">Conversion, freight, and duty stack together before valuation posting.</p>
          </div>
        </div>
      </section>

      <TableCard title="Foreign currency transactions" subtitle="Converted values and gain/loss tracking">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-6 py-4">PO</th>
              <th className="px-6 py-4">Supplier</th>
              <th className="px-6 py-4">Currency</th>
              <th className="px-6 py-4 text-right">Rate</th>
              <th className="px-6 py-4 text-right">Base value</th>
              <th className="px-6 py-4 text-right">Gain/Loss</th>
              <th className="px-6 py-4 text-right">Landed cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row) => (
              <tr key={row.po} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-900">{row.po}</td>
                <td className="px-6 py-4 text-slate-600">{row.supplier}</td>
                <td className="px-6 py-4">{row.currency}</td>
                <td className="px-6 py-4 text-right">{row.rate.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">{currency.format(row.converted)}</td>
                <td className="px-6 py-4 text-right">{currency.format(row.gainLoss)}</td>
                <td className="px-6 py-4 text-right">{currency.format(row.landed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          total={pagination?.currencies?.total ?? 0}
          page={pagination?.currencies?.page ?? 1}
          limit={pagination?.currencies?.limit ?? 10}
          onPageChange={setPage}
        />
      </TableCard>
    </PageShell>
  );
};

const CompliancePage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const dispatch = useAppDispatch();
  const { complianceStatus, complianceSummary, pagination } = useAppSelector((state) => state.advanced);

  useEffect(() => {
    dispatch(fetchComplianceStatus({ page, limit: 10, search: query, filter: activeFilters[0] }));
  }, [dispatch, page, query, activeFilters]);

  // Reset page when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [query, activeFilters]);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  const filtered = useMemo(() => complianceStatus, [complianceStatus]);

  return (
    <PageShell
      config={configs["adv-comp"]}
      aside={
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Rule stack</h3>
          <p className="mt-1 text-sm text-slate-500">Checks that sit before posting.</p>
          <div className="mt-4 space-y-3">
            {["GST validation", "E-Way Bill generation", "Maker-checker", "Regulated item checks"].map((rule) => (
              <div key={rule} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-800">{rule}</span>
                <Chip tone="bg-emerald-50 text-emerald-700 border-emerald-200">Enabled</Chip>
              </div>
            ))}
          </div>
        </section>
      }
    >
      <FilterBar
        config={configs["adv-comp"]}
        query={query}
        onQuery={setQuery}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClear={() => {
          setQuery("");
          setActiveFilters([]);
        }}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="GST ready" value={complianceSummary?.gstReady.toString() || "0"} note="Documents ready for filing" tone="w-12 bg-blue-500" />
        <StatCard label="E-Way queued" value={complianceSummary?.eWayQueued.toString() || "0"} note="Dispatch events waiting" tone="w-12 bg-emerald-500" />
        <StatCard label="Pending checker" value={complianceSummary?.pendingChecker.toString() || "0"} note="Maker-checker queue" tone="w-12 bg-amber-500" />
        <StatCard label="Auto rules" value="32" note="Automated validations active" tone="w-12 bg-slate-900" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Workflow lane</h3>
        <p className="mt-1 text-sm text-slate-500">Compliance states from draft to posting.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {(complianceSummary?.workflowLanes || [
            { title: "Draft", items: 0 },
            { title: "Validate", items: 0 },
            { title: "Approve", items: 0 },
            { title: "Post", items: 0 },
          ]).map((step: any, index: number) => {
            const tones = ["bg-slate-50 text-slate-900", "bg-blue-50 text-blue-700", "bg-amber-50 text-amber-700", "bg-emerald-50 text-emerald-700"];
            return (
              <div key={step.title} className={`rounded-2xl border border-slate-200 p-5 ${tones[index % tones.length]}`}>
                <p className="text-xs uppercase tracking-[0.2em]">Step {index + 1}</p>
                <p className="mt-2 text-2xl font-black">{step.title}</p>
                <p className="mt-1 text-sm opacity-80">{step.items} documents</p>
              </div>
            );
          })}
        </div>
      </section>

      <TableCard title="Compliance workflow" subtitle="Module checkpoints that sit between creation and posting">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-6 py-4">Document</th>
              <th className="px-6 py-4">Module</th>
              <th className="px-6 py-4">Rule</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row) => (
              <tr key={row.doc} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-900">{row.doc}</td>
                <td className="px-6 py-4 text-slate-600">{row.module}</td>
                <td className="px-6 py-4 text-slate-600">{row.rule}</td>
                <td className="px-6 py-4 text-slate-600">{row.status}</td>
                <td className="px-6 py-4 text-slate-600">{row.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          total={pagination?.complianceStatus?.total ?? 0}
          page={pagination?.complianceStatus?.page ?? 1}
          limit={pagination?.complianceStatus?.limit ?? 10}
          onPageChange={setPage}
        />
      </TableCard>
    </PageShell>
  );
};

const IoTPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const dispatch = useAppDispatch();
  const { iotDevices, iotSummary, pagination } = useAppSelector((state) => state.advanced);

  useEffect(() => {
    dispatch(fetchIotDevices({ page, limit: 10, search: query, filter: activeFilters[0] }));
  }, [dispatch, page, query, activeFilters]);

  // Reset page when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [query, activeFilters]);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  const filtered = useMemo(() => iotDevices, [iotDevices]);

  return (
    <PageShell
      config={configs["adv-iot"]}
      aside={
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Warehouse pulse</h3>
          <p className="mt-1 text-sm text-slate-500">Sensors and alerting from the smart warehouse.</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Connectivity</span>
                <Chip tone="bg-cyan-50 text-cyan-700 border-cyan-200">126 devices</Chip>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Online", value: iotSummary?.online.toString() || "0", tone: "bg-emerald-500" },
                  { label: "Warning", value: iotSummary?.warning.toString() || "0", tone: "bg-amber-500" },
                  { label: "Offline", value: ((iotSummary?.total || 0) - (iotSummary?.online || 0) - (iotSummary?.warning || 0)).toString(), tone: "bg-rose-500" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-white p-3 text-center shadow-sm">
                    <div className={`mx-auto h-2 w-10 rounded-full ${item.tone}`} />
                    <p className="mt-3 truncate text-xl font-black text-slate-900" title={item.value}>
                      {item.value}
                    </p>
                    <p
                      className="mt-1 truncate text-[9px] uppercase tracking-wider text-slate-500"
                      title={item.label}
                    >
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Live feed</p>
              <p className="mt-2 text-sm text-slate-700">
                Sensors feed ledger updates and dashboard status in real time.
              </p>
            </div>
          </div>
        </section>
      }
    >
      <FilterBar
        config={configs["adv-iot"]}
        query={query}
        onQuery={setQuery}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClear={() => {
          setQuery("");
          setActiveFilters([]);
        }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Connected devices" value={iotSummary?.total.toString() || "0"} note="Sensors across warehouses" tone="w-12 bg-cyan-500" />
        <StatCard label="Warnings" value={iotSummary?.warning.toString() || "0"} note="Needs attention" tone="w-12 bg-amber-500" />
        <StatCard label="Alerts" value={iotSummary?.alert.toString() || "0"} note="Critical sensor events" tone="w-12 bg-rose-500" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Real-time floor state</h3>
        <p className="mt-1 text-sm text-slate-500">Device health and reading stream arranged like a control room.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="grid grid-cols-4 gap-3">
              {(iotSummary?.floorState || [0, 0, 0, 0]).map((value, idx) => (
                <div key={idx} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex h-36 items-end">
                    <div
                      className="w-full rounded-2xl bg-gradient-to-t from-cyan-600 via-blue-500 to-indigo-400"
                      style={{ height: `${value}%` }}
                    />
                  </div>
                  <p className="mt-3 text-center text-xs font-semibold text-slate-500">
                    {["WH-1", "WH-2", "WH-3", "WH-4"][idx]}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Alert feed</p>
              <div className="mt-3 space-y-2">
              {(iotSummary?.alertFeed || ["No active alerts"]).map(
                  (msg) => (
                    <div key={msg} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {msg}
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Interconnection</p>
              <p className="mt-2 text-sm text-slate-600">
                RTLS, smart shelves, and door events feed the stock ledger and dashboard status cards.
              </p>
            </div>
          </div>
        </div>
      </section>

      <TableCard title="Live sensor status" subtitle="Smart warehouse readings and alerts">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-6 py-4">Device</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4 text-right">Reading</th>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Last seen</th>
              <th className="px-6 py-4 text-right">Battery</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-900">{row.deviceName}</td>
                <td className="px-6 py-4 text-slate-600">{row.deviceType}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">{row.lastReading}</td>
                <td className="px-6 py-4">
                  <Chip
                    tone={
                      row.status === "Alert"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : row.status === "Warning"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }
                  >
                    {row.status}
                  </Chip>
                </td>
                <td className="px-6 py-4 text-slate-600 text-xs">{new Date(row.lastSeen).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-12 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-slate-400"
                        style={{ width: `${row.batteryLevel}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{row.batteryLevel}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          total={pagination?.iotDevices?.total ?? 0}
          page={pagination?.iotDevices?.page ?? 1}
          limit={pagination?.iotDevices?.limit ?? 10}
          onPageChange={setPage}
        />
      </TableCard>
    </PageShell>
  );
};

const CatalogHome: React.FC<{ onPick: (feature: FocusFeature) => void }> = ({ onPick }) => (
  <div className="space-y-6">
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Advanced modules</h2>
      <p className="text-sm text-slate-500">Select a module to inspect its dedicated screen.</p>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {(Object.keys(configs) as FocusFeature[]).map((id) => {
        const cfg = configs[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className={`h-24 rounded-3xl bg-gradient-to-br ${cfg.accent} p-4 text-white`}>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">{cfg.badge}</p>
              <p className="mt-2 text-lg font-bold">{cfg.title}</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{cfg.summary}</p>
            <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-900">
              <span>Open module</span>
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

const AdvancedView: React.FC<{ focusFeature?: FocusFeature }> = ({ focusFeature }) => {
  const [selected, setSelected] = useState<FocusFeature>(focusFeature || "adv-forecast");

  useEffect(() => {
    if (focusFeature) setSelected(focusFeature);
  }, [focusFeature]);

  const page = useMemo(() => {
    switch (selected) {
      case "adv-ai":
        return <AiPage />;
      case "adv-multi":
        return <MultiCompanyPage />;
      case "adv-curr":
        return <CurrencyPage />;
      case "adv-comp":
        return <CompliancePage />;
      case "adv-iot":
        return <IoTPage />;
      case "adv-forecast":
      default:
        return <ForecastPage />;
    }
  }, [selected]);

  if (focusFeature) return page;

  return (
    <div className="space-y-6">
      <CatalogHome onPick={setSelected} />
      {page}
    </div>
  );
};

export default AdvancedView;
