import React, { useEffect, useMemo, useState } from "react";
import { dashboardService } from "@/services/dashboardService";
import { warehouseService } from "@/services/warehouseService";
import { Batch } from "@/types";
import {
  AlertTriangle,
  CalendarX,
  ShieldCheck,
  Loader2,
  MapPin,
  Package,
} from "lucide-react";

type Threshold = 7 | 30 | 90;

type ExpiryBatch = Batch & {
  warehouse?: string;
  warehouseId?: string;
  warehouseName?: string;
  location?: string;
};

const thresholds: { value: Threshold; label: string }[] = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

const getDaysToExpiry = (expiryDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
};

const statusFor = (days: number) => {
  if (days < 0) return { label: "Expired", card: "border-red-200 bg-red-50", pill: "bg-red-200 text-red-800" };
  if (days <= 7) return { label: `${days}d left`, card: "border-amber-200 bg-amber-50", pill: "bg-amber-200 text-amber-800" };
  if (days <= 30) return { label: `${days}d left`, card: "border-orange-100 bg-orange-50", pill: "bg-orange-100 text-orange-700" };
  return { label: `${days}d left`, card: "border-slate-200 bg-slate-50", pill: "bg-slate-200 text-slate-700" };
};

const DashboardExpiry: React.FC = () => {
  const [batches, setBatches] = useState<ExpiryBatch[]>([]);
  const [warehouseNames, setWarehouseNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState<Threshold>(30);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [expiryData, warehouses] = await Promise.all([
        dashboardService.getExpiryAlerts(),
        warehouseService.getAllWarehouses().catch(() => []),
      ]);

      const names = new Map<string, string>();
      warehouses.forEach((warehouse) => {
        names.set(String(warehouse.id), warehouse.name);
        const raw = warehouse as typeof warehouse & { _id?: string };
        if (raw._id) names.set(String(raw._id), warehouse.name);
      });

      setWarehouseNames(names);
      setBatches(expiryData as ExpiryBatch[]);
    } catch (err: any) {
      setError(err.message || "Failed to load expiry alerts");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const visibleBatches = useMemo(
    () =>
      batches
        .filter((batch) => batch.expiryDate)
        .filter((batch) => {
          const days = getDaysToExpiry(batch.expiryDate);
          return days <= threshold;
        })
        .sort((a, b) => getDaysToExpiry(a.expiryDate) - getDaysToExpiry(b.expiryDate)),
    [batches, threshold],
  );

  const counts = useMemo(
    () => ({
      seven: batches.filter((batch) => batch.expiryDate && getDaysToExpiry(batch.expiryDate) <= 7).length,
      thirty: batches.filter((batch) => batch.expiryDate && getDaysToExpiry(batch.expiryDate) <= 30).length,
      ninety: batches.filter((batch) => batch.expiryDate && getDaysToExpiry(batch.expiryDate) <= 90).length,
    }),
    [batches],
  );

  const getLocation = (batch: ExpiryBatch) => {
    const warehouse =
      batch.warehouseName ||
      batch.warehouse ||
      (batch.warehouseId ? warehouseNames.get(String(batch.warehouseId)) : "");
    const location = batch.location || "";
    return [warehouse, location].filter(Boolean).join(" / ") || "Location unavailable";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 text-red-500 p-2 rounded-xl">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Expiry Alerts</h2>
            <p className="text-xs text-slate-400">
              Batch-wise expiry, location and quantity by threshold
            </p>
          </div>
        </div>

        <div className="sm:ml-auto flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1 gap-0.5">
          {thresholds.map((option) => (
            <button
              key={option.value}
              onClick={() => setThreshold(option.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                threshold === option.value
                  ? "bg-white shadow-sm text-red-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-[10px] font-bold uppercase text-amber-600">7 days</p>
            <p className="text-xl font-bold text-amber-900">{counts.seven}</p>
          </div>
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
            <p className="text-[10px] font-bold uppercase text-orange-600">30 days</p>
            <p className="text-xl font-bold text-orange-900">{counts.thirty}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">90 days</p>
            <p className="text-xl font-bold text-slate-900">{counts.ninety}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-300">
          <Loader2 size={24} className="animate-spin-slow" />
        </div>
      ) : visibleBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 bg-emerald-50 rounded-xl">
          <ShieldCheck size={28} className="text-emerald-400" />
          <p className="text-sm text-emerald-600 font-medium">
            No expiry risks detected for this threshold
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleBatches.map((batch) => {
            const days = getDaysToExpiry(batch.expiryDate);
            const status = statusFor(days);

            return (
              <div key={batch.id} className={`rounded-xl border p-4 ${status.card}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs bg-white/70 border border-white px-2 py-0.5 rounded-md text-slate-600">
                    {batch.batchNumber || "Batch N/A"}
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${status.pill}`}>
                    <CalendarX size={11} />
                    {status.label}
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-800 truncate">
                  {batch.itemName}
                </p>

                <div className="mt-3 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5">
                      <Package size={12} className="text-slate-400" />
                      Qty
                    </span>
                    <strong className="text-slate-700">{batch.quantity}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Expiry</span>
                    <span className="font-medium text-slate-700">{batch.expiryDate}</span>
                  </div>
                  <div className="flex items-start gap-1.5 pt-1 text-slate-500">
                    <MapPin size={12} className="mt-0.5 flex-shrink-0 text-slate-400" />
                    <span className="line-clamp-2">{getLocation(batch)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardExpiry;
