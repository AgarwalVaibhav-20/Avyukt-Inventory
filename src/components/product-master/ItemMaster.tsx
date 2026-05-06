"use client";
import { cn } from "@/lib/utils";

import React, { useEffect, useState } from "react";
import { productService } from "@/services/productService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchItems } from "@/store/slices/inventorySlice";
import { InventoryItem, Category, Brand, UOM, HSN } from "@/types";
import {
  Plus,
  Filter,
  Download,
  Edit,
  Trash2,
  Loader2,
  Search,
  MoreVertical,
  Package,
  Barcode,
  Layers,
  ArrowRightLeft,
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

const ItemMaster: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.inventory);

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Master Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [hsns, setHsns] = useState<HSN[]>([]);

  // Form State
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: "",
    sku: "",
    category: "",
    brand: "",
    uom: "",
    unitPrice: 0,
    salePrice: 0,
    mrp: 0,
    reorderLevel: 5,
    hsnCode: "",
    barcode: "",
    status: "in-stock",
    type: "goods",
  });

  const loadItems = () => {
    dispatch(fetchItems());
  };

  const loadMasterData = async () => {
    try {
      const [catData, brandData, uomData, hsnData] = await Promise.all([
        productService.getCategories(),
        productService.getBrands(),
        productService.getUOMs(),
        productService.getHSN(),
      ]);
      setCategories(catData);
      setBrands(brandData);
      setUoms(uomData);
      setHsns(hsnData);
    } catch (error) {
      console.error("Failed to load master data", error);
    }
  };

  useEffect(() => {
    loadItems();
    loadMasterData();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      setFormData({
        name: "",
        sku: "",
        category: "",
        brand: "",
        uom: "",
        unitPrice: 0,
        salePrice: 0,
        mrp: 0,
        reorderLevel: 5,
        hsnCode: "",
        barcode: "",
        status: "in-stock",
        type: "goods",
      });
    }
  }, [editingItem]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await productService.updateItem(editingItem.id, formData);
      } else {
        await productService.createItem({
          ...formData,
          stock: 0,
          consignmentStock: 0,
          lastUpdated: new Date().toISOString().split("T")[0],
        } as Omit<InventoryItem, "id">);
      }
      setIsDialogOpen(false);
      loadItems();
    } catch (error) {
      console.error("Failed to save item", error);
    }
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <Button
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Item
          </Button>
          <Button
            variant="outline"
            className="border-gray-200 text-gray-700 rounded-xl h-10 px-4"
          >
            <Download className="mr-2 h-4 w-4" /> Import/Export
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              size={16}
            />
            <Input
              type="text"
              placeholder="Search SKU or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64 h-10 border-gray-200 focus-visible:ring-blue-500 rounded-xl"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-gray-600"
          >
            <Filter size={20} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-gray-600">
                  Item Details
                </th>
                <th className="px-6 py-4 font-semibold text-gray-600">
                  Stock Status
                </th>
                <th className="px-6 py-4 font-semibold text-gray-600">
                  Pricing
                </th>
                <th className="px-6 py-4 font-semibold text-gray-600">
                  Category
                </th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-gray-400 mt-2">Loading items...</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No items found</p>
                    <p className="text-gray-400 text-xs">
                      Try adjusting your search or add a new item.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                            SKU: {item.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
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
                          {item.stock > item.reorderLevel
                            ? "In Stock"
                            : item.stock === 0
                              ? "Out of Stock"
                              : "Low Stock"}
                        </Badge>
                        <div className="text-xs text-gray-500 font-medium ml-1">
                          {item.stock} {item.uom} available
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        ₹{(item.salePrice || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        MRP: ₹{(item.mrp || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="text-sm font-medium">{item.category}</div>
                      <div className="text-xs text-gray-400">{item.brand}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="px-8 pt-8 pb-6 bg-gray-50/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  <Package size={22} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {editingItem ? "Edit Product" : "New Product"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 font-medium">
                    {editingItem
                      ? "Update existing product details"
                      : "Add a new product to your inventory"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-1 bg-blue-600 rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Basic Information
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-semibold text-gray-700 ml-1"
                    >
                      Product Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g. Wireless Mouse"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="h-11 border-gray-100 bg-gray-50/30 focus-visible:ring-blue-500 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="sku"
                      className="text-sm font-semibold text-gray-700 ml-1"
                    >
                      SKU Code
                    </Label>
                    <Input
                      id="sku"
                      placeholder="e.g. WM-001"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                      required
                      className="h-11 border-gray-100 bg-gray-50/30 focus-visible:ring-blue-500 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">
                      Category
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) =>
                        setFormData({ ...formData, category: v })
                      }
                    >
                      <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl">
                        {categories.map((c) => (
                          <SelectItem
                            key={c.id}
                            value={c.name}
                            className="focus:bg-blue-50 focus:text-blue-600 rounded-lg mx-1 my-0.5"
                          >
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">
                      Brand
                    </Label>
                    <Select
                      value={formData.brand}
                      onValueChange={(v) =>
                        setFormData({ ...formData, brand: v })
                      }
                    >
                      <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl">
                        {brands.map((b) => (
                          <SelectItem
                            key={b.id}
                            value={b.name}
                            className="focus:bg-blue-50 focus:text-blue-600 rounded-lg mx-1 my-0.5"
                          >
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-100" />

              {/* Pricing & Compliance Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-1 bg-amber-500 rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Pricing & Compliance
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="unitPrice"
                      className="text-sm font-semibold text-gray-700 ml-1"
                    >
                      Cost Price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                        ₹
                      </span>
                      <Input
                        id="unitPrice"
                        type="number"
                        value={formData.unitPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            unitPrice: Number(e.target.value),
                          })
                        }
                        className="h-11 pl-7 border-gray-100 bg-gray-50/30 focus-visible:ring-blue-500 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="mrp"
                      className="text-sm font-semibold text-gray-700 ml-1"
                    >
                      MRP
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                        ₹
                      </span>
                      <Input
                        id="mrp"
                        type="number"
                        value={formData.mrp}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mrp: Number(e.target.value),
                          })
                        }
                        className="h-11 pl-7 border-gray-100 bg-gray-50/30 focus-visible:ring-blue-500 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="salePrice"
                      className="text-sm font-semibold text-gray-700 ml-1"
                    >
                      Sale Price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                        ₹
                      </span>
                      <Input
                        id="salePrice"
                        type="number"
                        value={formData.salePrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salePrice: Number(e.target.value),
                          })
                        }
                        className="h-11 pl-7 border-gray-100 bg-gray-50/30 focus-visible:ring-blue-500 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">
                      UOM
                    </Label>
                    <Select
                      value={formData.uom}
                      onValueChange={(v) =>
                        setFormData({ ...formData, uom: v })
                      }
                    >
                      <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl">
                        {uoms.map((u) => (
                          <SelectItem
                            key={u.id}
                            value={u.code}
                            className="focus:bg-blue-50 focus:text-blue-600 rounded-lg mx-1 my-0.5"
                          >
                            {u.name} ({u.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 ml-1">
                      HSN Code
                    </Label>
                    <Select
                      value={formData.hsnCode}
                      onValueChange={(v) =>
                        setFormData({ ...formData, hsnCode: v })
                      }
                    >
                      <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="HSN/SAC" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl">
                        {hsns.map((h) => (
                          <SelectItem
                            key={h.id}
                            value={h.code}
                            className="focus:bg-blue-50 focus:text-blue-600 rounded-lg mx-1 my-0.5"
                          >
                            {h.code} - {h.taxRate}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="reorder"
                      className="text-sm font-semibold text-gray-700 ml-1"
                    >
                      Reorder Level
                    </Label>
                    <Input
                      id="reorder"
                      type="number"
                      value={formData.reorderLevel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reorderLevel: Number(e.target.value),
                        })
                      }
                      className="h-11 border-gray-100 bg-gray-50/30 focus-visible:ring-blue-500 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-100" />

              {/* Extra Info Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-1 bg-purple-500 rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Inventory Identifiers
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="barcode"
                    className="text-sm font-semibold text-gray-700 ml-1"
                  >
                    Barcode / UPC
                  </Label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="barcode"
                      placeholder="Scan or enter barcode"
                      value={formData.barcode}
                      onChange={(e) =>
                        setFormData({ ...formData, barcode: e.target.value })
                      }
                      className="h-11 pl-9 border-gray-100 bg-gray-50/30 focus-visible:ring-blue-500 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl h-11 px-6 text-gray-500 font-bold hover:bg-gray-200/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
              >
                {editingItem ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemMaster;
