import { mockDb } from './mockDb';
import { AuditSession, AuditItem, InventoryItem } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const auditService = {
  // --- Audit Sessions ---
  getAuditSessions: async (): Promise<AuditSession[]> => {
    await delay(200);
    return mockDb.getAuditSessions().sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  },

  getAuditSessionById: async (id: string): Promise<AuditSession | null> => {
    await delay(100);
    return mockDb.getAuditSessions().find(s => s.id === id) || null;
  },

  createAuditSession: async (type: 'Full' | 'Cycle', warehouseId: string, categoryFilter?: string): Promise<AuditSession> => {
    await delay(400);
    const sessions = mockDb.getAuditSessions();
    const warehouses = mockDb.getWarehouses();
    const items = mockDb.getItems();
    const warehouse = warehouses.find(w => w.id === warehouseId);

    // Filter items based on audit scope
    let auditItems: AuditItem[] = items
        .filter(i => !categoryFilter || i.category === categoryFilter)
        .map(i => ({
            itemId: i.id,
            itemName: i.name,
            sku: i.sku,
            systemQty: i.stock, // Snapshot current stock
            physicalQty: undefined, // To be filled
            variance: 0,
            status: 'Pending'
        }));

    const newSession: AuditSession = {
        id: Math.random().toString(36).substr(2, 9),
        reference: `AUD-${new Date().getFullYear()}-${String(sessions.length + 1).padStart(3, '0')}`,
        type,
        status: 'Planned',
        startDate: new Date().toISOString().split('T')[0],
        warehouseId,
        warehouseName: warehouse?.name || 'Unknown',
        auditor: 'Current User', // Placeholder
        progress: 0,
        items: auditItems
    };

    mockDb.saveAuditSessions([newSession, ...sessions]);
    return newSession;
  },

  startAudit: async (id: string): Promise<void> => {
      await delay(200);
      const sessions = mockDb.getAuditSessions();
      const idx = sessions.findIndex(s => s.id === id);
      if(idx !== -1) {
          sessions[idx].status = 'In Progress';
          mockDb.saveAuditSessions(sessions);
      }
  },

  // Update physical count for an item in a session
  updateAuditCount: async (sessionId: string, itemId: string, qty: number): Promise<void> => {
      await delay(200);
      const sessions = mockDb.getAuditSessions();
      const sIdx = sessions.findIndex(s => s.id === sessionId);
      if(sIdx === -1) return;

      const session = sessions[sIdx];
      const iIdx = session.items.findIndex(i => i.itemId === itemId);
      if(iIdx !== -1) {
          session.items[iIdx].physicalQty = qty;
          session.items[iIdx].variance = qty - session.items[iIdx].systemQty;
          session.items[iIdx].status = 'Counted';
          
          // Recalc progress
          const counted = session.items.filter(i => i.status !== 'Pending').length;
          session.progress = Math.round((counted / session.items.length) * 100);
          
          mockDb.saveAuditSessions(sessions);
      }
  },

  finalizeAudit: async (id: string): Promise<void> => {
      await delay(500);
      const sessions = mockDb.getAuditSessions();
      const idx = sessions.findIndex(s => s.id === id);
      if(idx === -1) return;

      const session = sessions[idx];
      session.status = 'Completed';
      session.completionDate = new Date().toISOString().split('T')[0];
      mockDb.saveAuditSessions(sessions);

      // Auto-Create Stock Adjustments for variances
      const adjustments = mockDb.getAdjustments();
      const inventory = mockDb.getItems();
      
      session.items.forEach(item => {
          if(item.variance !== 0) {
              // 1. Create Adjustment Record
              adjustments.push({
                  id: Math.random().toString(36).substr(2, 9),
                  reference: `ADJ-AUD-${session.reference}`,
                  date: new Date().toISOString().split('T')[0],
                  itemId: item.itemId,
                  itemName: item.itemName,
                  warehouseId: session.warehouseId,
                  type: 'Correction', // Audit correction
                  quantity: Math.abs(item.variance),
                  impact: item.variance > 0 ? 'Add' : 'Deduct',
                  reason: `Audit Variance: ${session.reference}`,
                  status: 'Approved' // Auto-approve audit corrections usually
              });

              // 2. Update Stock Master
              const invIdx = inventory.findIndex(i => i.id === item.itemId);
              if(invIdx !== -1) {
                  inventory[invIdx].stock += item.variance; // Direct adjustment
                  inventory[invIdx].lastUpdated = new Date().toISOString().split('T')[0];
              }
          }
      });

      mockDb.saveAdjustments(adjustments);
      mockDb.saveItems(inventory);
  }
};
