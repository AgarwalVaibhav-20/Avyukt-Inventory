import api from './api';
import { AuditSession } from '@/types';

const mapAuditSession = (session: any): AuditSession => ({
  ...session,
  id: session._id || session.id,
  startDate: session.startDate
    ? new Date(session.startDate).toISOString().split('T')[0]
    : '',
  completionDate: session.completionDate
    ? new Date(session.completionDate).toISOString().split('T')[0]
    : undefined,
  items: (session.items || []).map((item: any) => ({
    ...item,
    itemId: String(item.itemId?._id || item.itemId || ''),
    warehouseId: String(item.warehouseId?._id || item.warehouseId || session.warehouseId || ''),
    warehouseName: item.warehouseName || session.warehouseName || '',
    systemQty: Number(item.systemQty || 0),
    physicalQty:
      item.physicalQty === undefined || item.physicalQty === null
        ? undefined
        : Number(item.physicalQty),
    variance: Number(item.variance || 0),
    unitCost: Number(item.unitCost || 0),
    varianceValue: Number(item.varianceValue || 0),
  })),
});

export const auditService = {
  getAuditSessions: async (): Promise<AuditSession[]> => {
    const res = await api.get('/api/audit-sessions');
    return (res.data.data || []).map(mapAuditSession);
  },

  getAuditSessionById: async (id: string): Promise<AuditSession | null> => {
    const res = await api.get(`/api/audit-sessions/${id}`);
    return res.data.data ? mapAuditSession(res.data.data) : null;
  },

  createAuditSession: async (type: 'Full' | 'Cycle', warehouseId: string, categoryFilter?: string): Promise<AuditSession> => {
    const res = await api.post('/api/audit-sessions', { type, warehouseId, categoryFilter });
    return mapAuditSession(res.data.data);
  },

  startAudit: async (id: string): Promise<void> => {
    await api.put(`/api/audit-sessions/${id}/start`);
  },

  updateAuditCount: async (sessionId: string, itemId: string, qty: number): Promise<AuditSession> => {
    const res = await api.put(`/api/audit-sessions/${sessionId}/count`, { itemId, qty });
    return mapAuditSession(res.data.data);
  },

  finalizeAudit: async (id: string): Promise<void> => {
    await api.put(`/api/audit-sessions/${id}/finalize`);
  }
};
