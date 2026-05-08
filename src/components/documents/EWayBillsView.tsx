import React, { useState, useEffect } from "react";
import { documentService } from "@/services/documentService";
import { salesService } from "@/services/salesService";
import { EWayBill } from "@/types";
import {
  Truck,
  Plus,
  ExternalLink,
  Loader2,
  Search,
  Filter,
  ShieldCheck,
  MapPin,
  Calendar,
  FileText,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  X,
  MoreVertical,
} from "lucide-react";
import toast from "react-hot-toast";

const EWayBillsView: React.FC = () => {
  const [bills, setBills] = useState<EWayBill[]>([]);
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [form, setForm] = useState({
    challanId: "",
    challanRef: "",
    transporter: "",
    vehicleNo: "",
    fromPlace: "Main Warehouse",
    toPlace: "",
    goodsValue: 0,
    validUntil: "",
    status: "Active",
  });

  useEffect(() => {
    loadBills();
  }, [page, statusFilter]);

  useEffect(() => {
    loadChallans();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else loadBills();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const result = await documentService.getEWayBills({
        page,
        limit,
        search: searchTerm,
        status: statusFilter,
      });
      setBills(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      toast.error("Failed to load permits");
    }
    setLoading(false);
  };

  const loadChallans = async () => {
    try {
      const cData = await salesService.getWorkflowChallans();
      setChallans(
        cData.filter(
          (c: any) => c.status === "Generated" || c.status === "Dispatched",
        ),
      );
    } catch (err) {
      console.error("Failed to load challans", err);
    }
  };

  const handleSelectChallan = (cid: string) => {
    const challan = challans.find((c) => (c.id || c._id) === cid);
    if (challan) {
      setForm({
        ...form,
        challanId: cid,
        challanRef: challan.challanNo || "",
        toPlace: challan.customer || "",
        goodsValue: (challan.items || []).reduce(
          (sum: number, i: any) => sum + i.packedQty * (i.unitPrice || 0),
          0,
        ),
      });
    }
  };

  const handleCreateOrUpdate = async () => {
    if (
      (!form.challanId && !editingId) ||
      !form.transporter ||
      !form.vehicleNo
    ) {
      return toast.error("Please fill mandatory transport details.");
    }

    setActionLoading(true);
    try {
      if (editingId) {
        await documentService.updateEWayBill(editingId, {
          ...form,
          goodsValue: Number(form.goodsValue),
        });
        toast.success("E-Way Bill updated successfully");
      } else {
        const challan = challans.find(
          (c) => (c.id || c._id) === form.challanId,
        );
        await documentService.createEWayBill({
          challanRef: challan?.challanNo || form.challanRef || "",
          transporter: form.transporter,
          vehicleNo: form.vehicleNo,
          fromPlace: form.fromPlace,
          toPlace: form.toPlace,
          goodsValue: form.goodsValue,
          generated: new Date().toISOString(),
          validUntil:
            form.validUntil ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: "Active",
        });
        toast.success("E-Way Bill generated successfully");
      }
      resetForm();
      loadBills();
    } catch (error: any) {
      toast.error(error.message || "Failed to process request");
    }
    setActionLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel/delete this permit?"))
      return;

    try {
      await documentService.deleteEWayBill(id);
      toast.success("Permit deleted");
      loadBills();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const startEdit = (bill: any) => {
    setEditingId(bill.id || bill._id);
    setForm({
      challanId: bill.challanId || "",
      challanRef: bill.challanRef || "",
      transporter: bill.transporter || "",
      vehicleNo: bill.vehicleNo || "",
      fromPlace: bill.fromPlace || "Main Warehouse",
      toPlace: bill.toPlace || "",
      goodsValue: bill.goodsValue || 0,
      validUntil: bill.validUntil
        ? new Date(bill.validUntil).toISOString().split("T")[0]
        : "",
      status: bill.status || "Active",
    });
    setIsCreating(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setForm({
      challanId: "",
      challanRef: "",
      transporter: "",
      vehicleNo: "",
      fromPlace: "Main Warehouse",
      toPlace: "",
      goodsValue: 0,
      validUntil: "",
      status: "Active",
    });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in fade-in duration-700">
        {/* Premium Header */}
        <div className="bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl -ml-32 -mb-32"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl group transition-transform hover:scale-105 duration-300">
                <ShieldCheck
                  className="text-purple-300 group-hover:text-white transition-colors"
                  size={40}
                />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  E-Way Bill Compliance
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 font-bold uppercase tracking-widest">
                    Live Ledger
                  </span>
                </h2>
                <p className="text-purple-200/70 text-lg font-medium mt-1">
                  Authorized transit permits for regional & global logistics
                </p>
              </div>
            </div>
            <button
              onClick={() => (isCreating ? resetForm() : setIsCreating(true))}
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl transition-all font-black text-sm flex items-center justify-center gap-3 shadow-2xl ${
                isCreating
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-white text-indigo-950 hover:bg-indigo-50"
              }`}
            >
              {isCreating ? (
                <>
                  <X size={20} /> Cancel Entry
                </>
              ) : (
                <>
                  <Plus
                    size={20}
                    className="group-hover:rotate-90 transition-transform duration-300"
                  />{" "}
                  Generate New Permit
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-10">
          {isCreating && (
            <div className="bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-10 mb-10 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                <TrendingUp size={240} className="text-purple-900" />
              </div>

              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Plus size={24} className="text-purple-600" />
                  </div>
                  {editingId
                    ? "Modify Transit Permit"
                    : "New Permit Application"}
                </h3>
                {editingId && (
                  <span className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                    Editing: {form.challanRef}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                {!editingId && (
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                      Source Challan <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all shadow-sm"
                      value={form.challanId}
                      onChange={(e) => handleSelectChallan(e.target.value)}
                    >
                      <option value="">Select Document</option>
                      {challans.map((c) => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.challanNo}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    Transporter <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all shadow-sm"
                    placeholder="Logistics Agency Name"
                    value={form.transporter}
                    onChange={(e) =>
                      setForm({ ...form, transporter: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    Vehicle Registration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all shadow-sm"
                    placeholder="e.g. DL-01-XX-0000"
                    value={form.vehicleNo}
                    onChange={(e) =>
                      setForm({ ...form, vehicleNo: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    Valid Until <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all shadow-sm"
                    value={form.validUntil}
                    onChange={(e) =>
                      setForm({ ...form, validUntil: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-200 pt-10">
                <div className="flex flex-wrap gap-8">
                  <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Declared Goods Value
                    </p>
                    <p className="font-black text-2xl text-slate-900">
                      ₹{form.goodsValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm min-w-[200px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Destination Hub
                    </p>
                    <p className="font-black text-lg text-indigo-600 truncate max-w-[250px]">
                      {form.toPlace || "TBD"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={resetForm}
                    className="px-8 py-4 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-200 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleCreateOrUpdate}
                    disabled={actionLoading}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm hover:shadow-2xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center gap-3 active:scale-95"
                  >
                    {actionLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <ShieldCheck size={20} />
                    )}
                    {editingId
                      ? "Update Legal Permit"
                      : "Sign & Generate Permit"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters & Search */}
          <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-2xl">
              <Search
                className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by Permit No, Transporter, or Challan Ref..."
                className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-base font-bold focus:bg-white focus:border-indigo-500/20 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex bg-slate-50 p-1 rounded-2xl border-2 border-slate-50">
                {["", "Active", "Expired", "Cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      statusFilter === status
                        ? "bg-white text-indigo-600 shadow-lg shadow-indigo-500/10"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {status || "All Permits"}
                  </button>
                ))}
              </div>
              <button className="p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-slate-500 hover:text-indigo-600 hover:bg-white transition-all">
                <Filter size={20} />
              </button>
            </div>
          </div>

          {/* Table Data */}
          <div className="overflow-hidden rounded-[2rem] border-2 border-slate-100 shadow-sm relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <Loader2
                    className="animate-spin text-indigo-600 mb-2"
                    size={40}
                  />
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                    Refreshing Ledger...
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Permit Ledger
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Source Ref
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Transport Hub
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Compliance Metadata
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                      Lifecycle
                    </th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-32 text-center">
                        <div className="flex flex-col items-center opacity-40">
                          <FileText size={64} className="text-slate-300 mb-4" />
                          <p className="text-lg font-black text-slate-400 uppercase tracking-widest">
                            Compliance Ledger Empty
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    bills.map((b) => (
                      <tr
                        key={b.id || b._id}
                        className="group hover:bg-slate-50/80 transition-all duration-300"
                      >
                        <td className="px-10 py-7">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-xl tracking-tighter mb-1 group-hover:text-indigo-600 transition-colors">
                              {b.ewbNo}
                            </span>
                            <div className="flex items-center gap-2">
                              <Calendar size={12} className="text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(
                                  b.generated || b.createdAt,
                                ).toLocaleDateString(undefined, {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm font-black text-slate-700 text-xs">
                            <FileText className="text-indigo-400" size={16} />
                            {b.challanRef}
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Truck className="text-slate-500" size={16} />
                              </div>
                              <span className="font-black text-slate-800 text-sm">
                                {b.transporter}
                              </span>
                            </div>
                            <span className="ml-10 text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg w-fit shadow-sm">
                              {b.vehicleNo}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                              <MapPin size={14} className="text-indigo-400" />{" "}
                              {b.toPlace || "HUB-CENTRAL"}
                            </div>
                            <div
                              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                                new Date(b.validUntil) < new Date()
                                  ? "text-rose-500"
                                  : "text-emerald-600"
                              }`}
                            >
                              <Calendar size={14} /> Expires:{" "}
                              {new Date(b.validUntil).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7 text-center">
                          <span
                            className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border-2 ${
                              b.status === "Active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : b.status === "Expired"
                                  ? "bg-amber-50 text-amber-700 border-amber-100"
                                  : "bg-red-50 text-red-700 border-red-100"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(b)}
                              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-90"
                              title="Modify Permit"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(b.id || b._id)}
                              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-90"
                              title="Cancel Permit"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-slate-50/50 p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Showing <span className="text-slate-900">{bills.length}</span>{" "}
                of <span className="text-slate-900">{total}</span> compliant
                records
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-90"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-12 h-12 rounded-2xl text-sm font-black transition-all ${
                          page === p
                            ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20"
                            : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-90"
                >
                  <ChevronRightIcon size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Advisory */}
      {/* <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 flex flex-col md:flex-row gap-10 items-center shadow-xl shadow-slate-100">
            <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center border-2 border-amber-100 shrink-0">
                <AlertCircle className="text-amber-600" size={48}/>
            </div>
            <div className="flex-1">
                <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Compliance Enforcement Notice</h4>
                <p className="text-slate-500 text-base leading-relaxed font-medium">
                    E-Way Bill generation is a statutory requirement for all dispatches exceeding ₹50,000. 
                    Incorrect transporter details or expired permits can result in significant penalties and seizure of goods by tax authorities. 
                    Ensure that the <span className="font-black text-indigo-600">Valid Until</span> date accurately reflects the travel distance as per GST regulations.
                </p>
            </div>
            <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm whitespace-nowrap hover:bg-slate-800 transition-all shadow-lg">
                View Compliance Rules
            </button>
        </div> */}
    </div>
  );
};

export default EWayBillsView;
