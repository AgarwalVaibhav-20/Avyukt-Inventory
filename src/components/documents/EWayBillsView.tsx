import React, { useState, useEffect } from "react";
import { documentService } from "@/services/documentService";
import { salesService } from "@/services/salesService";
import { EWayBill } from "@/types";
import {
  Truck,
  Plus,
  Loader2,
  Search,
  Filter,
  ShieldCheck,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  TrendingUp,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  X,
  MoreVertical,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

const getTomorrowDateString = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

const formatDateToInput = (dateVal: any): string => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
};

const statusConfig: Record<string, { label: string; className: string }> = {
  Active: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50",
  },
  Expired: {
    label: "Expired",
    className:
      "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50",
  },
  Cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-50",
  },
};

const EWayBillsView: React.FC = () => {
  const [bills, setBills] = useState<EWayBill[]>([]);
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingNo, setDeletingNo] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [challanSelectOpen, setChallanSelectOpen] = useState(false);

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
    validUntil: getTomorrowDateString(),
    status: "Active",
  });

  useEffect(() => {
    loadBills();
  }, [page, statusFilter]);

  useEffect(() => {
    loadChallans();
  }, []);

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

  const handleDeleteClick = (id: string, ewbNo: string) => {
    setDeletingId(id);
    setDeletingNo(ewbNo);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await documentService.deleteEWayBill(deletingId);
      toast.success("Permit deleted successfully");
      setDeleteModalOpen(false);
      setDeletingId(null);
      setDeletingNo("");
      loadBills();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete permit");
    } finally {
      setDeleteLoading(false);
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
      validUntil: formatDateToInput(bill.validUntil) || getTomorrowDateString(),
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
      validUntil: getTomorrowDateString(),
      status: "Active",
    });
  };

  const STATUS_TABS = ["", "Active", "Expired", "Cancelled"];

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <ShieldCheck className="text-slate-700" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                E-Way Bill Compliance
              </h1>
              <p className="text-sm text-slate-500">
                Manage transit permits for logistics
              </p>
            </div>
          </div>
          <Button
            onClick={() => (isCreating ? resetForm() : setIsCreating(true))}
            variant={isCreating ? "outline" : "default"}
            className="gap-2"
          >
            {isCreating ? (
              <>
                <X size={16} /> Cancel
              </>
            ) : (
              <>
                <Plus size={16} /> Generate Permit
              </>
            )}
          </Button>
        </div>

        {/* Create / Edit Form */}
        {isCreating && (
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                {editingId ? (
                  <>
                    <Edit3 size={16} className="text-slate-500" />
                    Edit Permit
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {form.challanRef}
                    </Badge>
                  </>
                ) : (
                  <>
                    <Plus size={16} className="text-slate-500" />
                    New Permit Application
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Source Challan */}
                {!editingId && (
                  <div className="space-y-1.5 flex flex-col">
                    <Label className="text-xs font-medium text-slate-600 mb-0.5">
                      Source Challan <span className="text-red-500">*</span>
                    </Label>
                    <Popover open={challanSelectOpen} onOpenChange={setChallanSelectOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={challanSelectOpen}
                          className="w-full justify-between bg-white text-sm font-normal border-slate-200"
                        >
                          <span className="truncate">
                            {form.challanId
                              ? (challans.find((c) => (c.id || c._id) === form.challanId)?.challanNo || "Select Document")
                              : "Select Document"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 z-50 bg-white border border-slate-200 shadow-lg" align="start">
                        <Command>
                          <CommandInput placeholder="Search challan number..." />
                          <CommandEmpty>No challan found.</CommandEmpty>
                          <CommandGroup className="max-h-[220px] overflow-y-auto">
                            {challans.map((c) => {
                              const cid = c.id || c._id;
                              return (
                                <CommandItem
                                  key={cid}
                                  value={c.challanNo}
                                  onSelect={() => {
                                    handleSelectChallan(cid);
                                    setChallanSelectOpen(false);
                                  }}
                                  className="cursor-pointer hover:bg-slate-50 py-2 px-3 text-sm flex items-center justify-between transition-colors"
                                >
                                  <div className="flex items-center">
                                    <Check className={cn("mr-2 h-4 w-4 text-slate-900", form.challanId === cid ? "opacity-100" : "opacity-0")} />
                                    <span>{c.challanNo}</span>
                                  </div>
                                  {c.customer && (
                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium truncate max-w-[120px]">
                                      {c.customer}
                                    </span>
                                  )}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Transporter */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">
                    Transporter <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Logistics Agency Name"
                    className="bg-white border-slate-200 text-sm"
                    value={form.transporter}
                    onChange={(e) =>
                      setForm({ ...form, transporter: e.target.value })
                    }
                  />
                </div>

                {/* Vehicle No */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">
                    Vehicle Registration <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. DL-01-XX-0000"
                    className="bg-white border-slate-200 text-sm"
                    value={form.vehicleNo}
                    onChange={(e) =>
                      setForm({ ...form, vehicleNo: e.target.value })
                    }
                  />
                </div>

                {/* Valid Until — Date Picker */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">
                    Valid Until <span className="text-red-500">*</span>
                  </Label>
                  <Popover
                    open={isCalendarOpen}
                    onOpenChange={setIsCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          "w-full justify-between text-sm font-normal bg-white border-slate-200",
                          !form.validUntil && "text-slate-400",
                        )}
                      >
                        <span>
                          {form.validUntil &&
                          !isNaN(new Date(form.validUntil).getTime())
                            ? format(new Date(form.validUntil), "dd MMM yyyy")
                            : "Pick a date"}
                        </span>
                        <Calendar size={15} className="text-slate-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <ShadcnCalendar
                        mode="single"
                        selected={
                          form.validUntil &&
                          !isNaN(new Date(form.validUntil).getTime())
                            ? new Date(form.validUntil)
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            setForm({
                              ...form,
                              validUntil: date.toISOString().split("T")[0],
                            });
                            setIsCalendarOpen(false);
                          }
                        }}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Declared Goods Value */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">
                    Declared Goods Value (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Enter goods value"
                    className="bg-white border-slate-200 text-sm font-semibold"
                    value={form.goodsValue || ""}
                    onChange={(e) =>
                      setForm({ ...form, goodsValue: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              {/* Summary row */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                  <span className="text-xs text-slate-400 font-medium">
                    Goods Value
                  </span>
                  <span className="font-semibold text-slate-900">
                    ₹{(form.goodsValue || 0).toLocaleString()}
                  </span>
                </div>
                {form.toPlace && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="font-medium text-slate-800">
                      {form.toPlace}
                    </span>
                  </div>
                )}
                <div className="ml-auto flex gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    className="text-slate-500"
                  >
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateOrUpdate}
                    disabled={actionLoading}
                    className="gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={15} />
                    )}
                    {editingId ? "Update Permit" : "Generate Permit"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              placeholder="Search by permit no, transporter, or challan ref..."
              className="pl-9 bg-white border-slate-200 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
              {STATUS_TABS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === s
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-200"
            >
              <Filter size={14} className="text-slate-500" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-20 flex items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 size={18} className="animate-spin" />
                  Loading...
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-6">
                      Permit No
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">
                      Challan Ref
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">
                      Transporter
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">
                      Route
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">
                      Validity
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-6 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <FileText size={36} className="text-slate-300" />
                          <p className="text-sm font-medium">
                            No permits found
                          </p>
                          <p className="text-xs text-slate-400">
                            Generate a new permit to get started
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    bills.map((b) => {
                      const isExpired = new Date(b.validUntil) < new Date();
                      const statusInfo = statusConfig[b.status] ?? {
                        label: b.status,
                        className:
                          "bg-slate-100 text-slate-600 border border-slate-200",
                      };
                      return (
                        <TableRow
                          key={b.id || b._id}
                          className="group border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                        >
                          {/* Permit No */}
                          <TableCell className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">
                                {b.ewbNo}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <Calendar size={11} />
                                {new Date(
                                  b.generated || b.createdAt,
                                ).toLocaleDateString(undefined, {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </TableCell>

                          {/* Challan Ref */}
                          <TableCell className="px-4 py-4">
                            <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs font-medium text-slate-700">
                              <FileText size={12} className="text-slate-400" />
                              {b.challanRef}
                            </div>
                          </TableCell>

                          {/* Transporter */}
                          <TableCell className="px-4 py-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <Truck
                                  size={14}
                                  className="text-slate-400 shrink-0"
                                />
                                <span className="text-sm font-medium text-slate-800">
                                  {b.transporter}
                                </span>
                              </div>
                              <span className="mt-1 ml-[22px] inline-block text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono">
                                {b.vehicleNo}
                              </span>
                            </div>
                          </TableCell>

                          {/* Route */}
                          <TableCell className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-slate-700">
                              <MapPin
                                size={13}
                                className="text-slate-400 shrink-0"
                              />
                              <span>{b.toPlace || "—"}</span>
                            </div>
                            {b.fromPlace && (
                              <p className="text-xs text-slate-400 mt-0.5 ml-[18px]">
                                from {b.fromPlace}
                              </p>
                            )}
                          </TableCell>

                          {/* Validity */}
                          <TableCell className="px-4 py-4">
                            <span
                              className={cn(
                                "text-xs font-medium",
                                isExpired ? "text-red-600" : "text-slate-700",
                              )}
                            >
                              {new Date(b.validUntil).toLocaleDateString(
                                undefined,
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            {isExpired && (
                              <p className="text-[10px] text-red-500 mt-0.5 font-medium">
                                Expired
                              </p>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="px-4 py-4">
                            <Badge
                              className={cn(
                                "text-xs font-medium rounded-md",
                                statusInfo.className,
                              )}
                            >
                              {statusInfo.label}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-slate-900"
                                onClick={() => startEdit(b)}
                                title="Edit"
                              >
                                <Edit3 size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-red-600"
                                onClick={() => handleDeleteClick(b.id || b._id, b.ewbNo)}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-400 hover:text-slate-700"
                                  >
                                    <MoreVertical size={14} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="text-sm"
                                >
                                  <DropdownMenuItem
                                    onClick={() => startEdit(b)}
                                  >
                                    Edit Permit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteClick(b.id || b._id, b.ewbNo)}
                                  >
                                    Cancel Permit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-white">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {bills.length}
                </span>{" "}
                of <span className="font-semibold text-slate-700">{total}</span>{" "}
                permits
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-slate-200"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={15} />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={cn(
                          "w-8 h-8 rounded-md text-xs font-medium transition-colors",
                          page === p
                            ? "bg-slate-900 text-white"
                            : "text-slate-500 hover:bg-slate-100",
                        )}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-slate-200"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRightIcon size={15} />
                </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Cancel E-Way Bill Permit"
        description="Are you sure you want to cancel/delete this legal transit permit? This action cannot be undone and will void the compliance ledger record."
        itemName={deletingNo}
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeletingId(null);
          setDeletingNo("");
        }}
      />
    </div>
  );
};

export default EWayBillsView;
