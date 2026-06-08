import React, { useEffect, useState } from "react";
import { stockControlService } from "@/services/stockControlService";
import { CheckCircle2, Info, Loader2, RefreshCcw, Settings } from "lucide-react";

const ValuationMethodsView: React.FC = () => {
  const [method, setMethod] = useState<"FIFO" | "LIFO" | "Avg">("FIFO");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await stockControlService.getValuationMethod();
      setMethod(m);
    } catch (err: any) {
      setError(err?.message || "Failed to load valuation method");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (m: "FIFO" | "LIFO" | "Avg") => {
    setSaving(true);
    setError(null);
    try {
      await stockControlService.setValuationMethod(m);
      setMethod(m);
    } catch (err: any) {
      setError(err?.message || "Failed to save valuation method");
    } finally {
      setSaving(false);
    }
  };

  const methods = [
    {
      id: "FIFO",
      label: "First In, First Out (FIFO)",
      desc: "Old stock leaves first, ideal for fast-moving and perishable inventory.",
      tone: "border-emerald-200 bg-emerald-50",
    },
    {
      id: "LIFO",
      label: "Last In, First Out (LIFO)",
      desc: "Latest stock leaves first, useful in specific tax or pricing strategies.",
      tone: "border-orange-200 bg-orange-50",
    },
    {
      id: "Avg",
      label: "Weighted Average Cost",
      desc: "Smooths out price swings by averaging inventory cost across receipts.",
      tone: "border-blue-200 bg-blue-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Settings className="text-slate-600" size={20} /> Inventory Valuation Method
            </h2>
            <p className="text-sm text-slate-500">
              Select the costing rule used for stock value calculation and reporting.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Active method</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{method === "Avg" ? "Weighted Average" : method}</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
          Changing the valuation method triggers a recalculation of current inventory value. Historical closing stock reports keep their original method.
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">
            <Loader2 className="mx-auto mb-3 animate-spin-slow text-blue-600" />
            Loading settings...
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {methods.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void handleSave(item.id as "FIFO" | "LIFO" | "Avg")}
                disabled={saving}
                className={`relative flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                  method === item.id ? `${item.tone} border-current` : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div
                  className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                    method === item.id ? "border-blue-600 bg-blue-600" : "border-slate-300"
                  }`}
                >
                  {method === item.id && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">{item.label}</h3>
                  <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                </div>
                {method === item.id && <CheckCircle2 className="absolute right-4 top-4 text-blue-600" size={20} />}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <Info className="shrink-0 text-blue-500" size={18} />
              <p className="text-xs text-slate-600">
                The method is shared across item-wise valuation, closing stock, and COGS. It also feeds the recalculation job.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCcw size={16} />
            Reload
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default ValuationMethodsView;
