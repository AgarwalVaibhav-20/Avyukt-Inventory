import { mockDb } from './mockDb';
import { QualityParameter, InspectionPlan, QualityChecklistTemplate, ReworkEntry, NCR } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const qualityService = {
  // --- Quality Parameters ---
  getParameters: async (): Promise<QualityParameter[]> => {
    await delay(200);
    return mockDb.getQualityParams();
  },

  addParameter: async (data: Omit<QualityParameter, 'id'>): Promise<QualityParameter> => {
    await delay(200);
    const list = mockDb.getQualityParams();
    const newRec = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveQualityParams([...list, newRec]);
    return newRec;
  },

  deleteParameter: async (id: string): Promise<void> => {
    await delay(200);
    mockDb.saveQualityParams(mockDb.getQualityParams().filter(i => i.id !== id));
  },

  // --- Inspection Plans ---
  getInspectionPlans: async (): Promise<InspectionPlan[]> => {
    await delay(300);
    return mockDb.getInspectionPlans();
  },

  saveInspectionPlan: async (plan: Omit<InspectionPlan, 'id'>): Promise<InspectionPlan> => {
    await delay(300);
    const list = mockDb.getInspectionPlans();
    // Check if plan exists for item to update, otherwise create
    const newRec = { ...plan, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveInspectionPlans([...list, newRec]);
    return newRec;
  },

  deleteInspectionPlan: async (id: string): Promise<void> => {
    await delay(200);
    mockDb.saveInspectionPlans(mockDb.getInspectionPlans().filter(i => i.id !== id));
  },

  // --- Checklists ---
  getChecklists: async (): Promise<QualityChecklistTemplate[]> => {
    await delay(200);
    return mockDb.getChecklists();
  },

  addChecklist: async (data: Omit<QualityChecklistTemplate, 'id'>): Promise<QualityChecklistTemplate> => {
    await delay(200);
    const list = mockDb.getChecklists();
    const newRec = { ...data, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveChecklists([...list, newRec]);
    return newRec;
  },

  deleteChecklist: async (id: string): Promise<void> => {
    await delay(200);
    mockDb.saveChecklists(mockDb.getChecklists().filter(i => i.id !== id));
  },

  // --- Rework ---
  getReworkEntries: async (): Promise<ReworkEntry[]> => {
    await delay(300);
    return mockDb.getReworkEntries().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  createReworkEntry: async (data: Omit<ReworkEntry, 'id' | 'status' | 'date'>): Promise<ReworkEntry> => {
    await delay(300);
    const list = mockDb.getReworkEntries();
    const newRec: ReworkEntry = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
    };
    mockDb.saveReworkEntries([newRec, ...list]);
    return newRec;
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
    await delay(300);
    return mockDb.getNCRs().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  createNCR: async (data: Omit<NCR, 'id' | 'ncrNumber' | 'status' | 'date'>): Promise<NCR> => {
    await delay(400);
    const list = mockDb.getNCRs();
    const newRec: NCR = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        ncrNumber: `NCR-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`,
        status: 'Open',
        date: new Date().toISOString().split('T')[0]
    };
    mockDb.saveNCRs([newRec, ...list]);
    return newRec;
  },

  updateNCR: async (id: string, updates: Partial<NCR>): Promise<void> => {
    await delay(300);
    const list = mockDb.getNCRs();
    const index = list.findIndex(n => n.id === id);
    if(index !== -1) {
        list[index] = { ...list[index], ...updates };
        mockDb.saveNCRs(list);
    }
  }
};
