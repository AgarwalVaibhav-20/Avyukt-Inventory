import api from './api';
import { QualityParameter, InspectionPlan, QualityChecklistTemplate, ReworkEntry, NCR } from '@/types';

export const qualityService = {
  // --- Quality Parameters ---
  getParameters: async (): Promise<QualityParameter[]> => {
    const response = await api.get('/api/quality-parameters');
    return response.data;
  },

  addParameter: async (data: Omit<QualityParameter, 'id'>): Promise<QualityParameter> => {
    const response = await api.post('/api/quality-parameters', data);
    return response.data;
  },

  deleteParameter: async (id: string): Promise<void> => {
    await api.delete(`/api/quality-parameters/${id}`);
  },

  // --- Inspection Plans ---
  getInspectionPlans: async (): Promise<InspectionPlan[]> => {
    const response = await api.get('/api/inspection-plans');
    return response.data;
  },

  saveInspectionPlan: async (plan: Omit<InspectionPlan, 'id'>): Promise<InspectionPlan> => {
    const response = await api.post('/api/inspection-plans', plan);
    return response.data;
  },

  deleteInspectionPlan: async (id: string): Promise<void> => {
    await api.delete(`/api/inspection-plans/${id}`);
  },

  // --- Checklists ---
  getChecklists: async (): Promise<QualityChecklistTemplate[]> => {
    const response = await api.get('/api/checklists');
    return response.data;
  },

  addChecklist: async (data: Omit<QualityChecklistTemplate, 'id'>): Promise<QualityChecklistTemplate> => {
    const response = await api.post('/api/checklists', data);
    return response.data;
  },

  deleteChecklist: async (id: string): Promise<void> => {
    await api.delete(`/api/checklists/${id}`);
  },

  // --- Rework ---
  getReworkEntries: async (): Promise<ReworkEntry[]> => {
    const response = await api.get('/api/rework');
    return response.data;
  },

  createReworkEntry: async (data: Omit<ReworkEntry, 'id' | 'status' | 'date'>): Promise<ReworkEntry> => {
    const response = await api.post('/api/rework', data);
    return response.data;
  },

  updateReworkStatus: async (id: string, status: ReworkEntry['status'], outcome?: ReworkEntry['outcome']): Promise<void> => {
    await delay(300);
    const list = mockDb.getReworkEntries();
    const index = list.findIndex(r => r.id === id);
    if(index !== -1) {
        list[index].status = status;
        if(outcome) list[index].outcome = outcome;
        if(status === 'Completed' || status === 'Scrapped') {
            list[index].completionDate = new Date().toISOString().split('T')[0];
        }
        mockDb.saveReworkEntries(list);
    }
  },

  // --- NCR ---
  getNCRs: async (): Promise<NCR[]> => {
    const response = await api.get('/api/ncrs');
    return response.data;
  },

  createNCR: async (data: Omit<NCR, 'id' | 'ncrNumber' | 'status' | 'date'>): Promise<NCR> => {
    const response = await api.post('/api/ncrs', data);
    return response.data;
  },

  updateNCR: async (id: string, updates: Partial<NCR>): Promise<void> => {
    await api.put(`/api/ncrs/${id}`, updates);
  }
};
