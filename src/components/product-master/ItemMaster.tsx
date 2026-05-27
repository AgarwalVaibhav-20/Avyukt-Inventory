import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import {
  InventoryItem,
  Category,
  Brand,
  UOM,
  HSN,
  Attribute,
  Warehouse,
  Bin,
} from "@/types";
import { productService } from "@/services/productService";
import { warehouseService } from "@/services/warehouseService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchItems } from "@/store/slices/inventorySlice";
import { fetchStockMovementData } from "@/store/slices/stockMovementSlice";
import {
  ArrowRightLeft,
  Barcode,
  Boxes,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Clock,
  Download,
  Edit,
  Filter,
  Image,
  IndianRupee,
  Layers,
  Loader2,
  MoreHorizontal,
  Package,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  Tags,
  Trash2,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Pagination from "@/components/common/Pagination";
import { useListControls } from "@/hooks/useListControls";
import { NotionSelect, inputCls } from "@/components/common/NotionSelect";

const buildTree = (items: any[]) => {
  const map: any = {};
  const roots: any[] = [];
  items.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });
  items.forEach((item) => {
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });
  return roots;
};

const flattenTree = (tree: any[], level = 0): any[] => {
  let result: any[] = [];
  tree.forEach((node) => {
    result.push({
      ...node,
      label: "  ".repeat(level) + (level > 0 ? "└─ " : "") + node.name,
      value: node.name,
    });
    if (node.children) {
      result = result.concat(flattenTree(node.children, level + 1));
    }
  });
  return result;
};

const ITEM_TYPES = [
  "Trading",
  "Raw Material",
  "Consumable",
  "Service",
  "Asset",
] as const;

const BARCODE_FORMATS = ["Code128", "EAN-13", "QR"] as const;
const VALUATION_METHODS = [
  "FIFO",
  "LIFO",
  "Weighted Average",
  "Standard Cost",
] as const;

const emptyForm: Partial<InventoryItem> = {
  itemCode: "",
  sku: "",
  name: "",
  description: "",
  itemType: "Trading",
  category: "",
  brand: "",
  uom: "PCS",
  stockUom: "PCS",
  purchaseUom: "PCS",
  salesUom: "PCS",
  taxRate: 0,
  hsnCode: "",
  minimumStockLevel: 0,
  reorderLevel: 5,
  maximumStockLevel: 0,
  reorderQuantity: 0,
  shelfLifeDays: 0,
  leadTimeDays: 0,
  uomConversions: "",
  warehouseId: "",
  binCode: "",
  quantity: 0,
  unitCost: 0,
  unitPrice: 0,
  salePrice: 0,
  mrp: 0,
  customerPrice: 0,
  quantityBreakPrice: 0,
  currency: "INR",
  valuationMethod: "FIFO",
  barcode: "",
  qrCode: "",
  barcodeFormat: "Code128",
  barcodes: [],
  attributes: {},
  images: [],
};

const getPagePermission = (user: any, pageId: string) => {
  if (user?.role === "admin" || user?.role === "manager") {
    return { view: true, create: true, edit: true, delete: true };
  }
  const permissions = user?.permissions;
  if (!permissions || Object.keys(permissions).length === 0) {
    return { view: true, create: true, edit: true, delete: true };
  }
  return permissions?.[pageId] || { view: false, create: false, edit: false, delete: false };
};

const ItemMaster: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items, loading } = useAppSelector((state) => state.inventory);
  const { warehouses, bins: globalBins } = useAppSelector(
    (state) => state.stockMovement,
  );

  const [formData, setFormData] = useState<Partial<InventoryItem>>(emptyForm);
  const [search, setSearch] = useState("");

  const warehouseBins = useMemo(() => {
    if (!formData.warehouseId) return [];
    return globalBins.filter(
      (b) => (b.warehouseId || b.warehouse) === formData.warehouseId,
    );
  }, [globalBins, formData.warehouseId]);

  const [attributeDraft, setAttributeDraft] = useState({ name: "", value: "" });
  const [barcodeDraft, setBarcodeDraft] = useState("");
  const [imageDraft, setImageDraft] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const pagePermission = getPagePermission(user, "pm-master");
  const canCreate = pagePermission.create === true;
  const canEdit = pagePermission.edit === true;
  const canDelete = pagePermission.delete === true;

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  // Filter state
  const [filters, setFilters] = useState<{
    category: string;
    brand: string[];
    itemType: string;
    uom: string;
    hsnCode: string;
    sortOrder: string;
  }>({
    category: "all",
    brand: [],
    itemType: "all",
    uom: "all",
    hsnCode: "",
    sortOrder: "newest",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [hsns, setHsns] = useState<HSN[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadItems();
    dispatch(fetchStockMovementData());
  }, [filters, search]);

  const loadItems = () => {
    dispatch(fetchItems({ ...filters, search }));
  };

  const loadMasterData = async () => {
    try {
      const [catData, brandData, uomData, hsnData, attrData] =
        await Promise.all([
          productService.getCategories(),
          productService.getBrands(),
          productService.getUOMs(),
          productService.getHSN(),
          productService.getAttributes(),
        ]);
      setCategories(catData);
      setBrands(brandData);
      setUoms(uomData);
      setHsns(hsnData);
      setAttributes(attrData);
    } catch (error) {
      console.error("Failed to load master data", error);
    }
  };

  useEffect(() => {
    if (editingItem) {
      setFormData({ ...editingItem });
    } else {
      setFormData(emptyForm);
    }
    setAttributeDraft({ name: "", value: "" });
    setBarcodeDraft("");
    setImageDraft("");
  }, [editingItem]);

  const selectedHsn = useMemo(
    () =>
      hsns.find(
        (h) =>
          h.code === formData.hsnCode ||
          (h as any).hsnCode === formData.hsnCode,
      ),
    [hsns, formData.hsnCode],
  );

  useEffect(() => {
    if (selectedHsn) {
      setFormData((current) => ({
        ...current,
        taxRate:
          selectedHsn.taxRate ??
          (selectedHsn as any).taxPercentage ??
          current.taxRate ??
          0,
      }));
    }
  }, [selectedHsn]);

  const {
    filteredItems,
    pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  } = useListControls({
    items,
    searchTerm: search,
    filters,
    initialPageSize: 10,
    searchFn: (item, term) =>
      item.name.toLowerCase().includes(term) ||
      (item.sku || "").toLowerCase().includes(term) ||
      (item.itemCode || "").toLowerCase().includes(term) ||
      (item.barcode || "").toLowerCase().includes(term),
    filterFn: (item, activeFilters) => {
      const matchesCategory =
        activeFilters.category === "all" ||
        item.category === activeFilters.category;
      const matchesBrand =
        activeFilters.brand === "all" ||
        activeFilters.brand.length === 0 ||
        activeFilters.brand.includes(item.brand);
      const matchesType =
        activeFilters.itemType === "all" ||
        item.itemType === activeFilters.itemType;

      return matchesCategory && matchesBrand && matchesType;
    },
  });

  const setField = <K extends keyof InventoryItem>(
    field: K,
    value: InventoryItem[K],
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleDeleteClick = (id: string) => {
    if (!canDelete) {
      alert("You do not have delete permission for Item Master.");
      return;
    }
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await productService.deleteItem(deleteTargetId);
      loadItems();
    } catch (error) {
      console.error("Failed to delete item", error);
      alert("Failed to delete item.");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const handleOpenAdd = () => {
    if (!canCreate) {
      alert("You do not have create permission for Item Master.");
      return;
    }
    setEditingItem(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };
  const handleOpenEdit = (item: InventoryItem) => {
    if (!canEdit) {
      alert("You do not have edit permission for Item Master.");
      return;
    }
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const openConnectedPage = (path: string, item: InventoryItem) => {
    const params = new URLSearchParams();

    if (item.id) params.set("item", item.id);
    if (item.sku) params.set("sku", item.sku);
    if (item.warehouseId) params.set("warehouseId", item.warehouseId);

    navigate({
      pathname: path,
      search: params.toString() ? `?${params.toString()}` : "",
    });
  };

  const addAttribute = () => {
    if (!attributeDraft.name || !attributeDraft.value) return;
    setFormData((current) => ({
      ...current,
      attributes: {
        ...(current.attributes || {}),
        [attributeDraft.name]: attributeDraft.value,
      },
    }));
    setAttributeDraft({ name: "", value: "" });
  };

  const removeAttribute = (name: string) => {
    const next = { ...(formData.attributes || {}) };
    delete next[name];
    setFormData((current) => ({ ...current, attributes: next }));
  };

  const addBarcode = () => {
    const next = barcodeDraft.trim();
    if (!next) return;
    setFormData((current) => {
      const existing =
        current.barcodes || (current.barcode ? [current.barcode] : []);
      const nextBarcodes = existing.includes(next)
        ? existing
        : [...existing, next];
      return {
        ...current,
        barcode: current.barcode || next,
        barcodes: nextBarcodes,
      };
    });
    setBarcodeDraft("");
  };

  const removeBarcode = (code: string) => {
    setFormData((current) => {
      const next = (current.barcodes || []).filter((b) => b !== code);
      return {
        ...current,
        barcodes: next,
        barcode: current.barcode === code ? next[0] || "" : current.barcode,
      };
    });
  };

  const addImage = () => {
    const next = imageDraft.trim();
    if (!next) return;
    setFormData((current) => ({
      ...current,
      images: (current.images || []).includes(next)
        ? current.images || []
        : [...(current.images || []), next],
    }));
    setImageDraft("");
  };

  const removeImage = (url: string) => {
    setFormData((current) => ({
      ...current,
      images: (current.images || []).filter((i) => i !== url),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem ? !canEdit : !canCreate) {
      alert("You do not have permission to save Item Master changes.");
      return;
    }
    if (!formData.name || !formData.sku) {
      alert("Item Name and SKU are required.");
      return;
    }

    const normalized = {
      ...formData,
      stockUom: formData.stockUom || formData.uom,
      purchaseUom: formData.purchaseUom || formData.uom,
      salesUom: formData.salesUom || formData.uom,
      reorderLevel: formData.reorderLevel || formData.minimumStockLevel || 0,
      minimumStockLevel:
        formData.minimumStockLevel || formData.reorderLevel || 0,
      unitCost: formData.unitCost || formData.unitPrice || 0,
      barcodes: formData.barcodes?.length
        ? formData.barcodes
        : formData.barcode
          ? [formData.barcode]
          : [],
      barcode: formData.barcode || formData.barcodes?.[0] || "",
    };
    try {
      if (editingItem) {
        await productService.updateItem(editingItem.id, normalized);
      } else {
        await productService.createItem(normalized as any);
      }
      setIsDialogOpen(false);
      loadItems();
    } catch (error) {
      console.error("Failed to save item", error);
      alert("Failed to save item. Please check required fields.");
    }
  };

  const handleExportExcel = () => {
    if (filteredItems.length === 0) return alert("No items to export");

    // Create CSV content
    const headers = [
      "Name",
      "SKU",
      "Item Code",
      "Category",
      "Brand",
      "Type",
      "Stock",
      "UoM",
      "Purchase Price",
      "Sale Price",
      "Barcode",
    ];
    const rows = filteredItems.map((item) => [
      `"${item.name}"`,
      `"${item.sku}"`,
      `"${item.itemCode || ""}"`,
      `"${item.category || ""}"`,
      `"${item.brand || ""}"`,
      `"${item.itemType || ""}"`,
      item.stock,
      `"${item.uom}"`,
      item.unitPrice || 0,
      item.salePrice || 0,
      `"${item.barcode || ""}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `inventory_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLinkedWarehouseName = (item: InventoryItem) => {
    const id = item.warehouseId || item.stocks?.[0]?.warehouseId;
    return warehouses.find((w) => w.id === id)?.name;
  };

  const stockStatus = (item: InventoryItem) => {
    if (item.stock === 0)
      return { label: "Out of stock", color: "text-red-500 bg-red-50" };
    if (item.stock <= item.reorderLevel)
      return { label: "Low stock", color: "text-amber-600 bg-amber-50" };
    return { label: "In stock", color: "text-emerald-600 bg-emerald-50" };
  };

  const activeFiltersCount =
    (filters.category !== "all" ? 1 : 0) +
    (filters.brand.length > 0 ? 1 : 0) +
    (filters.itemType !== "all" ? 1 : 0) +
    (filters.uom !== "all" ? 1 : 0) +
    (filters.hsnCode !== "" ? 1 : 0);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Page header */}
      <div className="border-b border-gray-100 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">
              Item Master
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Single source of truth for all inventory items
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-8 text-xs border-gray-200 text-gray-600 hover:bg-gray-50 font-normal gap-1.5"
            >
              <Download size={13} /> Export
            </Button>
            {canCreate && (
              <Button
                onClick={handleOpenAdd}
                size="sm"
                className="h-8 text-xs bg-gray-900 hover:bg-gray-800 text-white gap-1.5 font-normal"
              >
                <Plus size={13} /> New item
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-8 py-4 border-b border-gray-100 flex gap-6">
        {[
          { label: "Total items", value: items.length, color: "text-gray-900" },
          {
            label: "Low stock",
            value: items.filter((i) => i.stock <= i.reorderLevel).length,
            color: "text-amber-600",
          },
          {
            label: "No barcode",
            value: items.filter((i) => !i.barcode).length,
            color: "text-purple-600",
          },
          {
            label: "GST linked",
            value: items.filter((i) => i.hsnCode).length,
            color: "text-emerald-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2">
            <span className={cn("text-xl font-semibold", stat.color)}>
              {stat.value}
            </span>
            <span className="text-xs text-gray-400">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="px-8 py-3 flex items-center gap-3 border-b border-gray-100 bg-gray-50/30">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Search name, sku, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 w-72 text-sm border-gray-200 rounded-md bg-white focus-visible:ring-1 focus-visible:ring-gray-300 focus-visible:ring-offset-0"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs gap-1.5 font-normal border-gray-200",
                activeFiltersCount > 0
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "text-gray-500 hover:bg-gray-50",
              )}
            >
              <Filter size={13} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-4 bg-white border border-gray-200 shadow-xl rounded-lg"
            align="start"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Filters</h4>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() =>
                      setFilters({
                        category: "all",
                        brand: [],
                        itemType: "all",
                        uom: "all",
                        hsnCode: "",
                        sortOrder: "newest",
                      })
                    }
                    className="text-[10px] text-blue-600 hover:underline font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Category
                  </label>
                  <NotionSelect
                    value={filters.category}
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, category: v }))
                    }
                    placeholder="Category"
                    options={[
                      { label: "All Categories", value: "all" },
                      ...flattenTree(buildTree(categories)),
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Brand
                  </label>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {filters.brand.map((b) => (
                      <ChipTag
                        key={b}
                        onRemove={() =>
                          setFilters((f) => ({
                            ...f,
                            brand: f.brand.filter((x) => x !== b),
                          }))
                        }
                      >
                        {b}
                      </ChipTag>
                    ))}
                  </div>
                  <NotionSelect
                    value=""
                    onValueChange={(v) => {
                      if (v === "all") setFilters((f) => ({ ...f, brand: [] }));
                      else if (!filters.brand.includes(v))
                        setFilters((f) => ({ ...f, brand: [...f.brand, v] }));
                    }}
                    placeholder="Add Brand"
                    options={[
                      { label: "All Brands", value: "all" },
                      ...brands.map((b) => ({ label: b.name, value: b.name })),
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    UoM
                  </label>
                  <NotionSelect
                    value={filters.uom}
                    onValueChange={(v) => setFilters((f) => ({ ...f, uom: v }))}
                    placeholder="UoM"
                    options={[
                      { label: "All UoM", value: "all" },
                      ...uoms.map((u) => ({ label: u.name, value: u.code })),
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    HSN Code
                  </label>
                  <Input
                    placeholder="Search HSN..."
                    value={filters.hsnCode}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, hsnCode: e.target.value }))
                    }
                    className="h-8 text-xs border-gray-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Item Type
                  </label>
                  <NotionSelect
                    value={filters.itemType}
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, itemType: v }))
                    }
                    placeholder="Item Type"
                    options={[
                      { label: "All Types", value: "all" },
                      ...ITEM_TYPES.map((t) => ({ label: t, value: t })),
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Sort
                  </label>
                  <NotionSelect
                    value={filters.sortOrder}
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, sortOrder: v }))
                    }
                    placeholder="Sort"
                    options={[
                      { label: "Newest first", value: "newest" },
                      { label: "Earliest first", value: "earliest" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {activeFiltersCount > 0 && (
          <button
            onClick={() =>
              setFilters({
                category: "all",
                brand: [],
                itemType: "all",
                uom: "all",
                hsnCode: "",
                sortOrder: "newest",
              })
            }
            className="text-xs text-gray-400 hover:text-gray-600 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="px-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {[
                "Item",
                "Type / Category",
                "Stock",
                "Compliance",
                "Pricing",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className={cn(
                    "py-3 text-xs font-medium text-gray-400 text-left",
                    h === "Actions" ? "text-right" : "",
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-24 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-300" />
                  <p className="text-xs text-gray-400 mt-2">Loading...</p>
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-24 text-center">
                  <Package className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    No items match your search
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Try adjusting your filters or search terms
                  </p>
                </td>
              </tr>
            ) : (
              pagedItems.map((item) => {
                const status = stockStatus(item);
                return (
                  <React.Fragment key={item.id}>
                    <tr
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group"
                    >
                    {/* Item details */}
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                          <Package size={14} className="text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">
                            {item.sku}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Classification */}
                    <td className="py-3 pr-6">
                      <div className="text-xs text-gray-600">
                        {item.itemType || "Trading"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.category || ""}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="py-3 pr-6">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                          status.color,
                        )}
                      >
                        {status.label}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {item.stock} {item.stockUom || item.uom}
                        {" - "}reorder {item.reorderLevel}
                      </div>
                      {getLinkedWarehouseName(item) && (
                        <div className="text-xs text-gray-300">
                          {getLinkedWarehouseName(item)}
                        </div>
                      )}
                    </td>

                    {/* Compliance */}
                    <td className="py-3 pr-6">
                      <div className="text-xs font-mono text-gray-600">
                        {item.hsnCode || (
                          <span className="text-gray-300">No HSN</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        GST {item.taxRate ?? 0}%
                      </div>
                      {item.barcode ? (
                        <div className="text-xs text-gray-300 font-mono">
                          {item.barcode}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-300">No barcode</div>
                      )}
                    </td>

                    {/* Pricing */}
                    <td className="py-3 pr-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <div className="text-sm font-bold text-slate-800">
                            ₹{(item.salePrice || 0).toLocaleString()}
                          </div>
                          <button
                            onClick={() => toggleRow(item.id)}
                            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 transition-colors"
                          >
                            <ChevronDown
                              size={14}
                              className={cn(
                                "transition-transform duration-200",
                                expandedRows.has(item.id) ? "rotate-180" : ""
                              )}
                            />
                          </button>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          Cost: ₹{(item.unitPrice || 0).toLocaleString()}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        {canEdit && (
                          <ActionBtn
                            title="Edit"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit size={13} />
                          </ActionBtn>
                        )}
                        <ActionBtn
                          title="Variants"
                          onClick={() =>
                            openConnectedPage(
                              "/product-master/pm-variants",
                              item,
                            )
                          }
                        >
                          <Layers size={13} />
                        </ActionBtn>
                        <ActionBtn
                          title="Reorder rules"
                          onClick={() =>
                            openConnectedPage(
                              "/product-master/pm-reorder",
                              item,
                            )
                          }
                        >
                          <ArrowRightLeft size={13} />
                        </ActionBtn>
                        <ActionBtn
                          title="Barcode"
                          onClick={() =>
                            openConnectedPage(
                              "/product-master/pm-barcode",
                              item,
                            )
                          }
                        >
                          <Barcode size={13} />
                        </ActionBtn>
                        <ActionBtn
                          title="Pricing"
                          onClick={() =>
                            openConnectedPage(
                              "/product-master/pm-pricing",
                              item,
                            )
                          }
                        >
                          <IndianRupee size={13} />
                        </ActionBtn>
                        <ActionBtn
                          title="Warehouse"
                          onClick={() =>
                            openConnectedPage("/warehouse/wm-capacity", item)
                          }
                        >
                          <WarehouseIcon size={13} />
                        </ActionBtn>
                        {canDelete && (
                          <ActionBtn
                            title="Delete"
                            onClick={() => handleDeleteClick(item.id)}
                            className="hover:text-red-500"
                          >
                            <Trash2 size={13} />
                          </ActionBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(item.id) && (
                    <tr className="bg-slate-50/50 animate-in fade-in slide-in-from-top-1 duration-200">
                      <td colSpan={6} className="px-8 py-4 border-b border-slate-100">
                        <div className="grid grid-cols-4 gap-6">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Price</p>
                            <p className="text-sm font-bold text-slate-700">₹{(item.salePrice || 0).toLocaleString()}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Rate</p>
                            <p className="text-sm font-bold text-emerald-600">{item.taxRate || 0}%</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price Incl. GST</p>
                            <p className="text-sm font-bold text-blue-600">
                              ₹{((item.salePrice || 0) * (1 + (item.taxRate || 0) / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Stock Value</p>
                            <p className="text-sm font-bold text-slate-800">
                              ₹{( (item.stock || 0) * (item.unitPrice || 0) ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-8">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-7xl sm:max-w-7xl w-full p-0 gap-0 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="flex h-[90vh] flex-col">
            {/* Dialog header */}
            <DialogHeader className="px-7 py-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base font-semibold text-gray-900">
                    {editingItem
                      ? `Edit-${editingItem.name}`
                      : "New item record"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-400 mt-0.5">
                    Configure all product parameters in one view. Shared across
                    GRN, PO, and sales.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-7 py-8 space-y-12">
              {/* SECTION: IDENTITY */}
              <section className="space-y-6">
                <SectionHead
                  title="Item Identity"
                  icon={<Package size={14} />}
                />
                <div className="space-y-5">
                  <Row3>
                    <NField label="Item Code">
                      <Input
                        value={formData.itemCode || ""}
                        onChange={(e) => setField("itemCode", e.target.value)}
                        placeholder="ITM-0001"
                        className={inputCls}
                      />
                    </NField>
                    <NField label="SKU *">
                      <Input
                        required
                        value={formData.sku || ""}
                        onChange={(e) => setField("sku", e.target.value)}
                        placeholder="SKU-0001"
                        className={inputCls}
                      />
                    </NField>
                    <NField label="Item Type">
                      <NotionSelect
                        value={formData.itemType || ""}
                        onValueChange={(v) =>
                          setField("itemType", v as InventoryItem["itemType"])
                        }
                        placeholder="Select type"
                        options={ITEM_TYPES.map((t) => ({
                          label: t,
                          value: t,
                        }))}
                      />
                    </NField>
                  </Row3>
                  <Row2>
                    <NField label="Item Name *">
                      <Input
                        required
                        value={formData.name || ""}
                        onChange={(e) => setField("name", e.target.value)}
                        placeholder="Industrial Bearing X200"
                        className={inputCls}
                      />
                    </NField>
                    <NField label="Description">
                      <textarea
                        value={formData.description || ""}
                        onChange={(e) =>
                          setField("description", e.target.value)
                        }
                        rows={2}
                        className={cn(inputCls, "resize-none h-auto py-2")}
                        placeholder="Short product description"
                      />
                    </NField>
                  </Row2>
                </div>
              </section>

              {/* SECTION: CLASSIFICATION */}
              <section className="space-y-6">
                <SectionHead title="Classification" icon={<Tags size={14} />} />
                <Row4>
                  <NField label="Category">
                    <NotionSelect
                      value={formData.category || ""}
                      onValueChange={(v) => setField("category", v)}
                      placeholder="Category"
                      options={categories.map((c) => ({
                        label: c.name,
                        value: c.name,
                      }))}
                    />
                  </NField>
                  <NField label="Brand">
                    <NotionSelect
                      value={formData.brand || ""}
                      onValueChange={(v) => setField("brand", v)}
                      placeholder="Brand"
                      options={brands.map((b) => ({
                        label: b.name,
                        value: b.name,
                      }))}
                    />
                  </NField>
                  <NField label="HSN / SAC">
                    <NotionSelect
                      value={formData.hsnCode || ""}
                      onValueChange={(v) => setField("hsnCode", v)}
                      placeholder="HSN code"
                      options={hsns.map((h) => {
                        const code = h.code || (h as any).hsnCode;
                        const rate = h.taxRate ?? (h as any).taxPercentage ?? 0;
                        return {
                          label: `${code} - ${rate}%`,
                          value: code,
                        };
                      })}
                    />
                  </NField>
                  <NField label="Tax Rate (%)">
                    <Input
                      type="number"
                      value={formData.taxRate ?? 0}
                      onChange={(e) =>
                        setField("taxRate", Number(e.target.value))
                      }
                      className={inputCls}
                    />
                  </NField>
                </Row4>
              </section>

              {/* SECTION: UOM & REPLENISHMENT */}
              <section className="space-y-6">
                <SectionHead
                  title="UoM & Replenishment"
                  icon={<Boxes size={14} />}
                />
                <div className="space-y-6">
                  <Row4>
                    <UomSel
                      label="Default UoM"
                      value={formData.uom || ""}
                      uoms={uoms}
                      onChange={(v) => setField("uom", v)}
                    />
                    <UomSel
                      label="Purchase UoM"
                      value={formData.purchaseUom || ""}
                      uoms={uoms}
                      onChange={(v) => setField("purchaseUom", v)}
                    />
                    <UomSel
                      label="Stock UoM"
                      value={formData.stockUom || ""}
                      uoms={uoms}
                      onChange={(v) => setField("stockUom", v)}
                    />
                    <UomSel
                      label="Sales UoM"
                      value={formData.salesUom || ""}
                      uoms={uoms}
                      onChange={(v) => setField("salesUom", v)}
                    />
                  </Row4>
                  <Row4>
                    <NumFld
                      label="Min Stock"
                      value={formData.minimumStockLevel ?? 0}
                      onChange={(v) => setField("minimumStockLevel", v)}
                    />
                    <NumFld
                      label="Reorder Point"
                      value={formData.reorderLevel ?? 0}
                      onChange={(v) => setField("reorderLevel", v)}
                    />
                    <NumFld
                      label="Max Stock"
                      value={formData.maximumStockLevel ?? 0}
                      onChange={(v) => setField("maximumStockLevel", v)}
                    />
                    <NumFld
                      label="Reorder Qty"
                      value={formData.reorderQuantity ?? 0}
                      onChange={(v) => setField("reorderQuantity", v)}
                    />
                  </Row4>
                  <Row3>
                    <NumFld
                      label="Shelf Life (days)"
                      value={formData.shelfLifeDays ?? 0}
                      onChange={(v) => setField("shelfLifeDays", v)}
                    />
                    <NumFld
                      label="Lead Time (days)"
                      value={formData.leadTimeDays ?? 0}
                      onChange={(v) => setField("leadTimeDays", v)}
                    />
                    <NField label="UoM Conversion">
                      <Input
                        value={formData.uomConversions || ""}
                        onChange={(e) =>
                          setField("uomConversions", e.target.value)
                        }
                        placeholder="1 Carton = 12 Box = 144 Pcs"
                        className={inputCls}
                      />
                    </NField>
                  </Row3>
                </div>
              </section>

              {/* SECTION: WAREHOUSE */}
              <section className="space-y-6">
                <SectionHead
                  title="Warehouse Stock"
                  icon={<WarehouseIcon size={14} />}
                />
                <div className="space-y-5">
                  <Row4>
                    <NField label="Warehouse">
                      <NotionSelect
                        value={formData.warehouseId || ""}
                        onValueChange={(v) =>
                          setFormData((c) => ({
                            ...c,
                            warehouseId: v,
                            binCode: "",
                          }))
                        }
                        placeholder="Select warehouse"
                        options={warehouses.map((w) => ({
                          label: w.name,
                          value: w.id,
                        }))}
                      />
                    </NField>
                    <NField label="Bin / Location">
                      <NotionSelect
                        value={formData.binCode || ""}
                        onValueChange={(v) => setField("binCode", v)}
                        placeholder="Optional bin"
                        options={warehouseBins.map((b) => {
                          const code = b.binCode || (b as any).code || b.name;
                          return {
                            label: `${b.name} (${code})`,
                            value: code,
                          };
                        })}
                      />
                    </NField>
                    <NumFld
                      label="Opening Qty"
                      value={formData.quantity ?? 0}
                      onChange={(v) => setField("quantity", v)}
                    />
                    <NumFld
                      label="Opening Unit Cost"
                      value={formData.unitCost ?? formData.unitPrice ?? 0}
                      onChange={(v) => setField("unitCost", v)}
                    />
                  </Row4>
                  <div className="rounded-lg bg-blue-50/50 border border-blue-100 px-4 py-3 text-xs text-blue-600 flex items-center gap-2">
                    <Clock size={12} />
                    Adding opening quantity will stock this item in the selected
                    warehouse automatically.
                  </div>
                </div>
              </section>

              {/* SECTION: PRICING */}
              <section className="space-y-6">
                <SectionHead
                  title="Pricing & Valuation"
                  icon={<IndianRupee size={14} />}
                />
                <div className="space-y-6">
                  <Row4>
                    <NumFld
                      label="Standard Cost (Base)"
                      value={formData.unitPrice ?? 0}
                      onChange={(v) => setField("unitPrice", v)}
                    />
                    <NumFld
                      label="Selling Price (Base)"
                      value={formData.salePrice ?? 0}
                      onChange={(v) => setField("salePrice", v)}
                    />
                    <NumFld
                      label="MRP"
                      value={formData.mrp ?? 0}
                      onChange={(v) => setField("mrp", v)}
                    />
                    <NField label="Currency">
                      <Input
                        value={formData.currency || "INR"}
                        onChange={(e) => setField("currency", e.target.value)}
                        className={inputCls}
                      />
                    </NField>
                  </Row4>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Real-time Pricing Breakdown</h4>
                    </div>
                    <div className="grid grid-cols-4 gap-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Price Incl. GST</p>
                        <p className="text-xl font-black text-blue-600">
                          ₹{((formData.salePrice || 0) * (1 + (formData.taxRate || 0) / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">Calculation: Base + {formData.taxRate || 0}% Tax</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total Inventory Value</p>
                        <p className="text-xl font-black text-slate-800">
                          ₹{((formData.quantity || 0) * (formData.unitPrice || 0)).toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">Based on Opening Stock</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Margin per Unit</p>
                        <p className="text-xl font-black text-emerald-600">
                          ₹{Math.max(0, (formData.salePrice || 0) - (formData.unitPrice || 0)).toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">Base Price - Cost Price</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Profit %</p>
                        <p className="text-xl font-black text-slate-900">
                          {formData.unitPrice ? (((formData.salePrice || 0) - formData.unitPrice) / formData.unitPrice * 100).toFixed(1) : 0}%
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">Gross Margin Ratio</p>
                      </div>
                    </div>
                  </div>

                  <Row4>
                    <NumFld
                      label="Customer Price"
                      value={formData.customerPrice ?? 0}
                      onChange={(v) => setField("customerPrice", v)}
                    />
                    <NumFld
                      label="Qty Break Price"
                      value={formData.quantityBreakPrice ?? 0}
                      onChange={(v) => setField("quantityBreakPrice", v)}
                    />
                    <div />
                    <NField label="Valuation Method">
                      <NotionSelect
                        value={formData.valuationMethod || ""}
                        onValueChange={(v) =>
                          setField(
                            "valuationMethod",
                            v as InventoryItem["valuationMethod"],
                          )
                        }
                        placeholder="Method"
                        options={VALUATION_METHODS.map((m) => ({
                          label: m,
                          value: m,
                        }))}
                      />
                    </NField>
                  </Row4>
                  <Row2>
                    <NField label="Price From">
                      <Input
                        type="date"
                        value={formData.priceEffectiveFrom || ""}
                        onChange={(e) =>
                          setField("priceEffectiveFrom", e.target.value)
                        }
                        className={inputCls}
                      />
                    </NField>
                    <NField label="Price To">
                      <Input
                        type="date"
                        value={formData.priceEffectiveTo || ""}
                        onChange={(e) =>
                          setField("priceEffectiveTo", e.target.value)
                        }
                        className={inputCls}
                      />
                    </NField>
                  </Row2>
                </div>
              </section>

              {/* SECTION: BARCODES & MEDIA */}
              <section className="space-y-6">
                <SectionHead
                  title="Barcodes & Media"
                  icon={<Barcode size={14} />}
                />
                <div className="space-y-8">
                  <Row3>
                    <NField label="Primary Barcode">
                      <Input
                        value={formData.barcode || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormData((c) => ({
                            ...c,
                            barcode: v,
                            barcodes: v
                              ? [
                                  v,
                                  ...(c.barcodes || []).filter((b) => b !== v),
                                ]
                              : c.barcodes || [],
                          }));
                        }}
                        placeholder="Primary barcode"
                        className={inputCls}
                      />
                    </NField>
                    <NField label="QR Code">
                      <Input
                        value={formData.qrCode || ""}
                        onChange={(e) => setField("qrCode", e.target.value)}
                        placeholder="Internal QR value"
                        className={inputCls}
                      />
                    </NField>
                    <NField label="Format">
                      <NotionSelect
                        value={formData.barcodeFormat || ""}
                        onValueChange={(v) =>
                          setField(
                            "barcodeFormat",
                            v as InventoryItem["barcodeFormat"],
                          )
                        }
                        placeholder="Format"
                        options={BARCODE_FORMATS.map((f) => ({
                          label: f,
                          value: f,
                        }))}
                      />
                    </NField>
                  </Row3>

                  {/* Additional barcodes */}
                  <NField label="Additional Barcodes">
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={barcodeDraft}
                        onChange={(e) => setBarcodeDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addBarcode();
                          }
                        }}
                        placeholder="Scan or type barcode"
                        className={cn(inputCls, "flex-1")}
                      />
                      <Button
                        type="button"
                        onClick={addBarcode}
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs border-gray-200 font-normal"
                      >
                        <Plus size={12} className="mr-1" /> Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 min-h-6">
                      {(formData.barcodes || []).length === 0 ? (
                        <span className="text-xs text-gray-300">
                          No additional barcodes
                        </span>
                      ) : (
                        (formData.barcodes || []).map((code) => (
                          <ChipTag
                            key={code}
                            onRemove={() => removeBarcode(code)}
                          >
                            {code}
                          </ChipTag>
                        ))
                      )}
                    </div>
                  </NField>

                  {/* Attributes */}
                  <NField label="Attributes">
                    <div className="flex gap-2 mb-3">
                      <NotionSelect
                        value={attributeDraft.name}
                        onValueChange={(v) =>
                          setAttributeDraft((c) => ({ ...c, name: v }))
                        }
                        placeholder="Attribute"
                        className="flex-1"
                        options={attributes.map((a) => ({
                          label: a.name,
                          value: a.name,
                        }))}
                      />
                      <Input
                        value={attributeDraft.value}
                        onChange={(e) =>
                          setAttributeDraft((c) => ({
                            ...c,
                            value: e.target.value,
                          }))
                        }
                        placeholder="Value"
                        className={cn(inputCls, "flex-1")}
                      />
                      <Button
                        type="button"
                        onClick={addAttribute}
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs border-gray-200 font-normal"
                      >
                        <Plus size={12} className="mr-1" /> Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(formData.attributes || {}).map(
                        ([n, v]) => (
                          <ChipTag key={n} onRemove={() => removeAttribute(n)}>
                            {n}: {v}
                          </ChipTag>
                        ),
                      )}
                    </div>
                  </NField>

                  {/* Images */}
                  <NField label="Image URLs">
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={imageDraft}
                        onChange={(e) => setImageDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addImage();
                          }
                        }}
                        placeholder="https://..."
                        className={cn(inputCls, "flex-1")}
                      />
                      <Button
                        type="button"
                        onClick={addImage}
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs border-gray-200 font-normal"
                      >
                        <Plus size={12} className="mr-1" /> Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(formData.images || []).length === 0 ? (
                        <span className="text-xs text-gray-300">No images</span>
                      ) : (
                        (formData.images || []).map((url) => (
                          <ChipTag
                            key={url}
                            onRemove={() => removeImage(url)}
                            className="max-w-xs truncate"
                          >
                            {url}
                          </ChipTag>
                        ))
                      )}
                    </div>
                  </NField>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-between bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
              <div className="text-xs text-gray-400 italic">
                Scroll to view all sections
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-normal text-gray-500 hover:bg-gray-50"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs font-medium bg-gray-900 hover:bg-gray-800 text-white px-6 transition-all"
                >
                  {editingItem
                    ? "Update shared record"
                    : "Create shared record"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        itemName={items.find((i) => i.id === deleteTargetId)?.name}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

// -- Shared UI components --

const ActionBtn: React.FC<{
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ title, onClick, children, className }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={cn(
      "h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors",
      className,
    )}
  >
    {children}
  </button>
);

const SectionHead: React.FC<{ title: string; icon: React.ReactNode }> = ({
  title,
  icon,
}) => (
  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
    <div className="h-6 w-6 rounded bg-gray-50 flex items-center justify-center text-gray-400">
      {icon}
    </div>
    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">
      {title}
    </h3>
  </div>
);

const NField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium text-gray-500">{label}</Label>
    {children}
  </div>
);

const NumFld: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => (
  <NField label={label}>
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={inputCls}
    />
  </NField>
);

const UomSel: React.FC<{
  label: string;
  value: string;
  uoms: UOM[];
  onChange: (v: string) => void;
}> = ({ label, value, uoms, onChange }) => (
  <NField label={label}>
    <NotionSelect
      value={value}
      onValueChange={onChange}
      placeholder="UoM"
      options={uoms.map((u) => ({
        label: `${u.name} (${u.code})`,
        value: u.code,
      }))}
    />
  </NField>
);

const ChipTag: React.FC<{
  children: React.ReactNode;
  onRemove: () => void;
  className?: string;
}> = ({ children, onRemove, className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-md bg-gray-50 border border-gray-100 px-2 py-0.5 text-xs text-gray-600 font-mono",
      className,
    )}
  >
    {children}
    <button
      type="button"
      onClick={onRemove}
      className="text-gray-300 hover:text-red-500 transition-colors ml-0.5"
    >
      <X size={10} />
    </button>
  </span>
);

// Layout helpers
const Row2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
);
const Row3: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{children}</div>
);
const Row4: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">{children}</div>
);

export default ItemMaster;
