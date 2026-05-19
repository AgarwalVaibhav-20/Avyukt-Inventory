import api from "./api";
import { authService } from "./authService";
import {
  ApprovalItem,
  InOutSummary,
  MovementAnalysis,
  WarehouseStockReport,
} from "@/types";

const getOrgId = () => {
  const user = authService.getCurrentUser();
  return user?.organisationId;
};

const getOverview = async (orgId: string, months = 6) => {
  const response = await api.get(`/inventory/dashboard/overview/${orgId}`, {
    params: { months },
  });

  return response.data || {};
};

export const dashboardService = {
  getPendingApprovals: async (): Promise<ApprovalItem[]> => {
    const orgId = getOrgId();
    if (!orgId) return [];

    try {
      console.log("Loading pending approvals from backend...");

      const [prsResponse, grnsResponse, posResponse] = await Promise.all([
        api
          .get("/purchase/requisitions/pending")
          .catch(() => ({ data: { data: [] } })),
        api
          .get("/inward/grns/for-approval")
          .catch(() => ({ data: { data: [] } })),
        api
          .get("/purchase/orders", { params: { status: "Pending" } })
          .catch(() => ({ data: { data: [] } })),
      ]);

      const approvals: ApprovalItem[] = [];

      (prsResponse.data.data || []).forEach((pr: any) => {
        approvals.push({
          id: String(pr._id || pr.id),
          type: "Purchase Requisition",
          reference: pr.prNumber || pr.reference || "",
          status: "Pending Approval",
          initiator: pr.createdBy?.name || "System",
          date: pr.createdAt?.split("T")[0] || "",
          details: `Amount: ${pr.totalAmount || 0} | Items: ${pr.items?.length || 0}`,
        });
      });

      (grnsResponse.data.data || []).forEach((grn: any) => {
        approvals.push({
          id: String(grn._id || grn.id),
          type: "GRN - QC",
          reference: grn.grnNumber || "",
          status: "QC Completed",
          initiator: grn.inspectedBy?.name || "System",
          date: grn.qcDate?.split("T")[0] || grn.createdAt?.split("T")[0] || "",
          details: `PO: ${grn.purchaseOrderId?.poNo || "N/A"} | Items: ${grn.items?.length || 0}`,
        });
      });

      (posResponse.data.data || posResponse.data.purchaseOrders || [])
        .filter((po: any) => po.status === "Pending" || po.status === "Draft")
        .forEach((po: any) => {
          approvals.push({
            id: String(po._id || po.id),
            type: "Purchase Order",
            reference: po.poNo || "",
            status: "Pending Approval",
            initiator: po.createdBy?.name || "System",
            date: po.createdAt?.split("T")[0] || "",
            details: `Vendor: ${po.vendor || "N/A"} | Amount: ${po.totalAmount || 0}`,
          });
        });

      console.log(`Fetched ${approvals.length} pending approvals from backend`);
      return approvals;
    } catch (error: any) {
      console.error("Failed to fetch approvals from backend:", error.message);
      return [];
    }
  },

  getExpiryAlerts: async () => {
    const orgId = getOrgId();
    if (!orgId) return [];

    try {
      console.log("Loading expiry alerts from backend...");

      const response = await api.get("/api/stockcontrol/expiry-tracking", {
        params: {
          organisationId: orgId,
          limit: 200,
        },
      });

      const batches = response.data.items || response.data.data || response.data.batches || [];
      console.log(`Fetched ${batches.length} expiring batches`);

      return batches
        .map((batch: any) => ({
          id: String(batch._id || batch.id),
          batchNumber: batch.batchNumber || batch.batchNo || batch.batch || "",
          itemId: String(batch.materialId || batch.productId || batch.itemId || ""),
          itemName: batch.itemName || batch.name || "",
          expiryDate: batch.expiryDate || batch.expDate || "",
          quantity: Number(batch.quantity || batch.remainingQuantity || 0),
          mfgDate: batch.mfgDate || batch.manufacturingDate || "",
          costPrice: Number(batch.costPrice || batch.unitCost || 0),
          warehouseId: batch.warehouseId || batch.warehouse?._id || batch.locationId || "",
          warehouse:
            batch.warehouse?.name ||
            batch.warehouseName ||
            batch.warehouse ||
            batch.location ||
            "",
          location: batch.locationName || batch.location || batch.binCode || batch.bin || "",
          status: batch.status || batch.expiryStatus || "Active",
        }))
        .sort(
          (a: any, b: any) =>
            new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
        );
    } catch (error: any) {
      console.error("Failed to fetch expiry alerts:", error.message);
      return [];
    }
  },

  getMovementAnalysis: async (): Promise<MovementAnalysis[]> => {
    const orgId = getOrgId();
    if (!orgId) return [];

    try {
      console.log("Loading movement analysis from backend...");

      let data: any[] = [];

      try {
        const response = await api.get(`/moves-analysis/all/${orgId}`);
        data = response.data.movesAnalysis || response.data.data || [];
      } catch {
        const overview = await getOverview(orgId, 6);
        data = overview.topItems || [];
      }

      console.log(`Fetched movement analysis for ${data.length} items`);

      return data.map((item: any) => ({
        itemId: String(item._id || item.itemId || item.id),
        itemName: item.name || item.itemName || "",
        sku: item.sku || item.id || "",
        category: item.category || "",
        turnoverRate: Number(item.turnoverRate || item.outwardQty || item.value || 0),
        classification:
          item.classification ||
          item.movementType ||
          (item.status === "ok"
            ? "Fast Moving"
            : item.status === "low"
              ? "Slow Moving"
              : "Non-Moving"),
        lastMovementDate: item.lastMovementDate || item.lastMove || "N/A",
      }));
    } catch (error: any) {
      console.error("Failed to fetch movement analysis:", error.message);
      return [];
    }
  },

  getWarehouseStockReport: async (): Promise<WarehouseStockReport[]> => {
    const orgId = getOrgId();
    if (!orgId) return [];

    try {
      console.log("Loading warehouse stock distribution from backend...");
      const overview = await getOverview(orgId, 6);
      const warehouses = overview.warehouseDistribution || overview.warehouses || [];
      console.log(`Fetched data for ${warehouses.length} warehouses`);
      return warehouses;
    } catch (error: any) {
      console.error("Failed to fetch warehouse stock report:", error.message);
      return [];
    }
  },

  getInOutSummary: async (): Promise<InOutSummary[]> => {
    const orgId = getOrgId();
    if (!orgId) return [];

    try {
      console.log("Loading inward/outward summary from backend...");
      const overview = await getOverview(orgId, 6);
      const data =
        overview.inOutSummary ||
        overview.monthlyData ||
        overview.monthlyTrend ||
        overview.data ||
        [];

      console.log(`Fetched inward/outward data for ${data.length} periods`);

      return data.map((period: any) => ({
        period: period.period || period.month || period.key || "",
        inwardQty: Number(period.inwardQty || period.inboundQty || period.totalStock || 0),
        outwardQty: Number(period.outwardQty || period.outboundQty || 0),
        inwardValue: Number(period.inwardValue || period.totalValue || 0),
        outwardValue: Number(period.outwardValue || 0),
      }));
    } catch (error: any) {
      console.error("Failed to fetch inward/outward summary:", error.message);
      return [];
    }
  },
};
