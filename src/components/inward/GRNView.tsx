import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPOs, fetchGRNs } from "@/store/slices/procurementSlice";
import { procurementService } from "@/services/procurementService";
import { warehouseService } from "@/services/warehouseService";
import { PurchaseOrder, GRN, GRNItem, Warehouse } from "@/types";
import {
  ArrowDownToLine,
  Loader2,
  CheckSquare,
  Search,
  Truck,
  Box,
  FileText,
  AlertCircle,
  RefreshCw,
  MapPin,
  ClipboardList,
  PackageCheck,
  Filter,
  ChevronDown,
} from "lucide-react";
import Pagination from "@/components/common/Pagination";
import { useListControls } from "@/hooks/useListControls";

// ─── shadcn-style primitive helpers ──────────────────────────────────────────

type BadgeVariant = "default" | "success" | "warning" | "danger" | "outline";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-600 border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50  text-amber-700  border-amber-200",
  danger: "bg-red-50    text-red-700    border-red-200",
  outline: "bg-white     text-slate-600  border-slate-300",
};

const Badge: React.FC<{
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}> = ({ variant = "default", className = "", children }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[11px] font-semibold tracking-wide ${badgeVariants[variant]} ${className}`}
  >
    {children}
  </span>
);

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = "",
  children,
}) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const CardHeader: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = "", children }) => (
  <div className={`px-6 py-4 border-b border-slate-100 ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = "", children }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

const Label: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = "",
  children,
}) => (
  <span
    className={`block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ${className}`}
  >
    {children}
  </span>
);

const inputBase =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 font-medium " +
  "placeholder:text-slate-400 outline-none transition " +
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const selectBase = `${inputBase} appearance-none pr-8`;

const Divider: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`h-px w-full bg-slate-100 ${className}`} />
);

// ─── Status badge helper ──────────────────────────────────────────────────────

function statusBadge(status: string) {
  if (status === "Put Away Completed")
    return <Badge variant="success">{status}</Badge>;
  if (status === "Pending QC" || status === "Pending")
    return <Badge variant="warning">{status}</Badge>;
  if (status === "Rejected") return <Badge variant="danger">{status}</Badge>;
  return <Badge variant="default">{status}</Badge>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const GRNView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { pos, grns, loading, error } = useAppSelector(
    (state) => state.procurement,
  );
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Creation state
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [challanNo, setChallanNo] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [receivedItems, setReceivedItems] = useState<GRNItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    sortOrder: "newest",
  });

  useEffect(() => {
    dispatch(fetchPOs());
    dispatch(fetchGRNs());
    loadWarehouses();
  }, [dispatch]);

  const loadWarehouses = async () => {
    try {
      const data = await warehouseService.getAllWarehouses();
      setWarehouses(data);
      if (data.length > 0) setSelectedLocation(data[0].id);
    } catch (e) {
      console.error("Failed to load warehouses", e);
    }
  };

  const handlePOSelect = (poId: string) => {
    const po = pos.find((p) => p.id === poId);
    if (!po) return;
    setSelectedPO(po);
    const initItems: GRNItem[] = po.items.map((i) => ({
      itemId: i.itemId,
      itemName: i.itemName,
      poQty: i.quantity,
      receivedQty: Math.max(0, i.quantity - (i.receivedQty || 0)),
      acceptedQty: 0,
      rejectedQty: 0,
      hsnCode: i.hsnCode,
      taxRate: i.taxRate,
      unitPrice: i.unitPrice,
    }));
    setReceivedItems(initItems);
  };

  const updateReceivedQty = (index: number, val: number) => {
    const newItems = [...receivedItems];
    newItems[index].receivedQty = val;
    setReceivedItems(newItems);
  };

  const updateItemField = (index: number, field: keyof GRNItem, value: string) => {
    const newItems = [...receivedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setReceivedItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedPO || !challanNo)
      return alert("Please select a PO and enter Challan Number");
    if (!selectedLocation)
      return alert("Please select a storage location (Warehouse)");
    if (receivedItems.every((i) => i.receivedQty <= 0))
      return alert("Please enter received quantity for at least one item");

    setSubmitting(true);
    try {
      await procurementService.createGRN(
        selectedPO.id,
        challanNo,
        receivedItems.filter((i) => i.receivedQty > 0),
        selectedLocation,
      );
      setSelectedPO(null);
      setChallanNo("");
      dispatch(fetchPOs());
      dispatch(fetchGRNs());
      alert("GRN created successfully and sent to Quality Queue.");
    } catch (e: any) {
      console.error(e);
      const msg =
        e.response?.data?.message || e.message || "Failed to create GRN";
      alert(`Error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const {
    filteredItems: filteredGrns,
    pagedItems: pagedGrns,
    page,
    totalPages,
    totalItems,
    setPage,
  } = useListControls({
    items: grns,
    searchTerm: search,
    filters,
    initialPageSize: 8,
    searchFn: (grn, term) =>
      grn.grnNumber.toLowerCase().includes(term) ||
      (grn.poNumber || "").toLowerCase().includes(term) ||
      (grn.challanNumber || "").toLowerCase().includes(term) ||
      (grn.status || "").toLowerCase().includes(term),
    filterFn: (grn, activeFilters) =>
      activeFilters.status === "all" || grn.status === activeFilters.status,
  });

  const pendingQCCount = filteredGrns.filter(
    (g) => g.status === "Pending QC",
  ).length;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
            <ArrowDownToLine size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Inward Dock (GRN)
            </h1>
            <p className="text-[13px] text-slate-500">
              Receive and verify inbound supplier shipments
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            dispatch(fetchPOs());
            dispatch(fetchGRNs());
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors active:scale-[.98]"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sync
        </button>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left: Form panel ── */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Truck size={16} className="text-blue-600 shrink-0" />
                <h2 className="text-sm font-semibold text-slate-800">
                  Material Receipt
                </h2>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* PO select */}
              <div>
                <Label>
                  <ClipboardList
                    size={11}
                    className="inline mr-1 mb-0.5 text-slate-400"
                  />
                  Purchase Order Reference{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <select
                    className={selectBase}
                    value={selectedPO?.id || ""}
                    onChange={(e) => handlePOSelect(e.target.value)}
                  >
                    <option value="">Select a pending order…</option>
                    {pos
                      .filter((po) =>
                        [
                          "Approved",
                          "Sent",
                          "Sent to Vendor",
                          "Partial",
                          "Partially Received",
                          "Open",
                        ].includes(po.status),
                      )
                      .map((po) => {
                        const totalQty =
                          po.items?.reduce(
                            (sum, item) => sum + (item.quantity || 0),
                            0,
                          ) || 0;
                        return (
                          <option key={po.id} value={po.id}>
                            {po.poNumber} — {po.vendorName} ({totalQty} units)
                          </option>
                        );
                      })}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              {/* Expanded form when PO is selected */}
              {selectedPO && (
                <div className="space-y-5 animate-fade-in">
                  {/* Supplier info card */}
                  <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
                        Supplier
                      </span>
                      <span className="text-[11px] text-blue-400 font-mono">
                        #{selectedPO.id.slice(-6)}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      {selectedPO.vendorName}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <Badge variant="outline">
                        <FileText size={10} className="mr-1 text-blue-400" />{" "}
                        {selectedPO.date}
                      </Badge>
                      {selectedPO.deliveryDate && (
                        <Badge variant="outline">
                          <Truck size={10} className="mr-1 text-blue-400" />{" "}
                          {selectedPO.deliveryDate}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        <Box size={10} className="mr-1 text-blue-400" />{" "}
                        {selectedPO.items.length} SKUs
                      </Badge>
                    </div>
                  </div>

                  {/* Challan number */}
                  <div>
                    <Label>
                      <FileText
                        size={11}
                        className="inline mr-1 mb-0.5 text-slate-400"
                      />
                      Challan / Invoice No{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="text"
                      className={inputBase}
                      value={challanNo}
                      onChange={(e) => setChallanNo(e.target.value)}
                      placeholder="e.g. CHN-2024-001"
                    />
                  </div>

                  {/* Warehouse */}
                  <div>
                    <Label>
                      <MapPin
                        size={11}
                        className="inline mr-1 mb-0.5 text-slate-400"
                      />
                      Unloading Warehouse{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <select
                        className={selectBase}
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                      >
                        <option value="">Select receiving location</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Item verification */}
                  <div>
                    <Label>
                      <PackageCheck
                        size={11}
                        className="inline mr-1 mb-0.5 text-slate-400"
                      />
                      Item Verification
                    </Label>

                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {receivedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[13px] font-semibold text-slate-800 leading-snug">
                              {item.itemName}
                            </span>
                            <Box
                              size={13}
                              className="text-slate-300 mt-0.5 shrink-0"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[12px] text-slate-500">
                              Ordered:{" "}
                              <span className="font-semibold text-slate-700">
                                {item.poQty}
                              </span>
                            </span>
                            {item.hsnCode && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">
                                HSN: {item.hsnCode} ({item.taxRate}%)
                              </span>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-blue-600">
                                Received:
                              </span>
                              <input
                                type="number"
                                className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-bold text-center text-blue-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition"
                                value={item.receivedQty}
                                onChange={(e) =>
                                  updateReceivedQty(idx, Number(e.target.value))
                                }
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                            <input
                              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                              placeholder="Batch No."
                              value={item.batchNo || ""}
                              onChange={(e) => updateItemField(idx, "batchNo", e.target.value)}
                            />
                            <input
                              type="date"
                              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                              value={item.mfgDate || ""}
                              onChange={(e) => updateItemField(idx, "mfgDate", e.target.value)}
                            />
                            <input
                              type="date"
                              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                              value={item.expiryDate || ""}
                              onChange={(e) => updateItemField(idx, "expiryDate", e.target.value)}
                            />
                          </div>
                          <textarea
                            className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
                            rows={2}
                            placeholder="Serial numbers, comma or line separated"
                            value={(item.serialNumbers || []).join(", ")}
                            onChange={(e) => {
                              const newItems = [...receivedItems];
                              newItems[idx] = {
                                ...newItems[idx],
                                serialNumbers: e.target.value
                                  .split(/[,\n]/)
                                  .map((serial) => serial.trim())
                                  .filter(Boolean),
                              };
                              setReceivedItems(newItems);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Divider />

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold px-4 py-2.5 transition-colors active:scale-[.98]"
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <CheckSquare size={16} />
                    )}
                    Finalise Receipt Note
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: GRN ledger ── */}
        <div className="lg:col-span-8">
          <Card className="flex flex-col min-h-[560px]">
            {/* Ledger header */}
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <ClipboardList size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Goods Receipt Ledger
                    </h3>
                    <p className="text-[12px] text-slate-400">
                      Institutional inward monitoring
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400 font-medium">
                      Total
                    </p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums leading-tight">
                      {filteredGrns.length}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-right">
                    <p className="text-[11px] text-amber-500 font-medium">
                      Pending QC
                    </p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums leading-tight">
                      {pendingQCCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters row */}
              <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search GRN, PO, challan…"
                    className={`${inputBase} pl-9`}
                  />
                </div>

                {/* Status filter */}
                <div className="relative w-full sm:w-44 shrink-0">
                  <Filter
                    size={13}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className={`${selectBase} pl-9`}
                  >
                    <option value="all">All statuses</option>
                    <option value="Pending QC">Pending QC</option>
                    <option value="QC Completed">QC Completed</option>
                  </select>
                  <ChevronDown
                    size={13}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                {/* Sort */}
                <div className="relative w-full sm:w-40 shrink-0">
                  <select
                    value={filters.sortOrder}
                    onChange={(e) =>
                      setFilters({ ...filters, sortOrder: e.target.value })
                    }
                    className={`${selectBase} pl-3`}
                  >
                    <option value="newest">Newest first</option>
                    <option value="earliest">Earliest first</option>
                  </select>
                  <ChevronDown
                    size={13}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </CardHeader>

            {/* Table */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {[
                      "GRN No.",
                      "PO Reference",
                      "Date",
                      "Challan",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading && grns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="w-8 h-8 border-2 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-[12px] text-slate-400 font-medium">
                          Loading inbound logs…
                        </p>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="inline-flex flex-col items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-10 py-8">
                          <AlertCircle size={32} className="text-red-400" />
                          <p className="text-sm font-semibold text-red-600">
                            Sync failed
                          </p>
                          <p className="text-[12px] text-red-400">{error}</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredGrns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-300">
                          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                            <FileText size={28} className="opacity-40" />
                          </div>
                          <p className="text-[12px] text-slate-400 font-medium">
                            No records found
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagedGrns.map((grn) => (
                      <tr
                        key={grn.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* GRN number */}
                        <td className="px-5 py-4 font-mono font-semibold text-blue-600 text-sm whitespace-nowrap">
                          {grn.grnNumber}
                        </td>

                        {/* PO */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Badge variant="outline">{grn.poNumber}</Badge>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 text-slate-600 whitespace-nowrap text-[13px]">
                          {grn.date}
                        </td>

                        {/* Challan */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-slate-500">
                            <FileText
                              size={13}
                              className="text-slate-300 group-hover:text-blue-400 transition-colors"
                            />
                            <span className="font-mono text-[13px]">
                              {grn.challanNumber || "—"}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {statusBadge(grn.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalItems > 0 && totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GRNView;
