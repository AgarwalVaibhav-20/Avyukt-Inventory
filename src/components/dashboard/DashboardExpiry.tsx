import React, { useState, useEffect } from "react";
import { dashboardService } from "@/services/dashboardService";
import { Batch } from "@/types";
import { AlertTriangle, CalendarX, ShieldCheck, Loader2 } from "lucide-react";

const DashboardExpiry: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await dashboardService.getExpiryAlerts();
    setBatches(data);
    setLoading(false);
  };

  const today = new Date();

  const getDiff = (expiryDate: string) => {
    const exp = new Date(expiryDate);
    return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-red-50 text-red-500 p-2 rounded-xl">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Expiry Alerts</h2>
          <p className="text-xs text-slate-400">
            Items expiring within 30 days
          </p>
        </div>
        {!loading && batches.length > 0 && (
          <span className="ml-auto bg-red-50 text-red-500 text-xs font-bold px-2.5 py-1 rounded-full">
            {batches.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-300">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 bg-emerald-50 rounded-xl">
          <ShieldCheck size={28} className="text-emerald-400" />
          <p className="text-sm text-emerald-600 font-medium">
            No expiry risks detected
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {batches.map((b) => {
            const diff = getDiff(b.expiryDate);
            const isExpired = diff < 0;
            const isCritical = diff >= 0 && diff <= 7;

            return (
              <div
                key={b.id}
                className={`rounded-xl border p-4 ${
                  isExpired
                    ? "border-red-200 bg-red-50"
                    : isCritical
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-slate-50"
                }`}
              >
                {/* Badge row */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs bg-white/70 border border-white px-2 py-0.5 rounded-md text-slate-600">
                    {b.batchNumber}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                      isExpired
                        ? "bg-red-200 text-red-800"
                        : isCritical
                          ? "bg-amber-200 text-amber-800"
                          : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    <CalendarX size={11} />
                    {isExpired ? "EXPIRED" : `${diff}d left`}
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-800 truncate">
                  {b.itemName}
                </p>

                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span>
                    Qty:{" "}
                    <strong className="text-slate-700">{b.quantity}</strong>
                  </span>
                  <span>{b.expiryDate}</span>
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
