import api from './api';
import { authService } from './authService';
import { mockDb } from './mockDb';
import { ApprovalItem, MovementAnalysis, WarehouseStockReport, InOutSummary, InventoryItem } from '@/types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getOrgId = () => {
  const user = authService.getCurrentUser();
  return user?.organisationId;
};

const mapApprovalFromBackend = (approval: any): ApprovalItem => {
  return {
    id: String(approval._id || approval.id || ''),
    type: approval.type || 'Purchase Order',
    reference: approval.reference || approval.poNo || approval.grnNumber || approval.prNumber || '',
    status: approval.status || 'Pending',
    initiator: approval.initiator || approval.createdBy?.name || 'System',
    date: approval.date || approval.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    details: approval.details || `${approval.type || 'Document'} pending approval`,
  };
};

export const dashboardService = {
  
  // 1. Pending Approvals - Fetch from multiple sources (PO, GRN, PR, Stock Transfer)
  getPendingApprovals: async (): Promise<ApprovalItem[]> => {
    const orgId = getOrgId();
    if (!orgId) return [];
    
    try {
      console.log('📊 Fetching pending approvals from backend...');
      
      // Fetch from multiple approval sources
      const [prsResponse, grnsResponse, posResponse] = await Promise.all([
        api.get('/purchase/requisitions/pending').catch(e => ({ data: { data: [] } })),
        api.get('/inward/grns/for-approval').catch(e => ({ data: { data: [] } })),
        api.get('/purchase/orders', { params: { status: 'Pending' } }).catch(e => ({ data: { data: [] } })),
      ]);

      const approvals: ApprovalItem[] = [];

      // Map PRs
      (prsResponse.data.data || []).forEach((pr: any) => {
        approvals.push({
          id: String(pr._id || pr.id),
          type: 'Purchase Requisition',
          reference: pr.prNumber || pr.reference || '',
          status: 'Pending Approval',
          initiator: pr.createdBy?.name || 'System',
          date: pr.createdAt?.split('T')[0] || '',
          details: `Amount: ${pr.totalAmount || 0} | Items: ${pr.items?.length || 0}`,
        });
      });

      // Map GRNs
      (grnsResponse.data.data || []).forEach((grn: any) => {
        approvals.push({
          id: String(grn._id || grn.id),
          type: 'GRN - QC',
          reference: grn.grnNumber || '',
          status: 'QC Completed',
          initiator: grn.inspectedBy?.name || 'System',
          date: grn.qcDate?.split('T')[0] || grn.createdAt?.split('T')[0] || '',
          details: `PO: ${grn.purchaseOrderId?.poNo || 'N/A'} | Items: ${grn.items?.length || 0}`,
        });
      });

      // Map POs
      (posResponse.data.data || posResponse.data.purchaseOrders || [])
        .filter((po: any) => po.status === 'Pending' || po.status === 'Draft')
        .forEach((po: any) => {
          approvals.push({
            id: String(po._id || po.id),
            type: 'Purchase Order',
            reference: po.poNo || '',
            status: 'Pending Approval',
            initiator: po.createdBy?.name || 'System',
            date: po.createdAt?.split('T')[0] || '',
            details: `Vendor: ${po.vendor || 'N/A'} | Amount: ${po.totalAmount || 0}`,
          });
        });

      console.log(`✅ Fetched ${approvals.length} pending approvals from backend`);
      return approvals;
    } catch (error: any) {
      console.error('❌ Failed to fetch approvals from backend:', error.message);
      // Fallback to mock data
      console.log('⚠️ Falling back to mock data');
      await delay(200);
      const mockPRs = mockDb.getPRs().filter(p => p.status === 'Pending Approval').map(pr => ({
        id: pr.id,
        type: 'Purchase Requisition',
        reference: pr.prNumber || '',
        status: 'Pending Approval',
        initiator: 'System',
        date: pr.date || '',
        details: `Items: ${pr.items?.length || 0}`,
      }));
      return mockPRs;
    }
  },

  // 2. Expiry Alerts - Fetch from batch/expiry tracking endpoint
  getExpiryAlerts: async () => {
    const orgId = getOrgId();
    if (!orgId) return [];
    
    try {
      console.log('🔔 Fetching expiry alerts from backend...');
      const response = await api.get('/inventory/batches/expiring', {
        params: { days: 90, organisationId: orgId }
      }).catch(() => api.get(`/stockcontrol/expiry-tracking/${orgId}`).catch(() => ({ data: { data: [] } })));

      const batches = response.data.data || response.data.batches || [];
      console.log(`✅ Fetched ${batches.length} expiring batches`);
      
      return batches.map((batch: any) => ({
        id: String(batch._id || batch.id),
        batchNumber: batch.batchNumber || batch.batchNo || batch.batch || '',
        itemId: String(batch.materialId || batch.productId || batch.itemId || ''),
        itemName: batch.itemName || batch.name || '',
        expiryDate: batch.expiryDate || batch.expDate || '',
        quantity: Number(batch.quantity || batch.remainingQuantity || 0),
        mfgDate: batch.mfgDate || batch.manufacturingDate || '',
        costPrice: Number(batch.costPrice || batch.unitCost || 0),
        warehouseId: batch.warehouseId || batch.warehouse?._id || batch.locationId || '',
        warehouse: batch.warehouse?.name || batch.warehouseName || batch.warehouse || batch.location || '',
        location: batch.locationName || batch.location || batch.binCode || batch.bin || '',
        status: batch.status || 'Active'
      })).sort((a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    } catch (error: any) {
      console.error('❌ Failed to fetch expiry alerts:', error.message);
      await delay(200);
      const batches = mockDb.getBatches();
      const today = new Date();
      
      return batches.filter(b => {
        if (b.status === 'Depleted') return false;
        const expDate = new Date(b.expiryDate);
        const diffDays = (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        return diffDays < 90;
      }).sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    }
  },

  // 3. Fast / Slow / Non-Moving Analysis - From movement analysis endpoint
  getMovementAnalysis: async (): Promise<MovementAnalysis[]> => {
    const orgId = getOrgId();
    if (!orgId) return [];
    
    try {
      console.log('📈 Fetching movement analysis from backend...');
      const response = await api.get(`/inventory/moves-analysis/${orgId}`, {
        params: { days: 30 }
      }).catch(() => api.get('/inventory/dashboard/overview', { params: { organisationId: orgId } }));

      const data = response.data.movementAnalysis || response.data.data || [];
      console.log(`✅ Fetched movement analysis for ${data.length} items`);
      
      return data.map((item: any) => ({
        itemId: String(item._id || item.itemId || item.id),
        itemName: item.name || item.itemName || '',
        sku: item.sku || '',
        category: item.category || '',
        turnoverRate: Number(item.turnoverRate || item.outwardQty || 0),
        classification: item.classification || item.movementType || 'Non-Moving',
        lastMovementDate: item.lastMovementDate || item.lastMove || 'N/A'
      }));
    } catch (error: any) {
      console.error('❌ Failed to fetch movement analysis:', error.message);
      await delay(500);
      const items = mockDb.getItems();
      const ledger = mockDb.getStockLedger();
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

      return items.map(item => {
        const recentOut = ledger.filter(e => 
          e.itemId === item.id && 
          e.quantityChange < 0 && 
          new Date(e.date) >= thirtyDaysAgo
        );
        
        const totalOutQty = recentOut.reduce((sum, e) => sum + Math.abs(e.quantityChange), 0);
        
        let classification: MovementAnalysis['classification'] = 'Non-Moving';
        if (totalOutQty > 50) classification = 'Fast Moving';
        else if (totalOutQty > 0) classification = 'Slow Moving';

        const allItemMoves = ledger.filter(e => e.itemId === item.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastMove = allItemMoves.length > 0 ? allItemMoves[0].date : 'N/A';

        return {
          itemId: item.id,
          itemName: item.name,
          sku: item.sku,
          category: item.category,
          turnoverRate: totalOutQty,
          classification,
          lastMovementDate: lastMove
        };
      });
    }
  },

  // 4. Warehouse-wise Stock - From warehouse distribution endpoint
  getWarehouseStockReport: async (): Promise<WarehouseStockReport[]> => {
    const orgId = getOrgId();
    if (!orgId) return [];
    try {
      console.log('🏭 Fetching warehouse stock distribution from backend...');
      const response = await api.get(`/inventory/dashboard/overview/${orgId}`);
      const warehouses = response.data.warehouseDistribution || response.data.warehouses || [];
      console.log(`✅ Fetched data for ${warehouses.length} warehouses`);
      return warehouses;
    } catch (error: any) {
      console.error("Failed to fetch warehouse stock report:", error.message);
      return [];
    }
  },

  // 5. Inward vs Outward Summary - From material movement endpoint
  getInOutSummary: async (): Promise<InOutSummary[]> => {
    const orgId = getOrgId();
    if (!orgId) return [];
    
    try {
      console.log('📊 Fetching inward/outward summary from backend...');
      const response = await api.get(`/inventory/dashboard/inout-summary/${orgId}`, {
        params: { months: 6 }
      }).catch(() => api.get(`/inventory/dashboard/overview/${orgId}`));

      const data = response.data.inOutSummary || response.data.monthlyData || response.data.data || [];
      console.log(`✅ Fetched inward/outward data for ${data.length} periods`);
      
      return data.map((period: any) => ({
        period: period.period || period.month || period.key || '',
        inwardQty: Number(period.inwardQty || period.inboundQty || 0),
        outwardQty: Number(period.outwardQty || period.outboundQty || 0),
        inwardValue: Number(period.inwardValue || 0),
        outwardValue: Number(period.outwardValue || 0)
      }));
    } catch (error: any) {
      console.error('❌ Failed to fetch inward/outward summary:', error.message);
      await delay(400);
      const ledger = mockDb.getStockLedger();
      const items = mockDb.getItems();
      
      const months = [];
      for(let i=5; i>=0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toLocaleString('default', { month: 'short', year: 'numeric' }));
      }

      const summaryMap: Record<string, InOutSummary> = {};
      months.forEach(m => {
        summaryMap[m] = { period: m, inwardQty: 0, outwardQty: 0, inwardValue: 0, outwardValue: 0 };
      });

      ledger.forEach(entry => {
        const date = new Date(entry.date);
        const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        if(summaryMap[key]) {
          const item = items.find(i => i.id === entry.itemId);
          const cost = item?.unitPrice || 0;
          const sale = item?.salePrice || 0;

          if(entry.quantityChange > 0) {
            summaryMap[key].inwardQty += entry.quantityChange;
            summaryMap[key].inwardValue += entry.quantityChange * cost;
          } else {
            const qty = Math.abs(entry.quantityChange);
            summaryMap[key].outwardQty += qty;
            summaryMap[key].outwardValue += qty * sale;
          }
        }
      });

      return Object.values(summaryMap);
    }
  }
};
