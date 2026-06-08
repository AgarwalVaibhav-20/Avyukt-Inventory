import React, { useEffect, useState } from "react";
import { stockControlService } from "@/services/stockControlService";
import { AlertTriangle, CheckCircle, Loader2, RefreshCcw } from "lucide-react";

const CostRecalculationView: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [method, setMethod] = useState<"FIFO" | "LIFO" | "Avg">("FIFO");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadMethod();
  }, []);

  const loadMethod = async () => {
    try {
      const current = await stockControlService.getValuationMethod();
      setMethod(current);
    } catch (err: any) {
      setError(err?.message || "Failed to load valuation method");
    }
  };

  const handleRun = async () => {
    setStatus("processing");
    setError(null);
    try {
      const time = await stockControlService.recalculateCosts();
      setStatus("success");
      setLastRun(time);
    } catch (err: any) {
      setStatus("idle");
      setError(err?.message || "Failed to run cost recalculation");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <RefreshCcw size={32} className={`text-blue-600 ${status === "processing" ? "animate-spin-slow" : ""}`} />
        </div>

        <h2 className="mb-2 text-2xl font-bold text-slate-800">Cost Recalculation Utility</h2>
        <p className="mx-auto mb-8 max-w-xl text-slate-500">
          Trigger a manual recalculation of item costs using the active valuation method ({method}). This keeps current inventory value aligned with the stock ledger.
        </p>

        {status === "idle" && (
          <button
            onClick={handleRun}
            className="rounded-xl bg-blue-600 px-8 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            Run Recalculation
          </button>
        )}

        {status === "processing" && (
          <div className="space-y-3">
            <p className="font-medium text-blue-600 animate-pulse">Processing stock ledger...</p>
            <div className="mx-auto h-2 w-64 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full animate-pulse bg-blue-500" />
            </div>
            <p className="text-xs text-slate-400">Synchronizing valuation, closing stock, and COGS dependencies.</p>
          </div>
        )}

        {status === "success" && (
          <div className="animate-fade-in">
            <div className="mb-2 flex items-center justify-center gap-2 text-lg font-bold text-green-600">
              <CheckCircle size={24} /> Recalculation Complete
            </div>
            <p className="text-sm text-slate-400">Last successful run: {lastRun}</p>
            <button onClick={() => setStatus("idle")} className="mt-6 text-sm font-semibold text-blue-600 hover:underline">
              Run Again
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3 items-start">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={20} />
          <div>
            <h4 className="text-sm font-bold text-amber-800">System Note</h4>
            <p className="mt-1 text-xs text-amber-700">
              Running this utility during peak hours may affect performance. It is recommended during maintenance windows or off-peak times.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-800">Interconnection</h3>
        <p className="mt-2 text-sm text-slate-500">
          Recalculation updates valuation methods, item-wise value, closing stock reports, and COGS views in the same workflow.
        </p>
      </div>
    </div>
  );
};

export default CostRecalculationView;
