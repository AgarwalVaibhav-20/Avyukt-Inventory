import React, { useEffect, useMemo, useState } from "react";
import { productService } from "@/services/productService";
import { stockControlService } from "@/services/stockControlService";
import type { InventoryItem, InOutSummary, StockLedgerEntry } from "@/types";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  TrendingDown,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PeriodMode = "daily" | "weekly" | "monthly";

interface FlowRow extends InOutSummary {
  netQty: number;
  netValue: number;
}

const periodOptions: { key: PeriodMode; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const formatDay = (date: Date) =>
  date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const formatMonth = (date: Date) =>
  date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

const getWeekStart = (date: Date) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const makePeriodBuckets = (mode: PeriodMode) => {
  const now = startOfDay(new Date());
  const buckets: { key: string; label: string }[] = [];

  if (mode === "daily") {
    for (let i = 13; i >= 0; i -= 1) {
      const date = addDays(now, -i);
      const key = date.toISOString().slice(0, 10);
      buckets.push({ key, label: formatDay(date) });
    }
    return buckets;
  }

  if (mode === "weekly") {
    const currentWeek = getWeekStart(now);
    for (let i = 7; i >= 0; i -= 1) {
      const start = addDays(currentWeek, -i * 7);
      const end = addDays(start, 6);
      const key = start.toISOString().slice(0, 10);
      buckets.push({ key, label: `${formatDay(start)}-${formatDay(end)}` });
    }
    return buckets;
  }

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({ key, label: formatMonth(date) });
  }
  return buckets;
};

const getPeriodKey = (date: Date, mode: PeriodMode) => {
  if (mode === "daily") return date.toISOString().slice(0, 10);
  if (mode === "weekly") return getWeekStart(date).toISOString().slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const buildFlowRows = (
  mode: PeriodMode,
  ledger: StockLedgerEntry[],
  items: InventoryItem[],
): FlowRow[] => {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const buckets = makePeriodBuckets(mode);
  const summaryMap = new Map<string, FlowRow>();

  buckets.forEach((bucket) => {
    summaryMap.set(bucket.key, {
      period: bucket.label,
      inwardQty: 0,
      outwardQty: 0,
      inwardValue: 0,
      outwardValue: 0,
      netQty: 0,
      netValue: 0,
    });
  });

  ledger.forEach((entry) => {
    const date = new Date(entry.date);
    if (Number.isNaN(date.getTime())) return;

    const row = summaryMap.get(getPeriodKey(date, mode));
    if (!row) return;

    const quantityChange = Number(entry.quantityChange || 0);
    const item = itemById.get(entry.itemId);
    const cost = Number(item?.unitCost ?? item?.unitPrice ?? 0);
    const sale = Number(item?.salePrice ?? item?.unitPrice ?? cost);

    if (quantityChange > 0) {
      row.inwardQty += quantityChange;
      row.inwardValue += quantityChange * cost;
    } else if (quantityChange < 0) {
      const qty = Math.abs(quantityChange);
      row.outwardQty += qty;
      row.outwardValue += qty * sale;
    }
  });

  return Array.from(summaryMap.values()).map((row) => ({
    ...row,
    netQty: row.inwardQty - row.outwardQty,
    netValue: row.inwardValue - row.outwardValue,
  }));
};

const DashboardInOut: React.FC = () => {
  const [ledger, setLedger] = useState<StockLedgerEntry[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [mode, setMode] = useState<PeriodMode>("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [ledgerData, itemData] = await Promise.all([
        stockControlService.getLedger(),
        productService.getAllItems(),
      ]);
      setLedger(ledgerData);
      setItems(itemData);
    } catch (err: any) {
      setError(err.message || "Failed to load inward/outward summary");
      setLedger([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => buildFlowRows(mode, ledger, items), [mode, ledger, items]);

  const totals = useMemo(
    () =>
      summary.reduce(
        (acc, row) => ({
          inwardQty: acc.inwardQty + row.inwardQty,
          outwardQty: acc.outwardQty + row.outwardQty,
          netQty: acc.netQty + row.netQty,
          inwardValue: acc.inwardValue + row.inwardValue,
          outwardValue: acc.outwardValue + row.outwardValue,
          netValue: acc.netValue + row.netValue,
        }),
        { inwardQty: 0, outwardQty: 0, netQty: 0, inwardValue: 0, outwardValue: 0, netValue: 0 },
      ),
    [summary],
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 text-blue-500 p-2 rounded-xl">
            <ArrowDownToLine size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Inward vs Outward
            </h2>
            <p className="text-xs text-slate-400">
              Goods received, dispatched and net inventory flow
            </p>
          </div>
        </div>

        <div className="sm:ml-auto flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1 gap-0.5">
          {periodOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setMode(option.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === option.key
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-[10px] font-bold uppercase text-emerald-600">Received</p>
            <p className="text-xl font-bold text-emerald-900">{fmt(totals.inwardQty)}</p>
            <p className="text-xs text-emerald-700">INR {fmt(totals.inwardValue)}</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50 p-3">
            <p className="text-[10px] font-bold uppercase text-red-600">Dispatched</p>
            <p className="text-xl font-bold text-red-900">{fmt(totals.outwardQty)}</p>
            <p className="text-xs text-red-700">INR {fmt(totals.outwardValue)}</p>
          </div>
          <div className={`rounded-xl border p-3 ${totals.netQty >= 0 ? "border-blue-100 bg-blue-50" : "border-amber-100 bg-amber-50"}`}>
            <p className={`text-[10px] font-bold uppercase ${totals.netQty >= 0 ? "text-blue-600" : "text-amber-600"}`}>Net Flow</p>
            <p className={`text-xl font-bold ${totals.netQty >= 0 ? "text-blue-900" : "text-amber-900"}`}>
              {totals.netQty >= 0 ? "+" : ""}{fmt(totals.netQty)}
            </p>
            <p className={`text-xs ${totals.netQty >= 0 ? "text-blue-700" : "text-amber-700"}`}>
              INR {fmt(totals.netValue)}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-300">
          <Loader2 size={24} className="animate-spin-slow" />
        </div>
      ) : (
        <>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={summary} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [fmt(Number(value)), name]}
                />
                <Legend iconType="circle" iconSize={8} formatter={(val) => <span className="text-xs text-slate-500">{val}</span>} />
                <Bar dataKey="inwardQty" fill="#10b981" radius={[6, 6, 0, 0]} name="Received Qty" />
                <Bar dataKey="outwardQty" fill="#ef4444" radius={[6, 6, 0, 0]} name="Dispatched Qty" />
                <Line type="monotone" dataKey="netQty" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} name="Net Qty" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wide">
                  <th className="px-4 py-3 font-semibold">Period</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <span className="flex items-center justify-end gap-1 text-emerald-600">
                      <ArrowDownToLine size={11} /> In Qty
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-emerald-600">In Value</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <span className="flex items-center justify-end gap-1 text-red-500">
                      <ArrowUpFromLine size={11} /> Out Qty
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-red-500">Out Value</th>
                  <th className="px-4 py-3 text-right font-semibold text-blue-600">Net Qty</th>
                  <th className="px-4 py-3 text-right font-semibold text-blue-600">Net Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summary.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-700">{row.period}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{fmt(row.inwardQty)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">INR {fmt(row.inwardValue)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{fmt(row.outwardQty)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-500">INR {fmt(row.outwardValue)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${row.netQty >= 0 ? "text-blue-600" : "text-amber-600"}`}>
                      <span className="inline-flex items-center justify-end gap-1">
                        {row.netQty >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {row.netQty >= 0 ? "+" : ""}{fmt(row.netQty)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${row.netValue >= 0 ? "text-blue-600" : "text-amber-600"}`}>
                      INR {fmt(row.netValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardInOut;
