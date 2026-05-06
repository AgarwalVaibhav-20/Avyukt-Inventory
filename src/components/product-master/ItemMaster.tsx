"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { productService } from "@/services/productService";
import { warehouseService } from "@/services/warehouseService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchItems } from "@/store/slices/inventorySlice";
import { Attribute, Bin, Brand, Category, HSN, InventoryItem, UOM, Warehouse } from "@/types";
import {
  ArrowRightLeft,
  Barcode,
  Boxes,
  Clock,
  Download,
  Edit,
  Filter,
  Image,
  IndianRupee,
  Layers,
  Loader2,
  Package,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  Tags,
  Trash2,
  Warehouse as WarehouseIcon,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const ITEM_TYPES = [
  "Raw Material",
  "Finished Goods",
  "Semi-Finished",
  "Consumable",
  "Trading",
  "Service",
] as const;

const BARCODE_FORMATS = ["Code128", "EAN-13", "QR"] as const;
const VALUATION_METHODS = ["FIFO", "LIFO", "Weighted Average", "Standard Cost"] as const;

const emptyForm: Partial<InventoryItem> = {
  itemCode: "",
  name: "",
  sku: "",
  description: "",
  itemType: "Trading",
  category: "",
  brand: "",
  uom: "",
  stockUom: "",
  purchaseUom: "",
  salesUom: "",
  uomConversions: "",
  warehouseId: "",
  quantity: 0,
  unitCost: 0,
  binCode: "",
  unitPrice: 0,
  salePrice: 0,
  mrp: 0,
  customerPrice: 0,
  quantityBreakPrice: 0,
  currency: "INR",
  priceEffectiveFrom: "",
  priceEffectiveTo: "",
  reorderLevel: 5,
  minimumStockLevel: 0,
  maximumStockLevel: 0,
  reorderQuantity: 0,
  leadTimeDays: 0,
  shelfLifeDays: 0,
  hsnCode: "",
  taxRate: 0,
  barcode: "",
  barcodes: [],
  qrCode: "",
  barcodeFormat: "Code128",
  images: [],
  attributes: {},
  valuationMethod: "FIFO",
  status: "in-stock",
};

const ItemMaster: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading } = useAppSelector((state) => state.inventory);

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [hsns, setHsns] = useState<HSN[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);

  const [formData, setFormData] = useState<Partial<InventoryItem>>(emptyForm);
  const [attributeDraft, setAttributeDraft] = useState({ name: "", value: "" });
  const [barcodeDraft, setBarcodeDraft] = useState("");
  const [imageDraft, setImageDraft] = useState("");

  const loadItems = () => dispatch(fetchItems());

  const loadMasterData = async () => {
    try {
      const [catData, brandData, uomData, hsnData, attrData, warehouseData] = await Promise.all([
        productService.getCategories(),
        productService.getBrands(),
        productService.getUOMs(),
        productService.getHSN(),
        productService.getAttributes(),
        warehouseService.getAllWarehouses(),
      ]);
      setCategories(catData);
      setBrands(brandData);
      setUoms(uomData);
      setHsns(hsnData);
      setAttributes(attrData);
      setWarehouses(warehouseData);
    } catch (error) {
      console.error("Failed to load master data", error);
    }
  };

  useEffect(() => {
    loadItems();
    loadMasterData();
  }, []);

  useEffect(() => {
    setFormData(editingItem ? { ...emptyForm, ...editingItem } : emptyForm);
    setAttributeDraft({ name: "", value: "" });
    setBarcodeDraft("");
    setImageDraft("");
  }, [editingItem]);

  const selectedHsn = useMemo(
    () => hsns.find((h) => h.code === formData.hsnCode || (h as any).hsnCode === formData.hsnCode),
    [hsns, formData.hsnCode],
  );

  useEffect(() => {
    if (selectedHsn) {
      setFormData((current) => ({
        ...current,
        taxRate: selectedHsn.taxRate ?? (selectedHsn as any).taxPercentage ?? current.taxRate ?? 0,
      }));
    }
  }, [selectedHsn]);

  useEffect(() => {
    const loadBins = async () => {
      if (!formData.warehouseId) {
        setBins([]);
        return;
      }

      try {
        const data = await warehouseService.getAllBins({
          warehouseId: formData.warehouseId,
        });
        setBins(data);
      } catch (error) {
        console.error("Failed to load warehouse bins", error);
        setBins([]);
      }
    };

    loadBins();
  }, [formData.warehouseId]);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      (item.itemCode || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.barcode || "").toLowerCase().includes(search.toLowerCase()),
  );

  const setField = <K extends keyof InventoryItem>(field: K, value: InventoryItem[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await productService.deleteItem(id);
      loadItems();
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
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
    const nextAttributes = { ...(formData.attributes || {}) };
    delete nextAttributes[name];
    setFormData((current) => ({ ...current, attributes: nextAttributes }));
  };

  const addBarcode = () => {
    const nextBarcode = barcodeDraft.trim();
    if (!nextBarcode) return;

    setFormData((current) => {
      const existing = current.barcodes || (current.barcode ? [current.barcode] : []);
      const nextBarcodes = existing.includes(nextBarcode) ? existing : [...existing, nextBarcode];
      return {
        ...current,
        barcode: current.barcode || nextBarcode,
        barcodes: nextBarcodes,
      };
    });
    setBarcodeDraft("");
  };

  const removeBarcode = (code: string) => {
    setFormData((current) => {
      const nextBarcodes = (current.barcodes || []).filter((barcode) => barcode !== code);
      return {
        ...current,
        barcodes: nextBarcodes,
        barcode: current.barcode === code ? nextBarcodes[0] || "" : current.barcode,
      };
    });
  };

  const addImage = () => {
    const nextImage = imageDraft.trim();
    if (!nextImage) return;
    setFormData((current) => ({
      ...current,
      images: (current.images || []).includes(nextImage)
        ? current.images || []
        : [...(current.images || []), nextImage],
    }));
    setImageDraft("");
  };

  const removeImage = (url: string) => {
    setFormData((current) => ({
      ...current,
      images: (current.images || []).filter((image) => image !== url),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized: Partial<InventoryItem> = {
      ...formData,
      itemCode: formData.itemCode || formData.sku,
      stockUom: formData.stockUom || formData.uom,
      purchaseUom: formData.purchaseUom || formData.uom,
      salesUom: formData.salesUom || formData.uom,
      reorderLevel: formData.reorderLevel || formData.minimumStockLevel || 0,
      minimumStockLevel: formData.minimumStockLevel || formData.reorderLevel || 0,
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
        await productService.createItem({
          ...normalized,
          stock: 0,
          consignmentStock: 0,
          lastUpdated: new Date().toISOString().split("T")[0],
        } as Omit<InventoryItem, "id">);
      }
      setIsDialogOpen(false);
      loadItems();
    } catch (error) {
      console.error("Failed to save item", error);
      alert("Failed to save item. Please check the required fields and try again.");
    }
  };

  const openConnectedPage = (path: string, item: InventoryItem) => {
    navigate(`${path}?item=${item.id}&sku=${encodeURIComponent(item.sku)}`);
  };

  const getLinkedWarehouseName = (item: InventoryItem) => {
    const linkedWarehouseId = item.warehouseId || item.stocks?.[0]?.warehouseId;
    return warehouses.find((warehouse) => warehouse.id === linkedWarehouseId)?.name;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4">
            <Plus className="mr-2 h-4 w-4" /> Add New Item
          </Button>
          <Button variant="outline" className="border-gray-200 text-gray-700 h-10 px-4">
            <Download className="mr-2 h-4 w-4" /> Import/Export
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={16} />
            <Input
              type="text"
              placeholder="Search code, SKU, name, barcode..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9 w-72 h-10 border-gray-200 focus-visible:ring-blue-500"
            />
          </div>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
            <Filter size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 font-medium">Item Master</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{items.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 font-medium">Low Stock</div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {items.filter((item) => item.stock <= item.reorderLevel).length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 font-medium">Missing Barcode</div>
          <div className="mt-2 text-2xl font-bold text-purple-600">
            {items.filter((item) => !item.barcode).length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500 font-medium">GST Linked</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {items.filter((item) => item.hsnCode).length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-gray-600">Item Details</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Classification</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Stock Rules</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Compliance</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Pricing</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Connected Pages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-gray-400 mt-2">Loading items...</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No items found</p>
                    <p className="text-gray-400 text-xs">Add an item to create the shared product record.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{item.name}</div>
                          <div className="text-[11px] uppercase tracking-wider font-bold text-gray-400">
                            Code: {item.itemCode || item.sku} | SKU: {item.sku}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {Object.entries(item.attributes || {}).slice(0, 3).map(([name, value]) => (
                              <Badge key={name} variant="outline" className="text-[10px]">
                                {name}: {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="font-medium">{item.itemType || "Trading"}</div>
                      <div className="text-xs text-gray-400">{item.category || "No category"}</div>
                      <div className="text-xs text-gray-400">{item.brand || "No brand"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          item.stock > item.reorderLevel
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : item.stock === 0
                              ? "bg-rose-50 text-rose-700 border-rose-100"
                              : "bg-amber-50 text-amber-700 border-amber-100",
                        )}
                        variant="outline"
                      >
                        {item.stock > item.reorderLevel ? "In Stock" : item.stock === 0 ? "Out of Stock" : "Low Stock"}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.stock} {item.stockUom || item.uom} / reorder {item.reorderLevel}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {getLinkedWarehouseName(item) || "No warehouse linked"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-slate-700">{item.hsnCode || "No HSN"}</div>
                      <div className="text-xs text-slate-400">GST {item.taxRate ?? 0}%</div>
                      <div className="text-xs text-slate-400">{item.barcode || "No barcode"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">INR {(item.salePrice || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-gray-400">Cost: INR {(item.unitPrice || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Edit item" onClick={() => handleOpenEdit(item)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Variants" onClick={() => openConnectedPage("/product-master/pm-variants", item)}>
                          <Layers size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" title="UoM and reorder" onClick={() => openConnectedPage("/product-master/pm-reorder", item)}>
                          <ArrowRightLeft size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Barcode mapping" onClick={() => openConnectedPage("/product-master/pm-barcode", item)}>
                          <Barcode size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Pricing" onClick={() => openConnectedPage("/product-master/pm-pricing", item)}>
                          <IndianRupee size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Warehouse" onClick={() => openConnectedPage("/warehouse/wm-capacity", item)}>
                          <WarehouseIcon size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:text-rose-600" title="Delete" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[920px] bg-white p-0 overflow-hidden border-none shadow-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="px-8 pt-8 pb-6 bg-gray-50/70">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Package size={22} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {editingItem ? "Edit Item Master Record" : "New Item Master Record"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 font-medium">
                    Single source of truth used by GRN, PO, sales, barcode, valuation, and replenishment.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-8 space-y-8 max-h-[68vh] overflow-y-auto">
              <section className="space-y-5">
                <SectionTitle icon={<Package size={16} />} label="Core Item Identity" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Field label="Item Code">
                    <Input value={formData.itemCode || ""} onChange={(event) => setField("itemCode", event.target.value)} placeholder="ITM-0001" />
                  </Field>
                  <Field label="SKU">
                    <Input required value={formData.sku || ""} onChange={(event) => setField("sku", event.target.value)} placeholder="SKU-0001" />
                  </Field>
                  <Field label="Item Type">
                    <Select value={formData.itemType} onValueChange={(value) => setField("itemType", value as InventoryItem["itemType"])}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {ITEM_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Item Name">
                    <Input required value={formData.name || ""} onChange={(event) => setField("name", event.target.value)} placeholder="Industrial Bearing X200" />
                  </Field>
                  <Field label="Description">
                    <textarea
                      value={formData.description || ""}
                      onChange={(event) => setField("description", event.target.value)}
                      className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Short product description"
                    />
                  </Field>
                </div>
              </section>

              <Separator />

              <section className="space-y-5">
                <SectionTitle icon={<Tags size={16} />} label="Classification Masters" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <Field label="Category">
                    <Select value={formData.category} onValueChange={(value) => setField("category", value)}>
                      <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {categories.map((category) => <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Brand">
                    <Select value={formData.brand} onValueChange={(value) => setField("brand", value)}>
                      <SelectTrigger><SelectValue placeholder="Brand" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {brands.map((brand) => <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="HSN / SAC">
                    <Select value={formData.hsnCode} onValueChange={(value) => setField("hsnCode", value)}>
                      <SelectTrigger><SelectValue placeholder="HSN/SAC" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {hsns.map((hsn) => {
                          const code = hsn.code || (hsn as any).hsnCode;
                          const rate = hsn.taxRate ?? (hsn as any).taxPercentage ?? 0;
                          return <SelectItem key={hsn.id} value={code}>{code} - {rate}%</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tax Rate (%)">
                    <Input type="number" value={formData.taxRate ?? 0} onChange={(event) => setField("taxRate", Number(event.target.value))} />
                  </Field>
                </div>
              </section>

              <Separator />

              <section className="space-y-5">
                <SectionTitle icon={<Boxes size={16} />} label="UoM, Lifecycle, and Replenishment" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <UomSelect label="Default UoM" value={formData.uom || ""} uoms={uoms} onChange={(value) => setField("uom", value)} />
                  <UomSelect label="Purchase UoM" value={formData.purchaseUom || ""} uoms={uoms} onChange={(value) => setField("purchaseUom", value)} />
                  <UomSelect label="Stock UoM" value={formData.stockUom || ""} uoms={uoms} onChange={(value) => setField("stockUom", value)} />
                  <UomSelect label="Sales UoM" value={formData.salesUom || ""} uoms={uoms} onChange={(value) => setField("salesUom", value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <NumberField label="Min Stock" value={formData.minimumStockLevel ?? 0} onChange={(value) => setField("minimumStockLevel", value)} />
                  <NumberField label="Reorder Point" value={formData.reorderLevel ?? 0} onChange={(value) => setField("reorderLevel", value)} />
                  <NumberField label="Max Stock" value={formData.maximumStockLevel ?? 0} onChange={(value) => setField("maximumStockLevel", value)} />
                  <NumberField label="Reorder Qty / EOQ" value={formData.reorderQuantity ?? 0} onChange={(value) => setField("reorderQuantity", value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <NumberField label="Shelf Life (days)" value={formData.shelfLifeDays ?? 0} onChange={(value) => setField("shelfLifeDays", value)} />
                  <NumberField label="Lead Time (days)" value={formData.leadTimeDays ?? 0} onChange={(value) => setField("leadTimeDays", value)} />
                  <Field label="UoM Conversion">
                    <Input value={formData.uomConversions || ""} onChange={(event) => setField("uomConversions", event.target.value)} placeholder="1 Carton = 12 Box = 144 Piece" />
                  </Field>
                </div>
              </section>

              <Separator />

              <section className="space-y-5">
                <SectionTitle icon={<WarehouseIcon size={16} />} label="Warehouse Link and Opening Stock" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <Field label="Warehouse">
                    <Select
                      value={formData.warehouseId}
                      onValueChange={(value) =>
                        setFormData((current) => ({
                          ...current,
                          warehouseId: value,
                          binCode: "",
                        }))
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Bin / Location">
                    <Select value={formData.binCode} onValueChange={(value) => setField("binCode", value)}>
                      <SelectTrigger><SelectValue placeholder="Optional bin" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {bins.map((bin) => {
                          const code = bin.binCode || (bin as any).code || bin.name;
                          return (
                            <SelectItem key={bin.id} value={code}>
                              {bin.name} ({code})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </Field>
                  <NumberField label="Opening Qty" value={formData.quantity ?? 0} onChange={(value) => setField("quantity", value)} />
                  <NumberField label="Opening Unit Cost" value={formData.unitCost ?? formData.unitPrice ?? 0} onChange={(value) => setField("unitCost", value)} />
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  Creating an item with a warehouse and opening quantity adds stock to the product record and to that warehouse's product list.
                </div>
              </section>

              <Separator />

              <section className="space-y-5">
                <SectionTitle icon={<IndianRupee size={16} />} label="Pricing and Valuation" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <NumberField label="Standard Cost" value={formData.unitPrice ?? 0} onChange={(value) => setField("unitPrice", value)} />
                  <NumberField label="Purchase Price" value={formData.unitPrice ?? 0} onChange={(value) => setField("unitPrice", value)} />
                  <NumberField label="Selling Price" value={formData.salePrice ?? 0} onChange={(value) => setField("salePrice", value)} />
                  <NumberField label="MRP" value={formData.mrp ?? 0} onChange={(value) => setField("mrp", value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <NumberField label="Customer Price" value={formData.customerPrice ?? 0} onChange={(value) => setField("customerPrice", value)} />
                  <NumberField label="Qty Break Price" value={formData.quantityBreakPrice ?? 0} onChange={(value) => setField("quantityBreakPrice", value)} />
                  <Field label="Currency">
                    <Input value={formData.currency || "INR"} onChange={(event) => setField("currency", event.target.value)} />
                  </Field>
                  <Field label="Valuation Method">
                    <Select value={formData.valuationMethod} onValueChange={(value) => setField("valuationMethod", value as InventoryItem["valuationMethod"])}>
                      <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {VALUATION_METHODS.map((method) => <SelectItem key={method} value={method}>{method}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Price Effective From">
                    <Input type="date" value={formData.priceEffectiveFrom || ""} onChange={(event) => setField("priceEffectiveFrom", event.target.value)} />
                  </Field>
                  <Field label="Price Effective To">
                    <Input type="date" value={formData.priceEffectiveTo || ""} onChange={(event) => setField("priceEffectiveTo", event.target.value)} />
                  </Field>
                </div>
              </section>

              <Separator />

              <section className="space-y-5">
                <SectionTitle icon={<ReceiptText size={16} />} label="Barcode, QR, Images, and Attributes" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Field label="Barcode">
                    <Input
                      value={formData.barcode || ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setFormData((current) => ({
                          ...current,
                          barcode: value,
                          barcodes: value
                            ? [value, ...(current.barcodes || []).filter((code) => code !== value)]
                            : current.barcodes || [],
                        }));
                      }}
                      placeholder="Primary barcode"
                    />
                  </Field>
                  <Field label="QR Code">
                    <Input value={formData.qrCode || ""} onChange={(event) => setField("qrCode", event.target.value)} placeholder="Internal QR value" />
                  </Field>
                  <Field label="Barcode Format">
                    <Select value={formData.barcodeFormat} onValueChange={(value) => setField("barcodeFormat", value as InventoryItem["barcodeFormat"])}>
                      <SelectTrigger><SelectValue placeholder="Format" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {BARCODE_FORMATS.map((format) => <SelectItem key={format} value={format}>{format}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2"><Barcode size={14} /> Barcode / QR Mappings</Label>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <Input
                        value={barcodeDraft}
                        onChange={(event) => setBarcodeDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addBarcode();
                          }
                        }}
                        placeholder="Scan or type another barcode"
                      />
                      <button type="button" onClick={addBarcode} className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <Plus size={16} className="mr-2" /> Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-7">
                      {(formData.barcodes || []).length === 0 ? (
                        <span className="text-xs text-slate-400">No additional codes added.</span>
                      ) : (
                        (formData.barcodes || []).map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => removeBarcode(code)}
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-mono text-slate-700 hover:border-rose-200 hover:text-rose-600"
                            title="Click to remove"
                          >
                            {code}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2"><Tags size={14} /> Configurable Attributes</Label>
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <Select value={attributeDraft.name} onValueChange={(value) => setAttributeDraft((current) => ({ ...current, name: value }))}>
                        <SelectTrigger><SelectValue placeholder="Attribute" /></SelectTrigger>
                        <SelectContent className="bg-white">
                          {attributes.map((attribute) => <SelectItem key={attribute.id} value={attribute.name}>{attribute.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input value={attributeDraft.value} onChange={(event) => setAttributeDraft((current) => ({ ...current, value: event.target.value }))} placeholder="Value" />
                      <button type="button" onClick={addAttribute} className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <Plus size={16} className="mr-2" /> Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(formData.attributes || {}).map(([name, value]) => (
                        <button key={name} type="button" onClick={() => removeAttribute(name)} className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:border-rose-200 hover:text-rose-600">
                          {name}: {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2"><Image size={14} /> Image URLs</Label>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <Input
                        value={imageDraft}
                        onChange={(event) => setImageDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addImage();
                          }
                        }}
                        placeholder="https://..."
                      />
                      <button type="button" onClick={addImage} className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <Plus size={16} className="mr-2" /> Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-7">
                      {(formData.images || []).length === 0 ? (
                        <span className="text-xs text-slate-400">No image URLs added.</span>
                      ) : (
                        (formData.images || []).map((url) => (
                          <button key={url} type="button" onClick={() => removeImage(url)} className="max-w-full truncate rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:border-rose-200 hover:text-rose-600" title="Click to remove">
                            {url}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-900">
                <LinkedHint icon={<Layers size={14} />} label="Variants use this item as parent." />
                <LinkedHint icon={<QrCode size={14} />} label="Barcode page maps codes to this SKU." />
                <LinkedHint icon={<Clock size={14} />} label="Reorder page reads these thresholds." />
                <LinkedHint icon={<IndianRupee size={14} />} label="Pricing page updates these prices." />
              </div>
            </div>

            <DialogFooter className="px-8 py-6 bg-gray-50/70 border-t border-gray-100 gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 font-bold">
                {editingItem ? "Update Item" : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <Label className="text-sm font-semibold text-gray-700">{label}</Label>
    {children}
  </div>
);

const NumberField: React.FC<{ label: string; value: number; onChange: (value: number) => void }> = ({ label, value, onChange }) => (
  <Field label={label}>
    <Input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </Field>
);

const UomSelect: React.FC<{ label: string; value: string; uoms: UOM[]; onChange: (value: string) => void }> = ({ label, value, uoms, onChange }) => (
  <Field label={label}>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select UoM" /></SelectTrigger>
      <SelectContent className="bg-white">
        {uoms.map((uom) => <SelectItem key={uom.id} value={uom.code}>{uom.name} ({uom.code})</SelectItem>)}
      </SelectContent>
    </Select>
  </Field>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2">
    <div className="h-7 w-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">{icon}</div>
    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</h3>
  </div>
);

const LinkedHint: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 font-medium">
    {icon}
    <span>{label}</span>
  </div>
);

export default ItemMaster;
