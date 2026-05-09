import api from './api';
import { authService } from './authService';
import { QualityParameter, InspectionPlan, QualityChecklistTemplate, ReworkEntry, NCR } from '@/types';

const getOrganisationId = () => {
  try {
    const user = localStorage.getItem('user');
    const orgId = user ? JSON.parse(user)?.organisationId : undefined;
    if (!orgId) {
      console.warn('Organisation ID not found in localStorage');
    }
    return orgId;
  } catch (e) {
    console.error('Error retrieving organisation ID:', e);
    return undefined;
  }
};

const orgHeaders = () => {
  const organisationId = getOrganisationId();
  if (!organisationId) {
    console.warn('Missing organisationId - requests may fail');
  }
  return organisationId ? { headers: { 'organisationid': organisationId } } : {};
};

const unwrapList = <T,>(response: any): T[] => response?.data?.data ?? response?.data?.vendors ?? response?.data ?? [];

// Transform backend field names to frontend
const toFrontendParameter = (param: any): QualityParameter => ({
  id: param.id || param._id,
  name: param.name,
  uom: param.unit || param.uom || '',
  type: param.dataType || param.type || 'Numeric',
  description: param.description || ''
});

// Transform frontend field names to backend
const toBackendParameter = (param: any) => ({
  name: param.name,
  unit: param.unit || param.uom,
  dataType: param.dataType || param.type,
  description: param.description || ''
});

// Transform backend inspection plan to frontend
const toFrontendInspectionPlan = (plan: any): InspectionPlan => ({
  id: plan.id || plan._id,
  itemId: plan.itemId || plan.partNumber || '',
  itemName: plan.itemName || plan.name || '',
  name: plan.name || '',
  sampleSize: plan.sampleSize || 10,
  parameters: (plan.parameters || []).map((p: any) => ({
    parameterId: p.parameterId || p._id || '',
    parameterName: p.parameterName || p.name || '',
    minValue: p.minValue ?? p.min,
    maxValue: p.maxValue ?? p.max,
    expectedValue: p.expectedValue || p.expected || '',
    unit: p.unit || ''
  }))
});

// Transform backend checklist to frontend
const toFrontendChecklist = (checklist: any): QualityChecklistTemplate => ({
  id: checklist.id || checklist._id,
  name: checklist.title || checklist.name || '',
  description: checklist.description || `Inspector: ${checklist.inspector}, Part: ${checklist.partNumber}`,
  steps: (checklist.items || []).map((item: any) => item.label || item.name || '').filter((s: string) => s),
});

const getCurrentUserLabel = () => {
  const user = authService.getCurrentUser();
  return user?.fullname || user?.name || user?.email || 'Unassigned';
};

const toFrontendRework = (job: any): ReworkEntry => ({
  id: job.id || job._id,
  itemId: job.itemId || job.partCode || '',
  itemName: job.itemName || job.partName || '',
  quantity: Number(job.quantity ?? job.units ?? 0),
  reason: job.reason || job.defectDescription || '',
  status: job.status || 'Pending',
  date: job.date || job.createdAt || new Date().toISOString(),
  completionDate: job.completionDate || undefined,
  outcome: job.outcome || undefined,
});

const toBackendRework = (job: any) => ({
  organisationId: job.organisationId,
  itemId: job.itemId || '',
  itemName: job.itemName || '',
  quantity: Number(job.quantity ?? 0),
  reason: job.reason || '',
  partName: job.itemName || job.partName || 'Unknown Item',
  partCode: job.itemId || job.partCode || job.itemName || 'UNKNOWN',
  defectDescription: job.reason || job.defectDescription || '',
  units: Number(job.quantity ?? job.units ?? 0),
  priority: job.priority || 'Medium',
  status: job.status || 'Pending',
  assignedTo: job.assignedTo || getCurrentUserLabel(),
  outcome: job.outcome,
  completionDate: job.completionDate,
  rootCause: job.rootCause,
  notes: job.notes,
});

const toFrontendNCR = (ncr: any): NCR => ({
  id: ncr.id || ncr._id,
  ncrNumber: ncr.ncrNumber || '',
  refType: ncr.refType || 'GRN',
  refId: ncr.refId || ncr.batchLot || '',
  itemId: ncr.itemId || ncr.partNumber || '',
  itemName: ncr.itemName || ncr.partName || '',
  quantity: Number(ncr.quantity ?? ncr.affectedQty ?? 0),
  description: ncr.description || ncr.title || '',
  rootCause: ncr.rootCause || undefined,
  correctiveAction: ncr.correctiveAction || undefined,
  status: ncr.status || 'Open',
  date: ncr.date || ncr.detectedDate || new Date().toISOString(),
});

const toBackendNCR = (ncr: any) => ({
  organisationId: ncr.organisationId,
  ncrNumber: ncr.ncrNumber,
  title: ncr.description || `${ncr.itemName || 'Item'} NCR`,
  itemId: ncr.itemId || '',
  itemName: ncr.itemName || '',
  refType: ncr.refType || 'GRN',
  refId: ncr.refId || '',
  partName: ncr.itemName || 'Unknown Item',
  partNumber: ncr.itemId || ncr.refId || 'UNKNOWN',
  batchLot: ncr.refId || `LOT-${Date.now()}`,
  quantity: Number(ncr.quantity ?? 0),
  affectedQty: Number(ncr.quantity ?? 0),
  severity: ncr.severity || 'Major',
  category: ncr.category || 'Other',
  status: ncr.status || 'Open',
  disposition: ncr.disposition || 'Pending',
  detectedBy: ncr.detectedBy || getCurrentUserLabel(),
  detectedDate: ncr.detectedDate || new Date().toISOString(),
  description: ncr.description || '',
  rootCause: ncr.rootCause,
  correctiveAction: ncr.correctiveAction,
  department: ncr.department || 'Quality',
  supplier: ncr.supplier,
});

// Transform frontend to backend checklist
const toBackendChecklist = (checklist: any) => ({
  name: checklist.name,
  description: checklist.description,
  steps: checklist.steps,
  partNumber: checklist.partNumber,
  inspector: checklist.inspector,
  date: checklist.date,
  category: checklist.category,
});

export const qualityService = {
  // --- Quality Parameters ---
  getParameters: async (): Promise<QualityParameter[]> => {
    const response = await api.get('/api/quality-parameters', orgHeaders());
    return unwrapList<any>(response).map(toFrontendParameter);
  },

  getPaginatedParameters: async (page = 1, limit = 10, search = ""): Promise<{ data: QualityParameter[], total: number }> => {
    const response = await api.get(`/api/quality-parameters?page=${page}&limit=${limit}&search=${search}`, orgHeaders());
    return {
      data: (response.data.data || []).map(toFrontendParameter),
      total: response.data.pagination?.totalItems || response.data.pagination?.total || 0
    };
  },

  addParameter: async (data: Omit<QualityParameter, 'id'>): Promise<QualityParameter> => {
    const response = await api.post('/api/quality-parameters', toBackendParameter(data), orgHeaders());
    return toFrontendParameter(response.data.data ?? response.data);
  },

  deleteParameter: async (id: string): Promise<void> => {
    await api.delete(`/api/quality-parameters/${id}`, orgHeaders());
  },

  updateParameter: async (id: string, data: Partial<QualityParameter>): Promise<QualityParameter> => {
    const response = await api.put(`/api/quality-parameters/${id}`, toBackendParameter(data), orgHeaders());
    return toFrontendParameter(response.data.data ?? response.data);
  },

  // --- Inspection Plans ---
  getInspectionPlans: async (): Promise<InspectionPlan[]> => {
    const response = await api.get('/api/inspection-plans', orgHeaders());
    return unwrapList<any>(response).map(toFrontendInspectionPlan);
  },

  saveInspectionPlan: async (plan: Omit<InspectionPlan, 'id'>): Promise<InspectionPlan> => {
    try {
      const response = await api.post('/api/inspection-plans', plan, orgHeaders());
      return response.data.data ?? response.data;
    } catch (error) {
      console.error('Failed to save inspection plan:', error);
      throw error;
    }
  },

  deleteInspectionPlan: async (id: string): Promise<void> => {
    await api.delete(`/api/inspection-plans/${id}`, orgHeaders());
  },

  // --- Checklists ---
  getChecklists: async (): Promise<QualityChecklistTemplate[]> => {
    const response = await api.get('/api/checklists', orgHeaders());
    const checklists = unwrapList<any>(response);
    return checklists.map(toFrontendChecklist);
  },

  addChecklist: async (data: Omit<QualityChecklistTemplate, 'id'>): Promise<QualityChecklistTemplate> => {
    try {
      const response = await api.post('/api/checklists', toBackendChecklist(data), orgHeaders());
      const checklist = response.data.data ?? response.data;
      return toFrontendChecklist(checklist);
    } catch (error) {
      console.error('Failed to add checklist:', error);
      throw error;
    }
  },

  deleteChecklist: async (id: string): Promise<void> => {
    await api.delete(`/api/checklists/${id}`, orgHeaders());
  },

  // --- Rework ---
  getReworkEntries: async (): Promise<ReworkEntry[]> => {
    const response = await api.get('/api/rework', orgHeaders());
    return unwrapList<any>(response).map(toFrontendRework);
  },

  createReworkEntry: async (data: Omit<ReworkEntry, 'id' | 'status' | 'date'>): Promise<ReworkEntry> => {
    const response = await api.post('/api/rework', toBackendRework(data), orgHeaders());
    return toFrontendRework(response.data.data ?? response.data);
  },

  updateReworkStatus: async (id: string, status: ReworkEntry['status'], outcome?: ReworkEntry['outcome']): Promise<void> => {
    await api.put(
      `/api/rework/${id}`,
      {
        status,
        outcome,
        completionDate: status === 'Completed' || status === 'Scrapped' ? new Date().toISOString() : undefined,
      },
      orgHeaders()
    );
  },

  // --- NCR ---
  getNCRs: async (): Promise<NCR[]> => {
    const response = await api.get('/api/ncrs', orgHeaders());
    return unwrapList<any>(response).map(toFrontendNCR);
  },

  createNCR: async (data: Omit<NCR, 'id' | 'ncrNumber' | 'status' | 'date'>): Promise<NCR> => {
    const response = await api.post('/api/ncrs', toBackendNCR(data), orgHeaders());
    return toFrontendNCR(response.data.data ?? response.data);
  },

  updateNCR: async (id: string, updates: Partial<NCR>): Promise<void> => {
    await api.put(`/api/ncrs/${id}`, updates, orgHeaders());
  }
};
