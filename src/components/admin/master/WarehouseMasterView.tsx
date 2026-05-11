import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Edit2,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  MapPin,
  Package,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Layers,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addWarehouse,
  fetchWarehouses,
  removeWarehouse,
  updateWarehouse,
} from "@/store/slices/warehouseSlice";
import { Warehouse, WarehouseStockItem, WarehouseStockSummary } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import Pagination from "@/components/common/Pagination";
import { useListControls } from "@/hooks/useListControls";

const emptyWarehouseForm: Omit<Warehouse, "id"> = {
  name: "",
  location: "",
  type: "General",
  capacity: 0,
  contactPerson: "",
};

const fallbackSummary = (warehouse?: Warehouse | null): WarehouseStockSummary => {
  const availableQty = (((warehouse as any)?.products || []) as any[]).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0,
  );

  return {
    totalSkus: (((warehouse as any)?.products || []) as any[]).length,
    productCount: (((warehouse as any)?.products || []) as any[]).length,
    rawMaterialCount: (((warehouse as any)?.rawMaterials || []) as any[]).length,
    totalQty: availableQty,
    availableQty,
    usedQty: 0,
    totalValue: 0,
  };
};

const getWarehouseSummary = (warehouse?: Warehouse | null): WarehouseStockSummary =>
  warehouse?.stockSummary || fallbackSummary(warehouse);

const getWarehouseItems = (warehouse?: Warehouse | null): WarehouseStockItem[] =>
  warehouse?.stockItems || [];

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString() : "No active batch";

const formatMoney = (value?: number) =>
  `₹${Number(value || 0).toLocaleString()}`;

const WarehouseItemsPanel: React.FC<{ items: WarehouseStockItem[] }> = ({
  items,
}) => {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        No items linked to this warehouse yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50/40">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead>Item Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Sale Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Used</TableHead>
            <TableHead className="text-right">Unused / Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={`${item.itemKind}-${item.itemId}`}>
              <TableCell>
                <div>
                  <p className="font-semibold text-slate-900">{item.itemName}</p>
                  <p className="text-xs text-slate-500">
                    {item.itemCode || item.sku || "No code"}
                    {item.unit ? ` • ${item.unit}` : ""}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-white">
                  {item.itemKind === "rawMaterial" ? "Raw Material" : "Product"}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium text-slate-700">
                {formatMoney(item.unitCost)}
              </TableCell>
              <TableCell className="text-right font-medium text-slate-700">
                {item.itemKind === "product" ? formatMoney(item.salePrice) : "—"}
              </TableCell>
              <TableCell className="text-right font-semibold text-sky-600">
                {item.totalQty.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-semibold text-amber-600">
                {item.usedQty.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-semibold text-emerald-600">
                {item.availableQty.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const WarehouseMasterView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { warehouses, loading } = useAppSelector((state) => state.warehouse);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [expandedWarehouses, setExpandedWarehouses] = useState<Record<string, boolean>>({});
  const [formData, setFormData] =
    useState<Omit<Warehouse, "id">>(emptyWarehouseForm);

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const handleOpenForm = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        location: warehouse.location,
        type: warehouse.type,
        capacity: warehouse.capacity,
        contactPerson: warehouse.contactPerson,
      });
    } else {
      setEditingWarehouse(null);
      setFormData(emptyWarehouseForm);
    }
    setIsFormOpen(true);
  };

  const handleOpenDetails = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsDetailsOpen(true);
  };

  const toggleWarehouseItems = (warehouseId: string) => {
    setExpandedWarehouses((current) => ({
      ...current,
      [warehouseId]: !current[warehouseId],
    }));
  };

  const handleSave = async () => {
    try {
      if (editingWarehouse) {
        await dispatch(
          updateWarehouse({ id: editingWarehouse.id, data: formData }),
        ).unwrap();
      } else {
        await dispatch(addWarehouse(formData)).unwrap();
      }
      setIsFormOpen(false);
    } catch (error) {
      alert("Error saving warehouse");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this warehouse?")) return;

    try {
      await dispatch(removeWarehouse(id)).unwrap();
    } catch (error) {
      alert("Error deleting warehouse");
    }
  };

  const {
    pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  } = useListControls({
    items: warehouses,
    searchTerm,
    filters: { type: typeFilter },
    initialPageSize: 9,
    searchFn: (warehouse, term) =>
      warehouse.name.toLowerCase().includes(term) ||
      warehouse.location.toLowerCase().includes(term) ||
      warehouse.contactPerson.toLowerCase().includes(term),
    filterFn: (warehouse, filters) =>
      filters.type === "all" || warehouse.type === filters.type,
  });

  const stats = useMemo(() => {
    const totals = warehouses.reduce(
      (acc, warehouse) => {
        const summary = getWarehouseSummary(warehouse);
        acc.availableQty += summary.availableQty;
        acc.usedQty += summary.usedQty;
        acc.totalValue += summary.totalValue;
        return acc;
      },
      { availableQty: 0, usedQty: 0, totalValue: 0 },
    );

    return [
      {
        label: "Total Warehouses",
        value: warehouses.length,
        icon: Building2,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "Total Capacity",
        value: `${warehouses
          .reduce((acc, warehouse) => acc + (warehouse.capacity || 0), 0)
          .toLocaleString()} sq ft`,
        icon: Package,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
      },
      {
        label: "Available Stock",
        value: totals.availableQty.toLocaleString(),
        icon: MapPin,
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
      {
        label: "Used Stock",
        value: totals.usedQty.toLocaleString(),
        icon: BarChart3,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
    ];
  }, [warehouses]);

  if (loading && warehouses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Warehouse Master
          </h1>
          <p className="text-slate-500 mt-1 text-lg">
            Centralized management of storage infrastructure and live stock.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => handleOpenForm()}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
        >
          <Plus className="mr-2 h-5 w-5" /> Add Warehouse
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {stat.label}
              </CardTitle>
              <div
                className={`p-2 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}
              >
                <stat.icon size={18} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <ArrowUpRight size={12} className="text-emerald-500" />
                <span>Live warehouse summary</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <Input
            placeholder="Search by name, location or manager..."
            className="pl-10 h-11 bg-slate-50/50 border-none focus-visible:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-56 h-11 bg-slate-50/50 border-none">
            <SelectValue placeholder="Warehouse type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="General">General</SelectItem>
            <SelectItem value="Distribution Center">Distribution Center</SelectItem>
            <SelectItem value="Cold Storage">Cold Storage</SelectItem>
            <SelectItem value="Retail Store">Retail Store</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-lg border border-slate-100">
          <Button
            variant={viewMode === "grid" ? "white" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "shadow-sm" : "text-slate-500"}
          >
            <LayoutGrid size={18} />
          </Button>
          <Button
            variant={viewMode === "list" ? "white" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "shadow-sm" : "text-slate-500"}
          >
            <ListIcon size={18} />
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pagedItems.map((warehouse) => {
            const summary = getWarehouseSummary(warehouse);

            return (
              <Card
                key={warehouse.id}
                className="group border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="h-1.5 bg-blue-600 w-full rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <Building2 size={22} />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenForm(warehouse)}
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(warehouse.id)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                      {warehouse.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 mt-1">
                      <MapPin size={14} /> {warehouse.location}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Type
                      </p>
                      <Badge
                        variant="secondary"
                        className="mt-1 font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
                      >
                        {warehouse.type}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Capacity / Available
                      </p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">
                        {warehouse.capacity.toLocaleString()} sq ft
                        <span className="text-blue-600 font-bold ml-1">
                          • {summary.availableQty.toLocaleString()} units
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {summary.totalSkus} SKUs • {summary.usedQty.toLocaleString()} used
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold border border-indigo-100">
                        {warehouse.contactPerson?.charAt(0) || "W"}
                      </div>
                      <span className="text-sm font-medium text-slate-600">
                        {warehouse.contactPerson || "Unassigned"}
                      </span>
                    </div>

                    <Button
                      variant="link"
                      className="p-0 h-auto text-blue-600 font-bold hover:no-underline flex items-center gap-1 group/btn"
                      onClick={() => handleOpenDetails(warehouse)}
                    >
                      View details
                      <ChevronRight
                        size={16}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-bold">Warehouse</TableHead>
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="font-bold">Capacity & Stock</TableHead>
                <TableHead className="font-bold">Manager</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedItems.map((warehouse) => {
                const summary = getWarehouseSummary(warehouse);
                const items = getWarehouseItems(warehouse);
                const isExpanded = !!expandedWarehouses[warehouse.id];

                return (
                  <React.Fragment key={warehouse.id}>
                    <TableRow
                      className="group cursor-pointer hover:bg-slate-50/50"
                      onClick={() => handleOpenDetails(warehouse)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWarehouseItems(warehouse.id);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </Button>
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{warehouse.name}</p>
                            <p className="text-xs text-slate-500">{warehouse.location}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-medium bg-slate-50">
                          {warehouse.type}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-medium text-slate-700">
                        <div>{warehouse.capacity.toLocaleString()} sq ft</div>
                        <div className="text-xs text-blue-600 mt-0.5">
                          {summary.availableQty.toLocaleString()} available •{" "}
                          {summary.usedQty.toLocaleString()} used
                        </div>
                      </TableCell>

                      <TableCell className="text-slate-600">
                        {warehouse.contactPerson || "Unassigned"}
                      </TableCell>

                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleWarehouseItems(warehouse.id)}
                            className="text-xs text-blue-600"
                          >
                            {items.length} items
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenForm(warehouse)}
                            className="h-8 w-8 text-slate-400 hover:text-blue-600"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(warehouse.id)}
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-slate-50/40 hover:bg-slate-50/40">
                        <TableCell colSpan={5} className="p-4">
                          <WarehouseItemsPanel items={items} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[6, 9, 18, 36]}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="px-8 pt-8 pb-4 bg-white">
            <DialogTitle className="text-2xl font-bold">
              {editingWarehouse ? "Edit Warehouse" : "New Warehouse"}
            </DialogTitle>
            <DialogDescription>
              Update your storage infrastructure details.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-5 bg-white">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Warehouse Name
              </label>
              <Input
                placeholder="e.g. Central Distribution Hub"
                className="h-12 rounded-xl border-slate-200 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Location
                </label>
                <Input
                  placeholder="e.g. Mumbai, MH"
                  className="h-12 rounded-xl border-slate-200"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Type
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Warehouse["type"]) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Distribution Center">
                      Distribution Center
                    </SelectItem>
                    <SelectItem value="Cold Storage">Cold Storage</SelectItem>
                    <SelectItem value="Retail Store">Retail Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Capacity (sq ft)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  className="h-12 rounded-xl border-slate-200"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Manager
                </label>
                <Input
                  placeholder="Contact Person"
                  className="h-12 rounded-xl border-slate-200"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactPerson: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-8 pb-8 pt-2 bg-white">
            <Button
              variant="ghost"
              onClick={() => setIsFormOpen(false)}
              className="rounded-xl h-12 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl h-12 px-8 shadow-lg shadow-blue-100"
            >
              {editingWarehouse ? "Save Changes" : "Create Warehouse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[720px] h-full rounded-3xl p-0 overflow-scroll border-none shadow-2xl">
          {selectedWarehouse && (
            <>
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                <div className="absolute -bottom-10 left-8 p-4 bg-white rounded-2xl shadow-xl">
                  <Building2 size={40} className="text-blue-600" />
                </div>
              </div>

              <div className="px-8 pt-14 pb-8 bg-white">
                {(() => {
                  const summary = getWarehouseSummary(selectedWarehouse);
                  const stockItems = getWarehouseItems(selectedWarehouse);
                  const occupancy = selectedWarehouse.capacity
                    ? Math.min(
                        Math.round(
                          (summary.availableQty /
                            Math.max(selectedWarehouse.capacity, 1)) *
                            100,
                        ),
                        100,
                      )
                    : 0;

                  return (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">
                            {selectedWarehouse.name}
                          </h2>
                          <p className="text-slate-500 flex items-center gap-1.5 mt-1">
                            <MapPin size={16} /> {selectedWarehouse.location}
                          </p>
                        </div>
                        <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-3 py-1 uppercase tracking-wider">
                          {selectedWarehouse.type}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                              <Layers size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Storage Capacity
                              </p>
                              <p className="text-lg font-semibold text-slate-800 mt-0.5">
                                {selectedWarehouse.capacity.toLocaleString()} sq ft
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                              <User size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Warehouse Manager
                              </p>
                              <p className="text-lg font-semibold text-slate-800 mt-0.5">
                                {selectedWarehouse.contactPerson || "Unassigned"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                              <Package size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Current Stock
                              </p>
                              <p className="text-lg font-semibold text-blue-600 mt-0.5">
                                {summary.availableQty.toLocaleString()} available
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {summary.usedQty.toLocaleString()} used •{" "}
                                {summary.totalSkus} SKUs
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                              <Phone size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Contact Info
                              </p>
                              <p className="text-lg font-semibold text-slate-800 mt-0.5">
                                {selectedWarehouse.contactPerson || "Warehouse office"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                              <Calendar size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                FIFO Method
                              </p>
                              <p className="text-lg font-semibold text-slate-800 mt-0.5">
                                Raw material stock follows FIFO
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-slate-800">
                            Operational Summary
                          </h4>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                            Live
                          </span>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                              <span>Current Occupancy</span>
                              <span>{occupancy}%</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                style={{ width: `${occupancy}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="rounded-2xl bg-white border border-slate-200 p-4">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                SKUs
                              </p>
                              <p className="text-lg font-semibold text-slate-900 mt-1">
                                {summary.totalSkus}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white border border-slate-200 p-4">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Products
                              </p>
                              <p className="text-lg font-semibold text-slate-900 mt-1">
                                {summary.productCount}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white border border-slate-200 p-4">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Materials
                              </p>
                              <p className="text-lg font-semibold text-slate-900 mt-1">
                                {summary.rawMaterialCount}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white border border-slate-200 p-4">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Value
                              </p>
                              <p className="text-lg font-semibold text-slate-900 mt-1">
                                ₹{summary.totalValue.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-slate-800">
                            Warehouse Items
                          </h4>
                          <span className="text-xs font-bold text-slate-500">
                            Expandable item stock details
                          </span>
                        </div>

                        <WarehouseItemsPanel items={stockItems} />

                        {stockItems.length > 0 && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {stockItems
                              .filter((item) => item.itemKind === "rawMaterial")
                              .map((item) => (
                                <div
                                  key={`fifo-${item.itemId}`}
                                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600"
                                >
                                  <div className="font-semibold text-slate-800">
                                    {item.itemName}
                                  </div>
                                  <div className="mt-1">
                                    {item.valuationMethod || "FIFO"} • {item.batchCount || 0} batches
                                  </div>
                                  <div className="text-slate-500">
                                    Oldest batch: {formatDate(item.oldestBatch?.purchaseDate)}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-8 flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 rounded-xl h-12"
                          onClick={() => setIsDetailsOpen(false)}
                        >
                          Close
                        </Button>
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl h-12 shadow-lg shadow-blue-100"
                          onClick={() => {
                            setIsDetailsOpen(false);
                            handleOpenForm(selectedWarehouse);
                          }}
                        >
                          Edit Settings
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehouseMasterView;
