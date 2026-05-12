import React, { useEffect, useMemo, useState } from "react";
import { approvalService } from "@/services/approvalService";
import {
  CheckCircle,
  Clock,
  ShoppingCart,
  FlaskConical,
  ArrowLeftRight,
  Check,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  FileText,
  X,
  AlertCircle,
} from "lucide-react";

type ApprovalKind =
  | "Purchase Requisition"
  | "Purchase Order"
  | "GRN"
  | "Stock Adjustment"
  | "Stock Transfer"
  | "Purchase Return"
  | "Sales Return";

interface InboxApproval {
  id: string;
  kind: ApprovalKind;
  reference: string;
  status: string;
  requester: string;
  date: string;
  details: string;
  ageDays: number | null;
}

const typeIcon = (type: ApprovalKind) => {
  if (type.includes("Order") || type.includes("Requisition")) return <ShoppingCart size={15} />;
  if (type === "GRN") return <FlaskConical size={15} />;
  if (type.includes("Adjustment")) return <SlidersHorizontal size={15} />;
  if (type.includes("Transfer")) return <ArrowLeftRight size={15} />;
  if (type.includes("Return")) return <RotateCcw size={15} />;
  return <FileText size={15} />;
};

const typeBg = (type: ApprovalKind) => {
  if (type.includes("Order") || type.includes("Requisition")) return "bg-blue-50 text-blue-500";
  if (type === "GRN") return "bg-amber-50 text-amber-500";
  if (type.includes("Adjustment")) return "bg-orange-50 text-orange-500";
  if (type.includes("Transfer")) return "bg-purple-50 text-purple-500";
  if (type.includes("Return")) return "bg-rose-50 text-rose-500";
  return "bg-slate-50 text-slate-500";
};

const getAgeDays = (dateValue?: string) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
};

const ageLabel = (days: number | null) => {
  if (days === null) return "Age N/A";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
};

const totalQty = (items: { quantity?: number; receivedQty?: number }[] = []) =>
  items.reduce((sum, item) => sum + Number(item.quantity ?? item.receivedQty ?? 0), 0);

const sortInbox = (items: InboxApproval[]) =>
  items.sort((a, b) => (b.ageDays ?? -1) - (a.ageDays ?? -1) || a.kind.localeCompare(b.kind));

const DashboardApprovals: React.FC = () => {
  const [approvals, setApprovals] = useState<InboxApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [
        prs,
        pos,
        grns,
        adjustments,
        transfers,
        purchaseReturns,
        salesReturns,
      ] = await Promise.all([
        approvalService.getPendingPRs(),
        approvalService.getPendingPOs(),
        approvalService.getPendingGRNs(),
        approvalService.getPendingAdjustments(),
        approvalService.getPendingTransfers(),
        approvalService.getPendingPurchaseReturns(),
        approvalService.getPendingSalesReturns(),
      ]);

      const inbox: InboxApproval[] = [
        ...prs.map((pr) => ({
          id: pr.id,
          kind: "Purchase Requisition" as const,
          reference: pr.prNumber || pr.id,
          status: pr.status,
          requester: pr.requestedBy || pr.department || "Requester unavailable",
          date: pr.date,
          details: `${pr.items.length} item(s), qty ${totalQty(pr.items)}`,
          ageDays: getAgeDays(pr.date),
        })),
        ...pos.map((po) => ({
          id: po.id,
          kind: "Purchase Order" as const,
          reference: po.poNumber || po.id,
          status: po.status,
          requester: po.vendorName || "Requester unavailable",
          date: po.date,
          details: `${po.items.length} item(s), amount ${Number(po.totalAmount || 0).toLocaleString("en-IN")}`,
          ageDays: getAgeDays(po.date),
        })),
        ...grns.map((grn) => ({
          id: grn.id,
          kind: "GRN" as const,
          reference: grn.grnNumber || grn.id,
          status: grn.status,
          requester: grn.vendorName || grn.poNumber || "Requester unavailable",
          date: grn.date,
          details: `${grn.items.length} item(s), accepted qty ${grn.items.reduce((sum, item) => sum + Number(item.acceptedQty || 0), 0)}`,
          ageDays: getAgeDays(grn.date),
        })),
        ...adjustments.map((adjustment) => ({
          id: adjustment.id,
          kind: "Stock Adjustment" as const,
          reference: adjustment.reference || adjustment.id,
          status: adjustment.status,
          requester: adjustment.itemName || "Inventory",
          date: adjustment.date,
          details: `${adjustment.impact} ${adjustment.quantity} due to ${adjustment.reason || adjustment.type}`,
          ageDays: getAgeDays(adjustment.date),
        })),
        ...transfers.map((transfer) => ({
          id: transfer.id,
          kind: "Stock Transfer" as const,
          reference: transfer.referenceNo || transfer.id,
          status: transfer.status,
          requester: transfer.sourceWarehouseId || "Warehouse",
          date: transfer.date,
          details: `${transfer.items.length} item(s), qty ${totalQty(transfer.items)}`,
          ageDays: getAgeDays(transfer.date),
        })),
        ...purchaseReturns.map((ret) => ({
          id: ret.id,
          kind: "Purchase Return" as const,
          reference: ret.returnNumber || ret.id,
          status: ret.status,
          requester: ret.vendorName || "Vendor",
          date: ret.date,
          details: `${ret.items.length} item(s), qty ${totalQty(ret.items)}`,
          ageDays: getAgeDays(ret.date),
        })),
        ...salesReturns.map((ret) => ({
          id: ret.id,
          kind: "Sales Return" as const,
          reference: ret.returnNumber || ret.id,
          status: ret.status,
          requester: ret.customerName || "Customer",
          date: ret.date,
          details: `${ret.items.length} item(s), qty ${totalQty(ret.items)}`,
          ageDays: getAgeDays(ret.date),
        })),
      ];

      setApprovals(sortInbox(inbox));
    } catch (err: any) {
      setError(err.message || "Failed to load pending approvals");
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (item: InboxApproval, action: "approve" | "reject") => {
    setProcessingId(item.id);
    setError("");
    try {
      if (item.kind === "Purchase Requisition") {
        action === "approve" ? await approvalService.approvePR(item.id) : await approvalService.rejectPR(item.id);
      } else if (item.kind === "Purchase Order") {
        action === "approve" ? await approvalService.approvePO(item.id) : await approvalService.rejectPO(item.id);
      } else if (item.kind === "GRN") {
        action === "approve" ? await approvalService.approveGRN(item.id) : await approvalService.rejectGRN(item.id);
      } else if (item.kind === "Stock Adjustment") {
        action === "approve" ? await approvalService.approveAdjustment(item.id) : await approvalService.rejectAdjustment(item.id);
      } else if (item.kind === "Stock Transfer") {
        action === "approve" ? await approvalService.approveTransfer(item.id) : await approvalService.rejectTransfer(item.id);
      } else if (item.kind === "Purchase Return") {
        action === "approve" ? await approvalService.approvePurchaseReturn(item.id) : await approvalService.rejectPurchaseReturn(item.id);
      } else {
        action === "approve" ? await approvalService.approveSalesReturn(item.id) : await approvalService.rejectSalesReturn(item.id);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} approval`);
    } finally {
      setProcessingId(null);
    }
  };

  const summary = useMemo(() => {
    const overdue = approvals.filter((item) => (item.ageDays ?? 0) >= 3).length;
    return { total: approvals.length, overdue };
  }, [approvals]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl">
          <CheckCircle size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Pending Approvals
          </h2>
          <p className="text-xs text-slate-400">
            PO, GRN, adjustments, transfers and returns
          </p>
        </div>
        {!loading && (
          <div className="ml-auto flex items-center gap-2">
            {summary.overdue > 0 && (
              <span className="bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                {summary.overdue} aged
              </span>
            )}
            <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
              {summary.total}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

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
                key={`${item.kind}-${item.id}`}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-200 transition-colors"
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${typeBg(item.kind)}`}>
                  {typeIcon(item.kind)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">
                      {item.kind}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      #{item.reference}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-500">
                      {item.status}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                      (item.ageDays ?? 0) >= 3
                        ? "bg-red-50 border-red-100 text-red-600"
                        : "bg-white border-slate-200 text-slate-500"
                    }`}>
                      <Clock size={11} />
                      {ageLabel(item.ageDays)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Requester: {item.requester} | {item.date || "Date unavailable"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {item.details}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleAction(item, "reject")}
                    disabled={!!processingId}
                    className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
                  >
                    <X size={13} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(item, "approve")}
                    disabled={!!processingId}
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-60"
                  >
                    {processingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardApprovals;
