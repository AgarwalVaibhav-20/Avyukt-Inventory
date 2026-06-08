import React, { useEffect, useMemo, useState } from "react";
import { productService } from "@/services/productService";
import { stockControlService } from "@/services/stockControlService";
import type { InventoryItem, StockLedgerEntry } from "@/types";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Filter = "All" | "Fast" | "Slow" | "Non";
type MovementClass = "Fast Moving" | "Slow Moving" | "Non-Moving";
type AbcClass = "A" | "B" | "C";
type XyzClass = "X" | "Y" | "Z";

interface MovementRow {
  itemId: string;
  itemName: string;
  sku: string;
  category: string;
  stock: number;
  outflow30: number;
  outflow90: number;
  movementCount30: number;
  movementCount90: number;
  consumptionValue: number;
  classification: MovementClass;
  abcClass: AbcClass;
  xyzClass: XyzClass;
  priority: string;
  lastMovementDate: string;
}

const filters: { key: Filter; label: string; color: string }[] = [
  { key: "All", label: "All", color: "text-slate-600" },
  { key: "Fast", label: "Fast", color: "text-emerald-600" },
  { key: "Slow", label: "Slow", color: "text-amber-600" },
  { key: "Non", label: "Non-Moving", color: "text-red-600" },
];

const Badge: React.FC<{ cls: MovementClass }> = ({ cls }) => {
  if (cls === "Fast Moving")
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg text-xs font-semibold">
        <TrendingUp size={11} /> Fast
      </span>
    );
  if (cls === "Slow Moving")
    return (
      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg text-xs font-semibold">
        <TrendingDown size={11} /> Slow
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg text-xs font-semibold">
      <MinusCircle size={11} /> Static
    </span>
  );
};

const ClassPill: React.FC<{ label: string; tone: "blue" | "violet" }> = ({ label, tone }) => (
  <span
    className={`inline-flex min-w-6 justify-center rounded-md px-2 py-0.5 text-xs font-bold ${
      tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"
    }`}
  >
    {label}
  </span>
);

const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const getItemStock = (item: InventoryItem) =>
  Number(item.stock ?? item.stocks?.reduce((total, stock) => total + Number(stock.quantity || 0), 0) ?? 0);

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const isValidDate = (value: string) => !Number.isNaN(new Date(value).getTime());

const sumOutflow = (entries: StockLedgerEntry[]) =>
  entries.reduce((total, entry) => total + Math.abs(Math.min(0, Number(entry.quantityChange || 0))), 0);

const getXyzClass = (outEntries90: StockLedgerEntry[]): XyzClass => {
  const buckets = [0, 0, 0];
  const now = Date.now();
  const bucketMs = 30 * 24 * 60 * 60 * 1000;

  outEntries90.forEach((entry) => {
    const date = new Date(entry.date).getTime();
    if (Number.isNaN(date)) return;
    const idx = Math.min(2, Math.max(0, Math.floor((now - date) / bucketMs)));
    buckets[idx] += Math.abs(Number(entry.quantityChange || 0));
  });

  const total = buckets.reduce((sum, value) => sum + value, 0);
  if (total === 0) return "Z";

  const average = total / buckets.length;
  const variance = buckets.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / buckets.length;
  const coefficient = average > 0 ? Math.sqrt(variance) / average : 0;

  if (coefficient <= 0.5) return "X";
  if (coefficient <= 1) return "Y";
  return "Z";
};

const getPriority = (abcClass: AbcClass, xyzClass: XyzClass, classification: MovementClass) => {
  if (abcClass === "A" && xyzClass === "X") return "Replenish first";
  if (abcClass === "A") return "Protect value";
  if (classification === "Non-Moving") return "Review storage";
  if (xyzClass === "Z") return "Plan carefully";
  return "Normal";
};

const buildMovementRows = (items: InventoryItem[], ledger: StockLedgerEntry[]): MovementRow[] => {
  const thirtyDaysAgo = daysAgo(30);
  const ninetyDaysAgo = daysAgo(90);

  const rows = items.map((item) => {
    const itemLedger = ledger.filter((entry) => entry.itemId === item.id);
    const outEntries90 = itemLedger.filter(
      (entry) => entry.quantityChange < 0 && isValidDate(entry.date) && new Date(entry.date) >= ninetyDaysAgo,
    );
    const outEntries30 = outEntries90.filter((entry) => new Date(entry.date) >= thirtyDaysAgo);
    const outflow30 = sumOutflow(outEntries30);
    const outflow90 = sumOutflow(outEntries90);
    const lastMovement = itemLedger
      .filter((entry) => isValidDate(entry.date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;
    const unitCost = Number(item.unitCost ?? item.unitPrice ?? 0);

    return {
      itemId: item.id,
      itemName: item.name || "Unnamed Item",
      sku: item.sku || item.itemCode || "-",
      category: item.category || "Uncategorized",
      stock: getItemStock(item),
      outflow30,
      outflow90,
      movementCount30: outEntries30.length,
      movementCount90: outEntries90.length,
      consumptionValue: outflow90 * unitCost,
      classification: "Non-Moving" as MovementClass,
      abcClass: "C" as AbcClass,
      xyzClass: getXyzClass(outEntries90),
      priority: "Normal",
      lastMovementDate: lastMovement || "N/A",
    };
  });

  const positiveOutflows = rows.map((row) => row.outflow30).filter(Boolean).sort((a, b) => a - b);
  const fastThreshold = positiveOutflows.length
    ? Math.max(1, positiveOutflows[Math.floor(positiveOutflows.length * 0.75)])
    : 1;

  rows.forEach((row) => {
    if (row.outflow30 >= fastThreshold && row.outflow30 > 0) {
      row.classification = "Fast Moving";
    } else if (row.outflow90 > 0) {
      row.classification = "Slow Moving";
    }
  });

  const totalValue = rows.reduce((sum, row) => sum + row.consumptionValue, 0);
  let cumulative = 0;
  rows
    .slice()
    .sort((a, b) => b.consumptionValue - a.consumptionValue)
    .forEach((row) => {
      cumulative += row.consumptionValue;
      const share = totalValue > 0 ? cumulative / totalValue : 1;
      row.abcClass = share <= 0.8 ? "A" : share <= 0.95 ? "B" : "C";
    });

  rows.forEach((row) => {
    row.priority = getPriority(row.abcClass, row.xyzClass, row.classification);
  });

  return rows.sort((a, b) => {
    const classOrder: Record<MovementClass, number> = { "Fast Moving": 0, "Slow Moving": 1, "Non-Moving": 2 };
    return classOrder[a.classification] - classOrder[b.classification] || b.consumptionValue - a.consumptionValue;
  });
};

const DashboardMovement: React.FC = () => {
  const [data, setData] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [items, ledger] = await Promise.all([
        productService.getAllItems(),
        stockControlService.getLedger(),
      ]);
      setData(buildMovementRows(items, ledger));
    } catch (err: any) {
      setError(err.message || "Failed to load movement analysis");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = data.filter((d) => {
    const matchesFilter =
      filter === "All" ||
      (filter === "Fast" && d.classification === "Fast Moving") ||
      (filter === "Slow" && d.classification === "Slow Moving") ||
      (filter === "Non" && d.classification === "Non-Moving");

    const matchesSearch =
      d.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || d.category === selectedCategory;

    return matchesFilter && matchesSearch && matchesCategory;
  });

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(data.map((d) => d.category)))],
    [data],
  );

  const summary = useMemo(
    () => ({
      fast: data.filter((d) => d.classification === "Fast Moving").length,
      slow: data.filter((d) => d.classification === "Slow Moving").length,
      non: data.filter((d) => d.classification === "Non-Moving").length,
      value: data.reduce((sum, row) => sum + row.consumptionValue, 0),
    }),
    [data],
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-500 p-2 rounded-xl">
            <Activity size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Movement Analysis
            </h2>
            <p className="text-xs text-slate-400">
              Live ledger based Fast/Slow/Non-Moving, ABC and XYZ analysis
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <Input
              placeholder="Search item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-40 text-xs"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1 gap-0.5">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filter === f.key
                    ? `bg-white shadow-sm ${f.color}`
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-[10px] font-bold uppercase text-emerald-600">Fast</p>
          <p className="text-xl font-bold text-emerald-900">{summary.fast}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
          <p className="text-[10px] font-bold uppercase text-amber-600">Slow</p>
          <p className="text-xl font-bold text-amber-900">{summary.slow}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-3">
          <p className="text-[10px] font-bold uppercase text-red-600">Non-Moving</p>
          <p className="text-xl font-bold text-red-900">{summary.non}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-[10px] font-bold uppercase text-blue-600">90d Consumption Value</p>
          <p className="text-xl font-bold text-blue-900">INR {fmt(summary.value)}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wide">
              <th className="px-4 py-3 font-semibold">Item</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Last Moved</th>
              <th className="px-4 py-3 text-center font-semibold">30d Outflow</th>
              <th className="px-4 py-3 text-center font-semibold">Frequency</th>
              <th className="px-4 py-3 text-center font-semibold">ABC</th>
              <th className="px-4 py-3 text-center font-semibold">XYZ</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-300">
                  <Loader2 size={22} className="animate-spin-slow inline" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                  No items found
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.itemId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{item.itemName}</p>
                    <p className="text-slate-400 font-mono text-[10px] mt-0.5">
                      {item.sku} | Stock: {fmt(item.stock)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.category}</td>
                  <td className="px-4 py-3 text-slate-400">{item.lastMovementDate}</td>
                  <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">
                    {fmt(item.outflow30)}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500">
                    {item.movementCount30}/30d
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ClassPill label={item.abcClass} tone="blue" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ClassPill label={item.xyzClass} tone="violet" />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.priority}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge cls={item.classification} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardMovement;
