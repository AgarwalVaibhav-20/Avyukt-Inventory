import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPRs } from "@/store/slices/procurementSlice";
import { procurementService } from "@/services/procurementService";
import { productService } from "@/services/productService";
import { PurchaseRequisition, InventoryItem, HSN } from "@/types";
import { NotionSelect } from "@/components/common/NotionSelect";
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  Package,
  User,
  Building2,
  Calendar,
  Send,
  Loader2,
  ArrowRight,
  Rocket,
  Edit3,
  Trash2,
  SendIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Pagination from "@/components/common/Pagination";
import { useListControls } from "@/hooks/useListControls";

const PurchaseRequisitionView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { prs, loading, error } = useAppSelector((state) => state.procurement);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPrId, setEditingPrId] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [hsns, setHsns] = useState<HSN[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [prSearch, setPrSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    source: "all",
    sortOrder: "newest",
  });
  const [newPr, setNewPr] = useState({
    department: "",
    requestedBy: "",
    requiredDate: "",
    justification: "",
    items: [] as {
      itemName: string;
      quantity: number;
      hsnCode: string;
      taxRate: number;
    }[],
  });

  useEffect(() => {
    dispatch(fetchPRs());
    loadItems();
    loadHSNs();
  }, [dispatch]);

  const loadHSNs = async () => {
    try {
      const data = await productService.getHSN();
      setHsns(data);
    } catch (e) {
      console.error("Failed to load HSNs", e);
    }
  };

  const loadItems = async () => {
    const data = await productService.getAllItems();
    setItems(data);
  };

  const addItemToPr = (item: InventoryItem) => {
    if (newPr.items.find((i) => i.itemId === item.id)) return;
    setNewPr({
      ...newPr,
      items: [
        ...newPr.items,
        {
          itemId: item.id,
          itemName: item.name,
          quantity: 1,
          hsnCode: item.hsnCode || '',
          taxRate: item.taxRate || 0,
        },
      ],
    });
  };

  const updateItemQty = (index: number, qty: number) => {
    const updated = [...newPr.items];
    updated[index].quantity = Math.max(1, qty);
    setNewPr({ ...newPr, items: updated });
  };

  const updateItemHSN = (index: number, code: string) => {
    const updated = [...newPr.items];
    const hsn = hsns.find(h => (h.code === code || (h as any).hsnCode === code));
    updated[index].hsnCode = code;
    if (hsn) {
      updated[index].taxRate = hsn.taxRate ?? (hsn as any).taxPercentage ?? 0;
    }
    setNewPr({ ...newPr, items: updated });
  };

  const updateItemTax = (index: number, rate: number) => {
    const updated = [...newPr.items];
    updated[index].taxRate = rate;
    setNewPr({ ...newPr, items: updated });
  };

  const handleDragStart = (e: React.DragEvent, item: InventoryItem) => {
    e.dataTransfer.setData("item", JSON.stringify(item));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemData = e.dataTransfer.getData("item");
    if (itemData) {
      const item = JSON.parse(itemData) as InventoryItem;
      addItemToPr(item);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleEdit = (pr: PurchaseRequisition) => {
    setNewPr({
      department: pr.department,
      requestedBy: pr.requestedBy,
      requiredDate: pr.requiredDate,
      justification: pr.justification,
      items: pr.items.map((i) => ({
        itemId: i.itemId,
        itemName: i.itemName,
        quantity: i.quantity,
        hsnCode: i.hsnCode || '',
        taxRate: i.taxRate || 0,
      })),
    });
    setEditingPrId(pr.id);
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this requisition?"))
      return;
    try {
      await procurementService.deletePR(id);
      dispatch(fetchPRs());
      alert("Requisition deleted successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to delete requisition.");
    }
  };

  const handleSendToApproval = async (id: string) => {
    try {
      await procurementService.updatePR(id, { status: "Pending Approval" });
      dispatch(fetchPRs());
      alert("Requisition sent for approval!");
    } catch (e) {
      console.error(e);
      alert("Failed to send PR for approval.");
    }
  };

  const handleSubmit = async () => {
    if (!newPr.department || !newPr.requestedBy || newPr.items.length === 0) {
      alert("Please fill all required fields and add at least one item.");
      return;
    }

    try {
      if (editingPrId) {
        await procurementService.updatePR(editingPrId, {
          ...newPr,
          date: new Date().toISOString(),
        });
        alert("Purchase Requisition updated successfully.");
      } else {
        await procurementService.createPR({
          ...newPr,
          date: new Date().toISOString(),
          source: "Manual",
        });
        alert("Purchase Requisition submitted for approval.");
      }
      setShowCreateModal(false);
      setEditingPrId(null);
      setNewPr({
        department: "",
        requestedBy: "",
        requiredDate: "",
        justification: "",
        items: [],
      });
      dispatch(fetchPRs());
    } catch (e) {
      console.error(e);
      alert("Failed to save PR.");
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const {
    filteredItems: filteredPRs,
    pagedItems: pagedPRs,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  } = useListControls({
    items: prs,
    searchTerm: prSearch,
    filters,
    initialPageSize: 10,
    searchFn: (pr, term) =>
      (pr.prNumber || "").toLowerCase().includes(term) ||
      (pr.department || "").toLowerCase().includes(term) ||
      (pr.requestedBy || "").toLowerCase().includes(term) ||
      (pr.justification || "").toLowerCase().includes(term) ||
      (pr.status || "").toLowerCase().includes(term) ||
      (pr.source || "").toLowerCase().includes(term) ||
      pr.items.some((item) => (item.itemName || "").toLowerCase().includes(term)),
    filterFn: (pr, activeFilters) => {
      const matchesStatus =
        activeFilters.status === "all" || pr.status === activeFilters.status;
      const matchesSource =
        activeFilters.source === "all" || pr.source === activeFilters.source;

      return matchesStatus && matchesSource;
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100">
            <ClipboardList size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Purchase Requisitions
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Internal demand planning and approval workflow.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-7 rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-3 text-base font-bold transition-all active:scale-95"
        >
          <Plus size={20} /> New Requisition
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Total Requests",
            value: prs.length,
            icon: FileText,
            color: "blue",
          },
          {
            label: "Pending Approval",
            value: prs.filter((p) => p.status === "Pending Approval").length,
            icon: Clock,
            color: "amber",
          },
          {
            label: "Approved",
            value: prs.filter((p) => p.status === "Approved").length,
            icon: CheckCircle2,
            color: "emerald",
          },
          {
            label: "Rejected",
            value: prs.filter((p) => p.status === "Rejected").length,
            icon: XCircle,
            color: "red",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-none shadow-sm bg-white overflow-hidden group"
          >
            <CardContent className="p-6 relative">
              <div
                className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-${stat.color}-50 rounded-full transition-transform group-hover:scale-110`}
              />
              <div className="relative z-10 flex items-center gap-4">
                <div
                  className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl`}
                >
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PR List Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search PR, department, requester, item..."
              value={prSearch}
              onChange={(e) => setPrSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Filter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    status: e.target.value,
                  }))
                }
                className="appearance-none pl-11 pr-9 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-600"
              >
                <option value="all">All statuses</option>
                <option value="Draft">Draft</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="PO Created">PO Created</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <select
              value={filters.source}
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  source: e.target.value,
                }))
              }
              className="appearance-none px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-600"
            >
              <option value="all">All sources</option>
              <option value="Manual">Manual</option>
              <option value="Stock Alert">Stock Alert</option>
              <option value="Production Plan">Production Plan</option>
            </select>
            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />
            <select
              value={filters.sortOrder}
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  sortOrder: e.target.value,
                }))
              }
              className="appearance-none px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-600"
            >
              <option value="newest">Newest first</option>
              <option value="earliest">Earliest first</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-left">PR Identifier</th>
                <th className="px-8 py-6 text-left">Department / User</th>
                <th className="px-8 py-6 text-left">Justification</th>
                <th className="px-8 py-6 text-left">Items</th>
                <th className="px-8 py-6 text-left">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="mx-auto animate-spin text-indigo-600" size={32} />
                    <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">
                      Loading requisitions...
                    </p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <AlertCircle className="mx-auto mb-4 text-red-400" size={36} />
                    <p className="text-sm font-bold text-red-500">{error}</p>
                  </td>
                </tr>
              ) : filteredPRs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <ClipboardList className="mx-auto mb-4 text-slate-200" size={48} />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-400">
                      No requisitions match the current filters
                    </p>
                  </td>
                </tr>
              ) : pagedPRs.map((pr) => (
                <tr
                  key={pr.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-8 py-7">
                    <div className="font-mono font-black text-indigo-600 text-base">
                      {pr.prNumber}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                      {pr.date}
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-800">
                          {pr.requestedBy}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          {pr.department}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <p className="text-sm text-slate-600 line-clamp-2 max-w-xs italic leading-relaxed">
                      "{pr.justification}"
                    </p>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex -space-x-2">
                      {pr.items.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-lg bg-white border-2 border-slate-50 flex items-center justify-center text-slate-400 shadow-sm"
                          title={item.itemName}
                        >
                          <Package size={14} />
                        </div>
                      ))}
                      {pr.items.length > 3 && (
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                          +{pr.items.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <Badge
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                        pr.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : pr.status === "Rejected"
                            ? "bg-red-50 text-red-700 border-red-100"
                            : pr.status === "Pending Approval"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-slate-50 text-slate-500 border-slate-100"
                      }`}
                    >
                      {pr.status}
                    </Badge>
                  </td>
                  <td className="px-8 py-7 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {(pr.status === "Pending Approval" ||
                        pr.status === "Draft") && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(pr)}
                            className="rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all p-2"
                          >
                            <Edit3 size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pr.id)}
                            className="rounded-xl hover:bg-red-50 hover:text-red-600 transition-all p-2"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendToApproval(pr.id)}
                        className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all p-2"
                        disabled={pr.status !== "Pending Approval"}
                      >
                        <SendIcon size={18} className={pr.status === "Pending Approval" ? "text-emerald-500" : "text-slate-400"} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalItems > 0 && (
          <div className="px-8 py-4 border-t border-slate-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      {/* Modern Drag & Drop Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[1200px] rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col h-[85vh]">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
                  <Plus size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    New Requisition Plan
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    Inventory Management System
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-3 bg-white hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all shadow-sm border border-slate-100"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left Panel: Item Search & Sidebar */}
              <div className="w-[380px] border-r border-slate-100 bg-slate-50/50 flex flex-col">
                <div className="p-6 space-y-4">
                  <div className="relative">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Search Master Data..."
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.15em] mb-1">
                      Pro Tip
                    </p>
                    <p className="text-[11px] text-indigo-500 font-medium leading-relaxed">
                      Drag items from the list below and drop them into the
                      "Requested Items" area to add them to your plan.
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onClick={() => addItemToPr(item)}
                      className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <Package size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            SKU: {item.sku}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel: Form & Drop Zone */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                  {/* Basic Info Section */}
                  <section className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Department *
                      </label>
                      <input
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        placeholder="e.g. Warehouse"
                        value={newPr.department}
                        onChange={(e) =>
                          setNewPr({ ...newPr, department: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Requested By *
                      </label>
                      <input
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        placeholder="Employee Name"
                        value={newPr.requestedBy}
                        onChange={(e) =>
                          setNewPr({ ...newPr, requestedBy: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Required Date *
                      </label>
                      <input
                        type="date"
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        value={newPr.requiredDate}
                        onChange={(e) =>
                          setNewPr({ ...newPr, requiredDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Justification *
                      </label>
                      <textarea
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[80px] resize-none"
                        placeholder="Describe the need for these items..."
                        value={newPr.justification}
                        onChange={(e) =>
                          setNewPr({ ...newPr, justification: e.target.value })
                        }
                      />
                    </div>
                  </section>

                  {/* Drop Zone & Items Section */}
                  <section className="space-y-6">
                    <div className="flex justify-between items-end px-2">
                      <div>
                        <h3 className="text-xl font-black text-slate-900">
                          Requested Items
                        </h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                          Plan Breakdown
                        </p>
                      </div>
                      <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                        {newPr.items.length} SKUs Identified
                      </span>
                    </div>

                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className={`min-h-[300px] border-4 border-dashed rounded-[2.5rem] p-6 transition-all flex flex-col ${
                        newPr.items.length === 0
                          ? "border-slate-100 bg-slate-50 items-center justify-center"
                          : "border-indigo-100 bg-indigo-50/10"
                      }`}
                    >
                      {newPr.items.length === 0 ? (
                        <div className="text-center">
                          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50">
                            <Plus className="text-slate-200" size={40} />
                          </div>
                          <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                            Drop Items Here to Add
                          </p>
                          <p className="text-[11px] text-slate-300 mt-2">
                            Or search and click items on the left sidebar
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 w-full">
                          {newPr.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-5 rounded-[2rem] border border-indigo-100/50 shadow-xl shadow-indigo-100/10 flex items-center gap-6 animate-in slide-in-from-right-4 duration-300"
                            >
                              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                <Package size={24} />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-black text-slate-900 text-lg leading-tight">
                                  {item.itemName}
                                </h5>
                                <div className="flex flex-wrap gap-4 mt-2">
                                  <div className="flex flex-col gap-1 min-w-[120px]">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">HSN / SAC</label>
                                    <NotionSelect 
                                      value={item.hsnCode} 
                                      onValueChange={(val) => updateItemHSN(idx, val)}
                                      placeholder="Select HSN"
                                      options={hsns.map(h => ({
                                        label: `${h.code || (h as any).hsnCode} — ${h.taxRate ?? (h as any).taxPercentage ?? 0}%`,
                                        value: h.code || (h as any).hsnCode
                                      }))}
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1 w-20">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GST %</label>
                                    <input 
                                      type="number"
                                      className="h-9 bg-slate-50 border-2 border-slate-100 rounded-lg px-2 text-xs font-bold text-slate-700 focus:bg-white outline-none"
                                      value={item.taxRate}
                                      onChange={(e) => updateItemTax(idx, Number(e.target.value))}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 bg-slate-50 p-2 pr-6 rounded-2xl">
                                <div className="flex flex-col items-center gap-1">
                                  <button
                                    onClick={() =>
                                      updateItemQty(idx, item.quantity + 1)
                                    }
                                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                                  >
                                    <Plus size={14} />
                                  </button>
                                  <input
                                    type="number"
                                    className="w-16 bg-white border-2 border-slate-200 rounded-xl p-2 text-center text-base font-black text-slate-800 focus:border-indigo-500 outline-none shadow-sm"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      updateItemQty(idx, Number(e.target.value))
                                    }
                                  />
                                  <button
                                    onClick={() =>
                                      updateItemQty(idx, item.quantity - 1)
                                    }
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <XCircle size={14} className="rotate-45" />
                                  </button>
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                  Units
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  setNewPr({
                                    ...newPr,
                                    items: newPr.items.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  })
                                }
                                className="p-4 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                              >
                                <XCircle size={24} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Modal Footer */}
                <div className="p-8 border-t border-slate-100 flex gap-6 bg-slate-50/30">
                  <button
                    className="flex-1 rounded-[1.5rem] py-6 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Discard Changes
                  </button>
                  <button
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] py-6 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all active:scale-95"
                    onClick={handleSubmit}
                  >
                    <Rocket size={20} />
                    Finalize Requisition Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequisitionView;
