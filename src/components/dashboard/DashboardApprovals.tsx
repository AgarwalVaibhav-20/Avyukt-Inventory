import React, { useState, useEffect } from "react";
import { dashboardService } from "@/services/dashboardService";
import { ApprovalItem } from "@/types";
import {
  CheckCircle,
  Clock,
  ShoppingCart,
  FlaskConical,
  ArrowLeftRight,
  Check,
  Loader2,
} from "lucide-react";

const typeIcon = (type: string) => {
  if (type.includes("Order")) return <ShoppingCart size={15} />;
  if (type.includes("QC")) return <FlaskConical size={15} />;
  return <ArrowLeftRight size={15} />;
};

const typeBg = (type: string) => {
  if (type.includes("Order")) return "bg-blue-50 text-blue-500";
  if (type.includes("QC")) return "bg-amber-50 text-amber-500";
  return "bg-purple-50 text-purple-500";
};

const DashboardApprovals: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await dashboardService.getPendingApprovals();
    setApprovals(data);
    setLoading(false);
  };

  const handleApprove = (id: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl">
          <CheckCircle size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Pending Approvals
          </h2>
          <p className="text-xs text-slate-400">
            Purchase Orders, GRN QC & Stock Transfers
          </p>
        </div>
        {!loading && (
          <span className="ml-auto bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            {approvals.length}
          </span>
        )}
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-300">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
            <CheckCircle size={32} />
            <p className="text-sm text-slate-400">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-200 transition-colors"
              >
                {/* Icon */}
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${typeBg(item.type)}`}
                >
                  {typeIcon(item.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">
                      {item.type}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      #{item.reference}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-500">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.initiator} · {item.date}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {item.details}
                  </p>
                </div>

                {/* Action */}
                <button
                  onClick={() => handleApprove(item.id)}
                  className="shrink-0 flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
                >
                  <Check size={13} />
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardApprovals;
