import React from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  ChevronDown,
  Database,
  Lightbulb,
  Sparkles,
  Zap,
} from "lucide-react";

type FocusFeature =
  | "adv-forecast"
  | "adv-ai"
  | "adv-multi"
  | "adv-curr"
  | "adv-comp"
  | "adv-iot";

type FeatureConfig = {
  id: FocusFeature;
  title: string;
  parent: string;
  summary: string;
  detail: string;
  filters: string[];
};

const configs: Record<FocusFeature, FeatureConfig> = {
  "adv-forecast": {
    id: "adv-forecast",
    title: "Demand Forecasting",
    parent: "Advanced",
    summary: "Predict future demand using stock movement history and sales patterns.",
    detail:
      "This module reads from stock ledger, item master, and order history. The reference add-ons focus on item, category, warehouse, forecast period, model, and confidence.",
    filters: ["Item", "Category", "Warehouse", "Forecast Period", "Model", "Confidence"],
  },
  "adv-ai": {
    id: "adv-ai",
    title: "AI Reorder Suggestions",
    parent: "Advanced",
    summary: "Turn forecasts into reorder recommendations with lead-time awareness.",
    detail:
      "This module combines forecast output, current stock, open purchase orders, and vendor lead time data to suggest replenishment actions.",
    filters: ["Item", "Category", "Vendor", "Lead Time", "Priority", "Confidence"],
  },
  "adv-multi": {
    id: "adv-multi",
    title: "Multi-Company Inventory",
    parent: "Advanced",
    summary: "View separate company inventories with a consolidated overview.",
    detail:
      "The add-on keeps entity-level ledgers, warehouses, and valuations separate while still allowing group-level reporting.",
    filters: ["Company", "Warehouse", "Currency", "Category", "Status", "Consolidated"],
  },
  "adv-curr": {
    id: "adv-curr",
    title: "Multi-Currency Support",
    parent: "Advanced",
    summary: "Convert foreign purchase costs into the base currency for valuation.",
    detail:
      "This module handles exchange rates, landed cost, and gain/loss tracking so inventory value remains consistent across currencies.",
    filters: ["Currency", "Supplier Country", "PO Date", "Rate Source", "Warehouse", "Gain/Loss"],
  },
  "adv-comp": {
    id: "adv-comp",
    title: "Compliance Automation",
    parent: "Advanced",
    summary: "Automate GST, E-Way Bill, and maker-checker validations.",
    detail:
      "The reference shows a compliance flow between transaction creation and posting with document checks and rule-based automation.",
    filters: ["Document Type", "Status", "Warehouse", "Rule Type", "Due Date", "Auto vs Manual"],
  },
  "adv-iot": {
    id: "adv-iot",
    title: "IoT / Smart Warehouse",
    parent: "Advanced",
    summary: "Blend live warehouse sensor data with stock records.",
    detail:
      "Sensors, RTLS, and smart shelf events feed the stock ledger and dashboard so exceptions can be acted on in real time.",
    filters: ["Warehouse", "Device Type", "Alert Severity", "Last Seen", "Battery", "Offline only"],
  },
};

const featureRows = [
  {
    id: "f1",
    ref: "REF-2026-001",
    status: "Active",
    date: "2026-05-12",
    action: "View",
  },
  {
    id: "f2",
    ref: "REF-2026-002",
    status: "Pending",
    date: "2026-05-11",
    action: "Inspect",
  },
  {
    id: "f3",
    ref: "REF-2026-003",
    status: "Synced",
    date: "2026-05-10",
    action: "Open",
  },
];

const FeatureChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
    {children}
  </span>
);

const AdvancedView: React.FC<{ focusFeature?: FocusFeature }> = ({ focusFeature }) => {
  const config = configs[focusFeature || "adv-forecast"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <Zap className="text-white" size={48} />
              </div>
            </div>
          </div>
          <h1 className="mb-4 text-5xl font-bold text-slate-900">{config.title}</h1>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-slate-600">
            This module is part of the <span className="font-semibold text-blue-600">{config.parent}</span> suite.
          </p>
          <p className="mt-3 text-base text-slate-500">{config.summary}</p>
        </div>

        <div className="mb-8 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Reference add-ons only</p>
              <p className="text-sm text-slate-700">
                Kept the earliest screen structure and added only the filters, interconnection notes, and module-specific content from the references.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.filters.slice(0, 4).map((item) => (
                <FeatureChip key={item}>{item}</FeatureChip>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-12">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <CheckCircle className="text-blue-600" size={24} />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Comprehensive</h3>
            <p className="text-sm text-slate-600">Core screen remains simple and familiar, with the reference content layered in.</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
              <Lightbulb className="text-indigo-600" size={24} />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Interconnected</h3>
            <p className="text-sm text-slate-600">Inventory valuation, stock ledger, reports, and advanced modules remain connected.</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <Database className="text-purple-600" size={24} />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Functional</h3>
            <p className="text-sm text-slate-600">Backend integration remains in place and these pages now act as usable overlays on top.</p>
          </div>
        </div>

        <div className="mb-12 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Sample Data Structure</h2>
                <p className="mt-1 text-sm text-slate-600">Preview of available data fields and formats</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs font-semibold text-slate-700">Mock View</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-100 to-slate-50">
                  <th className="px-8 py-4 font-semibold text-slate-700">ID</th>
                  <th className="px-8 py-4 font-semibold text-slate-700">Reference</th>
                  <th className="px-8 py-4 font-semibold text-slate-700">Status</th>
                  <th className="px-8 py-4 font-semibold text-slate-700">Date</th>
                  <th className="px-8 py-4 font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {featureRows.map((row, index) => (
                  <tr key={row.id} className={`border-slate-100 transition-colors hover:bg-blue-50 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                    <td className="px-8 py-5">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-semibold text-blue-700">
                        #{1000 + index + 1}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-semibold text-slate-900">{row.ref}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-slate-600">{row.date}</td>
                    <td className="px-8 py-5">
                      <button className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700">
                        {row.action}
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-5">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{featureRows.length}</span> of{" "}
              <span className="font-semibold text-slate-900">{featureRows.length}</span> records
            </p>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-shadow hover:shadow-lg">
              Load More
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{config.title} Interconnection</h3>
              <p className="text-sm text-slate-500">Reference add-on summary for backend and module flow.</p>
            </div>
            <Sparkles className="text-blue-500" size={18} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{config.detail}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {config.filters.map((item) => (
              <FeatureChip key={item}>{item}</FeatureChip>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-blue-700">Development Status:</span> The module follows the earlier simple layout and now only carries the extra reference-driven add-ons, validations, and interconnections.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedView;
