import React, { useState, useEffect } from "react";
import { salesService } from "@/services/salesService";
import {
  FileText,
  Paperclip,
  Loader2,
  Link,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Upload,
  FileUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const CustomerInvoiceView: React.FC = () => {
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal States
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [invoiceRefInput, setInvoiceRefInput] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await salesService.getInvoiceMappings();
      setMappings(data);
    } catch (error) {
      console.error("Failed to load invoice mappings", error);
    }
    setLoading(false);
  };

  const handleFileUpload = async (id: string, file: File) => {
    setUpdatingId(id);
    try {
      await salesService.uploadInvoiceFile(id, file);
      loadData();
      toast.success("Invoice uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    }
    setUpdatingId(null);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Invoiced":
      case "Paid":
      case "Linked":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Partially Invoiced":
      case "Partial":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Overdue":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const openLinkModal = (id: string) => {
    setSelectedMapId(id);
    setInvoiceRefInput("");
    setIsLinkModalOpen(true);
  };

  const handleLinkInvoiceConfirm = async () => {
    if (!selectedMapId || !invoiceRefInput.trim()) return;

    setUpdatingId(selectedMapId);
    setIsLinkModalOpen(false);

    try {
      await salesService.updateInvoiceMapping(selectedMapId, {
        invoiceRef: invoiceRefInput.trim(),
        invoiceStatus: "Invoiced",
        mappingStatus: "Linked",
      });
      loadData();
      toast.success("Invoice reference linked successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to link invoice");
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Link className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Customer Invoice Mapping
              </h2>
              <p className="text-blue-200/80 text-sm font-medium">
                Reconcile dispatches with financial billing records
              </p>
            </div>
          </div>
        </div>

        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Source Ref</th>
                  <th className="px-6 py-5">Customer Entity</th>
                  <th className="px-6 py-5">Value</th>
                  <th className="px-6 py-5">Invoice ID</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2
                          className="animate-spin text-blue-600 mb-2"
                          size={32}
                        />
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                          Syncing Mapping Ledger...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : mappings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="opacity-20 flex flex-col items-center">
                        <FileText size={48} className="mb-2" />
                        <p className="font-black text-lg">No Mappings Found</p>
                        <p className="text-xs">
                          Start by creating a dispatch to trigger mapping logic
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  mappings.map((map) => (
                    <tr
                      key={map.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 leading-none mb-1">
                            {map.soNumber}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            Dispatch: {map.dispatchRef || "PENDING"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-bold text-slate-700">
                        {map.customerName}
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-black text-slate-900">
                          ₹{map.amount?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {map.invoiceRef ? (
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">
                            {map.invoiceRef}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-slate-300 uppercase italic">
                            Awaiting Sync
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2">
                          <span
                            className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border ${getStatusStyle(map.invoiceStatus)}`}
                          >
                            {map.invoiceStatus}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border ${getStatusStyle(map.mappingStatus)}`}
                          >
                            {map.mappingStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {map.invoiceFile?.url ? (
                            <a
                              href={map.invoiceFile.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100"
                              title="View Invoice Document"
                            >
                              <FileText size={18} />
                            </a>
                          ) : (
                            <label className="cursor-pointer p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100">
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) =>
                                  e.target.files?.[0] &&
                                  handleFileUpload(map.id, e.target.files[0])
                                }
                                disabled={updatingId === map.id}
                              />
                              {updatingId === map.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <FileUp size={18} />
                              )}
                            </label>
                          )}

                          <button
                            onClick={() => openLinkModal(map.id)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-transparent hover:border-indigo-100"
                            title="Link External Invoice"
                          >
                            <ExternalLink size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Link Invoice Modal */}
      <Dialog
        open={isLinkModalOpen}
        onOpenChange={setIsLinkModalOpen}
      >
        <DialogContent className="sm:max-w-[425px] bg-white border border-slate-200 shadow-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
              Link External Invoice
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Enter the invoice reference number from your accounting software
              to reconcile this dispatch.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Invoice Reference Number
              </label>
              <Input
                placeholder="e.g. INV-2026-001"
                value={invoiceRefInput}
                onChange={(e) => setInvoiceRefInput(e.target.value)}
                className="font-bold"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLinkInvoiceConfirm}
              disabled={!invoiceRefInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 font-bold"
            >
              Link & Reconcile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legend / Stats */}
      {!loading && mappings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">
                {mappings.filter((m) => m.mappingStatus === "Linked").length}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Fully Reconciled
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">
                {mappings.filter((m) => m.mappingStatus === "Unlinked").length}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Pending Linkage
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl text-red-600">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">
                {mappings.filter((m) => m.invoiceStatus === "Overdue").length}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Payment Overdue
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerInvoiceView;
