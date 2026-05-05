import { mockDb } from './mockDb';
import { InventorySettings, AutoReorderRule, TaxConfig, NumberSeries, CustomField, WorkflowRule } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const settingsService = {
  // --- General Settings ---
  getSettings: async (): Promise<InventorySettings> => {
    await delay(200);
    return mockDb.getInventorySettings();
  },

  updateSettings: async (settings: InventorySettings): Promise<void> => {
    await delay(300);
    mockDb.saveInventorySettings(settings);
  },

  // --- Auto Reorder Rules ---
  getReorderRules: async (): Promise<AutoReorderRule[]> => {
    await delay(200);
    return mockDb.getAutoReorderRules();
  },

  saveReorderRule: async (rule: Omit<AutoReorderRule, 'id'>): Promise<AutoReorderRule> => {
    await delay(300);
    const list = mockDb.getAutoReorderRules();
    const newRule = { ...rule, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveAutoReorderRules([...list, newRule]);
    return newRule;
  },

  deleteReorderRule: async (id: string): Promise<void> => {
    await delay(200);
    mockDb.saveAutoReorderRules(mockDb.getAutoReorderRules().filter(r => r.id !== id));
  },

  // --- Tax Config ---
  getTaxConfigs: async (): Promise<TaxConfig[]> => {
    await delay(200);
    return mockDb.getTaxConfigs();
  },

  saveTaxConfig: async (config: Omit<TaxConfig, 'id'>): Promise<TaxConfig> => {
    await delay(300);
    const list = mockDb.getTaxConfigs();
    const newConfig = { ...config, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveTaxConfigs([...list, newConfig]);
    return newConfig;
  },

  deleteTaxConfig: async (id: string): Promise<void> => {
    await delay(200);
    mockDb.saveTaxConfigs(mockDb.getTaxConfigs().filter(t => t.id !== id));
  },

  // --- Number Series ---
  getNumberSeries: async (): Promise<NumberSeries[]> => {
    await delay(200);
    return mockDb.getNumberSeries();
  },

  updateNumberSeries: async (series: NumberSeries): Promise<void> => {
    await delay(300);
    const list = mockDb.getNumberSeries();
    const index = list.findIndex(s => s.id === series.id);
    if(index !== -1) {
        list[index] = series;
        mockDb.saveNumberSeries(list);
    } else {
        mockDb.saveNumberSeries([...list, series]);
    }
  },

  // --- Custom Fields ---
  getCustomFields: async (): Promise<CustomField[]> => {
    await delay(200);
    return mockDb.getCustomFields();
  },

  saveCustomField: async (field: Omit<CustomField, 'id'>): Promise<CustomField> => {
    await delay(300);
    const list = mockDb.getCustomFields();
    const newField = { ...field, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveCustomFields([...list, newField]);
    return newField;
  },

  deleteCustomField: async (id: string): Promise<void> => {
    await delay(200);
    mockDb.saveCustomFields(mockDb.getCustomFields().filter(f => f.id !== id));
  },

  // --- Workflow Rules ---
  getWorkflowRules: async (): Promise<WorkflowRule[]> => {
    await delay(200);
    return mockDb.getWorkflowRules();
  },

  saveWorkflowRule: async (rule: Omit<WorkflowRule, 'id'>): Promise<WorkflowRule> => {
    await delay(300);
    const list = mockDb.getWorkflowRules();
    const newRule = { ...rule, id: Math.random().toString(36).substr(2, 9) };
    mockDb.saveWorkflowRules([...list, newRule]);
    return newRule;
  },

  deleteWorkflowRule: async (id: string): Promise<void> => {
    await delay(200);
    mockDb.saveWorkflowRules(mockDb.getWorkflowRules().filter(r => r.id !== id));
  }
};
