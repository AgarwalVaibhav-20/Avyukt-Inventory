import { mockDb } from './mockDb';
import { InventorySettings, AutoReorderRule, TaxConfig, NumberSeries, CustomField, WorkflowRule, FormDefinition, FormEditorField } from '@/types';
import { MENU_ITEMS } from '@/constants';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const FORM_EDITOR_STORAGE_KEY = 'nexus_set_forms';
const DEFAULT_PR_IDENTIFIER_TEMPLATE = 'PR-{FY_START}-{FY_END}-{SEQ:5}';
const DEFAULT_PR_DATE_FORMAT: FormDefinition['dateDisplayFormat'] = 'YYYY-MM-DD';

const toSentenceCase = (value: string) =>
  value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const createField = (
  idSuffix: string,
  key: string,
  label: string,
  type: FormEditorField['type'],
  section: string,
  required: boolean,
  placeholder?: string,
  options?: string[],
): FormEditorField => ({
  id: idSuffix,
  key,
  label,
  type,
  section,
  required,
  visible: true,
  placeholder,
  options,
});

const buildDefaultFields = (moduleId: string, formLabel: string, menuId: string): FormEditorField[] => {
  const normalizedLabel = formLabel.toLowerCase();

  const baseFields: FormEditorField[] = [
    createField(`${menuId}-title`, 'referenceNumber', 'Reference Number', 'text', 'Header', true, `Enter ${formLabel} reference`),
    createField(`${menuId}-date`, 'transactionDate', 'Transaction Date', 'date', 'Header', true),
    createField(`${menuId}-status`, 'status', 'Status', 'select', 'Header', true, undefined, ['Draft', 'Pending', 'Approved', 'Completed']),
    createField(`${menuId}-remarks`, 'remarks', 'Remarks', 'textarea', 'Notes', false, `Add notes for ${normalizedLabel}`),
  ];

  if (moduleId === 'product-master') {
    return [
      createField(`${menuId}-name`, 'name', 'Item Name', 'text', 'General', true, 'Enter item name'),
      createField(`${menuId}-sku`, 'sku', 'SKU', 'text', 'General', true, 'Enter SKU'),
      createField(`${menuId}-category`, 'category', 'Category', 'select', 'General', true, undefined, ['Components', 'Machinery', 'Safety Gear']),
      createField(`${menuId}-uom`, 'uom', 'UOM', 'select', 'Commercial', true, undefined, ['pcs', 'kg', 'ltr', 'pair']),
      createField(`${menuId}-price`, 'unitPrice', 'Unit Price', 'number', 'Commercial', false, 'Enter cost price'),
      createField(`${menuId}-active`, 'isActive', 'Active', 'checkbox', 'Controls', false),
    ];
  }

  if (moduleId === 'warehouse') {
    return [
      createField(`${menuId}-warehouse`, 'warehouseName', 'Warehouse Name', 'text', 'General', true, 'Enter warehouse name'),
      createField(`${menuId}-location`, 'location', 'Location', 'text', 'General', true, 'Enter site or city'),
      createField(`${menuId}-capacity`, 'capacity', 'Capacity', 'number', 'Capacity', false, 'Enter storage capacity'),
      createField(`${menuId}-contact`, 'contactPerson', 'Contact Person', 'text', 'Operations', false, 'Warehouse owner'),
      createField(`${menuId}-status`, 'status', 'Status', 'select', 'Operations', true, undefined, ['Active', 'Planning', 'Blocked']),
    ];
  }

  if (moduleId === 'settings') {
    return [
      createField(`${menuId}-name`, 'name', 'Setting Name', 'text', 'Configuration', true, `Name for ${normalizedLabel}`),
      createField(`${menuId}-module`, 'module', 'Applies To', 'select', 'Configuration', true, undefined, ['Inventory', 'Procurement', 'Quality', 'Warehouse']),
      createField(`${menuId}-value`, 'value', 'Default Value', 'text', 'Configuration', false, 'Enter default value'),
      createField(`${menuId}-scope`, 'scope', 'Scope', 'select', 'Control', true, undefined, ['Global', 'Warehouse', 'Role Based']),
      createField(`${menuId}-notes`, 'notes', 'Admin Notes', 'textarea', 'Control', false, 'Explain when to use this setting'),
    ];
  }

  if (normalizedLabel.includes('approval') || moduleId === 'approvals') {
    return [
      createField(`${menuId}-requester`, 'requestedBy', 'Requested By', 'text', 'Header', true, 'Requester name'),
      createField(`${menuId}-amount`, 'amount', 'Amount', 'number', 'Review', false, 'Enter amount'),
      createField(`${menuId}-priority`, 'priority', 'Priority', 'select', 'Review', true, undefined, ['Low', 'Medium', 'High', 'Critical']),
      createField(`${menuId}-decision`, 'approvalDecision', 'Approval Decision', 'select', 'Decision', true, undefined, ['Pending', 'Approved', 'Rejected']),
      createField(`${menuId}-notes`, 'reviewNotes', 'Review Notes', 'textarea', 'Decision', false, 'Add approval remarks'),
    ];
  }

  return [
    ...baseFields,
    createField(`${menuId}-party`, 'counterparty', 'Primary Party', 'text', 'Details', false, 'Vendor, customer, or internal owner'),
    createField(`${menuId}-warehouse`, 'warehouse', 'Warehouse', 'select', 'Details', false, undefined, ['Central Hub', 'West Coast Depot', 'East Side Retail']),
    createField(`${menuId}-priority`, 'priority', 'Priority', 'select', 'Control', false, undefined, ['Low', 'Medium', 'High']),
  ];
};

const buildDefaultForms = (): FormDefinition[] =>
  MENU_ITEMS.flatMap((menu) =>
    (menu.subMenus || []).map((subMenu) => ({
      id: subMenu.id,
      menuId: subMenu.id,
      moduleId: menu.id,
      moduleLabel: menu.label,
      route: `/${menu.id}/${subMenu.id}`,
      formName: subMenu.label,
      description: `Manage the ${subMenu.label.toLowerCase()} form configuration used inside ${menu.label}.`,
      status: 'Active' as const,
      layout: menu.id === 'settings' || menu.id === 'reports' ? 'Single Column' as const : 'Two Column' as const,
      allowAttachments: ['documents', 'quality', 'inward', 'outward'].includes(menu.id),
      allowComments: true,
      approvalRequired: ['approvals', 'inward', 'returns'].includes(menu.id),
      updatedBy: 'System',
      updatedAt: '2026-05-18T09:00:00.000Z',
      identifierTemplate: subMenu.id === 'in-req' ? DEFAULT_PR_IDENTIFIER_TEMPLATE : undefined,
      dateDisplayFormat: subMenu.id === 'in-req' ? DEFAULT_PR_DATE_FORMAT : undefined,
      fields: buildDefaultFields(menu.id, subMenu.label, subMenu.id),
    })),
  );

const getStoredForms = (): FormDefinition[] => {
  const defaults = buildDefaultForms();
  const raw = localStorage.getItem(FORM_EDITOR_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(FORM_EDITOR_STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as FormDefinition[];
    return defaults.map((defaultForm) => {
      const storedForm = parsed.find((form) => form.id === defaultForm.id);
      return storedForm
        ? {
            ...defaultForm,
            ...storedForm,
            fields: storedForm.fields?.length ? storedForm.fields : defaultForm.fields,
          }
        : defaultForm;
    });
  } catch {
    localStorage.setItem(FORM_EDITOR_STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
};

const saveStoredForms = (forms: FormDefinition[]) => {
  localStorage.setItem(FORM_EDITOR_STORAGE_KEY, JSON.stringify(forms));
};

const getFinancialYearParts = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const fyStart = month >= 3 ? year : year - 1;
  const fyEnd = fyStart + 1;

  return {
    fyStart,
    fyEnd,
    fyShortStart: String(fyStart).slice(-2),
    fyShortEnd: String(fyEnd).slice(-2),
  };
};

const renderIdentifierTemplate = (
  template: string,
  sequence: number,
  date = new Date(),
  placeholder = '',
) => {
  const { fyStart, fyEnd, fyShortStart, fyShortEnd } = getFinancialYearParts(date);
  const replacements: Record<string, string> = {
    '{YYYY}': String(date.getFullYear()),
    '{YY}': String(date.getFullYear()).slice(-2),
    '{MM}': String(date.getMonth() + 1).padStart(2, '0'),
    '{DD}': String(date.getDate()).padStart(2, '0'),
    '{FY_START}': String(fyStart),
    '{FY_END}': String(fyEnd),
    '{FY_SHORT_START}': fyShortStart,
    '{FY_SHORT_END}': fyShortEnd,
    '{FY}': `${fyShortStart}-${fyShortEnd}`,
  };

  let output = template || DEFAULT_PR_IDENTIFIER_TEMPLATE;
  Object.entries(replacements).forEach(([token, value]) => {
    output = output.split(token).join(value);
  });

  output = output.replace(/\{SEQ(?::(\d+))?\}/g, (_, width) => {
    if (placeholder) return placeholder;
    const paddedWidth = Number(width || 5);
    return String(sequence).padStart(paddedWidth, '0');
  });

  return output;
};

const getStoredFormById = (id: string) => getStoredForms().find((form) => form.id === id) || null;

const formatDisplayDate = (
  value: string | Date,
  format: FormDefinition['dateDisplayFormat'] = DEFAULT_PR_DATE_FORMAT,
) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '';
  }

  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (format === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  }
  if (format === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  }
  return `${year}-${month}-${day}`;
};

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
  },

  // --- Form Editor ---
  getFormDefinitions: async (): Promise<FormDefinition[]> => {
    await delay(250);
    return getStoredForms();
  },

  updateFormDefinition: async (form: FormDefinition): Promise<FormDefinition> => {
    await delay(300);
    const forms = getStoredForms();
    const index = forms.findIndex((entry) => entry.id === form.id);
    const payload = {
      ...form,
      updatedAt: new Date().toISOString(),
    };

    if (index === -1) {
      forms.push(payload);
    } else {
      forms[index] = payload;
    }

    saveStoredForms(forms);
    return payload;
  },

  resetFormDefinition: async (id: string): Promise<FormDefinition> => {
    await delay(200);
    const defaults = buildDefaultForms();
    const defaultForm = defaults.find((form) => form.id === id);
    if (!defaultForm) {
      throw new Error(`Form ${toSentenceCase(id)} not found`);
    }

    const forms = getStoredForms().map((form) => (form.id === id ? defaultForm : form));
    saveStoredForms(forms);
    return defaultForm;
  },

  getFormDefinitionById: async (id: string): Promise<FormDefinition | null> => {
    await delay(100);
    return getStoredFormById(id);
  },

  getPurchaseRequisitionIdentifierTemplate: (): string => {
    return getStoredFormById('in-req')?.identifierTemplate || DEFAULT_PR_IDENTIFIER_TEMPLATE;
  },

  getPurchaseRequisitionDateFormat: (): FormDefinition['dateDisplayFormat'] => {
    return getStoredFormById('in-req')?.dateDisplayFormat || DEFAULT_PR_DATE_FORMAT;
  },

  formatIdentifierTemplate: (template: string, sequence: number, date = new Date()): string => {
    return renderIdentifierTemplate(template, sequence, date);
  },

  formatDisplayDate,

  getNextPurchaseRequisitionNumber: (existingNumbers: string[], date = new Date()): string => {
    const template = getStoredFormById('in-req')?.identifierTemplate || DEFAULT_PR_IDENTIFIER_TEMPLATE;
    const prefixPattern = renderIdentifierTemplate(template, 1, date, '__SEQ__');
    const [prefixStart, prefixEnd] = prefixPattern.split('__SEQ__');

    const matchingSequences = existingNumbers
      .map((value) => {
        if (!value.startsWith(prefixStart) || !value.endsWith(prefixEnd)) {
          return null;
        }
        const middle = value.slice(prefixStart.length, value.length - prefixEnd.length || undefined);
        return /^\d+$/.test(middle) ? Number(middle) : null;
      })
      .filter((value): value is number => value !== null);

    const nextSequence = (matchingSequences.length ? Math.max(...matchingSequences) : 0) + 1;
    return renderIdentifierTemplate(template, nextSequence, date);
  }
};
