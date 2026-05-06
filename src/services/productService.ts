import api from "./api";
import { authService } from "./authService";
import { mockDb } from "./mockDb";
import { InventoryItem, Category, Brand, UOM, HSN, Attribute } from "@/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getOrgId = () => {
  const user = authService.getCurrentUser();
  return user?.organisationId;
};

export const productService = {
  // --- Item Master Operations ---
  getAllItems: async (): Promise<InventoryItem[]> => {
    const orgId = getOrgId();
    if (!orgId) return [];
    const response = await api.get(`/inventory/product/all/${orgId}`);
    const products = response.data.products || [];
    // Map _id to id for frontend compatibility and calculate total stock
    return products.map((item: any) => {
      const totalStock = (item.stocks || []).reduce(
        (acc: number, s: any) => acc + (s.quantity || 0),
        0,
      );
      return {
        ...item,
        id: item._id,
        itemCode: item.itemCode || item.sku,
        itemType: item.itemType || item.inventoryItemType || "Trading",
        uom: item.uom || item.stockUom || item.unitOfMeasure || "",
        stockUom: item.stockUom || item.uom || item.unitOfMeasure || "",
        purchaseUom: item.purchaseUom || item.uom || item.unitOfMeasure || "",
        salesUom: item.salesUom || item.uom || item.unitOfMeasure || "",
        reorderLevel: item.minStock || 0,
        minimumStockLevel: item.minimumStockLevel ?? item.minStock ?? 0,
        maximumStockLevel: item.maximumStockLevel ?? 0,
        reorderQuantity: item.reorderQuantity ?? 0,
        stock: totalStock,
        stocks: item.stocks || [],
        warehouseId: item.warehouseId || item.stocks?.[0]?.warehouseId || "",
        quantity: item.quantity ?? item.stocks?.[0]?.quantity ?? 0,
        unitCost: item.unitCost ?? item.stocks?.[0]?.unitCost ?? 0,
        binCode: item.binCode || item.bins?.[0] || "",
        salePrice: item.salesPrice || 0,
        mrp: item.mrp || 0,
        unitPrice: item.purchasePrice || 0,
        taxRate: item.taxRate ?? item.salesTax ?? 0,
        barcodes: item.barcodes || (item.barcode ? [item.barcode] : []),
        images: item.images || [],
        status:
          totalStock === 0
            ? "Out of Stock"
            : totalStock <= (item.minStock || 0)
              ? "Low Stock"
              : "In Stock",
      };
    });
  },

  createItem: async (
    item: Omit<InventoryItem, "id">,
  ): Promise<InventoryItem> => {
    const payload = {
      ...item,
      type: item.itemType === "Service" ? "services" : "goods",
      itemCode: item.itemCode || item.sku,
      unitOfMeasure: item.stockUom || item.uom,
      quantity: item.quantity || 0,
      unitCost: item.unitCost || item.unitPrice || 0,
      barcode: item.barcode || item.barcodes?.[0] || "",
      barcodes: item.barcodes || (item.barcode ? [item.barcode] : []),
      salesPrice: item.salePrice,
      purchasePrice: item.unitPrice,
      minStock: item.reorderLevel,
      salesTax: item.taxRate,
      purchaseTax: item.taxRate,
    };
    const response = await api.post("/inventory/product/create", payload);
    return response.data.product;
  },

  updateItem: async (
    id: string,
    updates: Partial<InventoryItem>,
  ): Promise<InventoryItem> => {
    const payload = {
      ...updates,
      ...(updates.salePrice !== undefined && { salesPrice: updates.salePrice }),
      ...(updates.unitPrice !== undefined && {
        purchasePrice: updates.unitPrice,
      }),
      ...(updates.reorderLevel !== undefined && {
        minStock: updates.reorderLevel,
      }),
      ...(updates.quantity !== undefined &&
        updates.warehouseId && {
          stocks: [
            {
              warehouseId: updates.warehouseId,
              quantity: updates.quantity,
              unitCost: updates.unitCost || updates.unitPrice || 0,
            },
          ],
        }),
      ...(updates.taxRate !== undefined && {
        salesTax: updates.taxRate,
        purchaseTax: updates.taxRate,
      }),
      ...(updates.barcodes !== undefined && {
        barcode: updates.barcode || updates.barcodes[0] || "",
      }),
      ...((updates.stockUom || updates.uom) && {
        unitOfMeasure: updates.stockUom || updates.uom,
      }),
    };
    const response = await api.put(`/product/update/${id}`, payload);
    return response.data.product;
  },

  // Specific Updates for Sub-modules
  updateItemPricing: async (
    id: string,
    pricing: { unitPrice: number; mrp: number; salePrice: number },
  ): Promise<void> => {
    // Backend uses salesPrice and others. Mapping unitPrice to costPrice if exists, but Product model seems to have salesPrice.
    // Let's use the generic updateItem
    await productService.updateItem(id, { ...pricing } as any);
  },

  updateReorderLevel: async (
    id: string,
    reorderLevel: number,
  ): Promise<void> => {
    await delay(200);
    const items = mockDb.getItems();
    const index = items.findIndex((i) => i.id === id);
    if (index !== -1) {
      items[index].reorderLevel = reorderLevel;
      // Auto update status based on new level
      if (items[index].stock <= reorderLevel) {
        items[index].status =
          items[index].stock === 0 ? "Out of Stock" : "Low Stock";
      } else {
        items[index].status = "In Stock";
      }
      mockDb.saveItems(items);
    }
  },

  updateBarcode: async (id: string, barcode: string): Promise<void> => {
    await productService.updateItem(id, { barcode } as any);
  },

  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/product/delete/${id}`);
  },

  // --- Category Operations ---
  getCategories: async (orgId?: string) => {
    const response = await api.get("/inventory/category", {
      params: { organisationId: orgId },
    });
    return (response.data.items || []).map((i: any) => ({ ...i, id: i._id }));
  },
  addCategory: async (data: any) => {
    const response = await api.post("/inventory", {
      ...data,
      type: "category",
    });
    return response.data;
  },
  deleteCategory: async (id: string) => {
    const orgId = getOrgId();
    await api.delete(`/inventory/${id}`, { params: { organisationId: orgId } });
  },

  // --- Brand Operations ---
  getBrands: async (orgId?: string) => {
    const response = await api.get("/inventory/brand", {
      params: { organisationId: orgId },
    });
    return (response.data.items || []).map((i: any) => ({ ...i, id: i._id }));
  },
  addBrand: async (data: any) => {
    const response = await api.post("/inventory", { ...data, type: "brand" });
    return response.data;
  },
  deleteBrand: async (id: string) => {
    const orgId = getOrgId();
    await api.delete(`/inventory/${id}`, { params: { organisationId: orgId } });
  },

  // --- UOM Operations ---
  getUOMs: async (orgId?: string) => {
    const response = await api.get("/inventory/uom", {
      params: { organisationId: orgId },
    });
    return (response.data.items || []).map((i: any) => ({ ...i, id: i._id }));
  },
  addUOM: async (data: any) => {
    const response = await api.post("/inventory", { ...data, type: "uom" });
    return response.data;
  },
  deleteUOM: async (id: string) => {
    const orgId = getOrgId();
    await api.delete(`/inventory/${id}`, { params: { organisationId: orgId } });
  },

  // --- HSN Operations ---
  getHSN: async (orgId?: string) => {
    const response = await api.get("/inventory/hsn", {
      params: { organisationId: orgId },
    });
    return (response.data.items || []).map((i: any) => ({ ...i, id: i._id }));
  },
  addHSN: async (data: any) => {
    const response = await api.post("/inventory", { ...data, type: "hsn" });
    return response.data;
  },
  deleteHSN: async (id: string) => {
    const orgId = getOrgId();
    await api.delete(`/inventory/${id}`, { params: { organisationId: orgId } });
  },

  // --- Attributes Operations ---
  getAttributes: async () => {
    await delay(200);
    return mockDb.getAttributes();
  },
  addAttribute: async (data: Omit<Attribute, "id">) => {
    await delay(200);
    const list = mockDb.getAttributes();
    const newRec = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveAttributes([...list, newRec]);
    return newRec;
  },
  deleteAttribute: async (id: string) => {
    await delay(200);
    mockDb.saveAttributes(mockDb.getAttributes().filter((i) => i.id !== id));
  },
};
