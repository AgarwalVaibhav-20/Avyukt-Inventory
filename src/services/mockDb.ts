/**
 * Mock Database Engine using LocalStorage
 * This simulates a real backend database with seeding capabilities.
 */

import { InventoryItem, Category, Brand, UOM, HSN, Attribute, Warehouse, StockTransfer, Vendor, PurchaseOrder, GRN, PutAwayTask, PurchaseReturn, Customer, SalesOrder, PickList, PackList, DeliveryChallan, DispatchNote, SalesReturn, InternalMovement, StockAdjustment, ScrapEntry, ConsignmentEntry, StockLedgerEntry, Batch, SerialNumber, StockReservation, ScanLog, ClosingStockSnapshot, QualityParameter, InspectionPlan, QualityChecklistTemplate, ReworkEntry, NCR, Invoice, EWayBill, InspectionReport, DocumentAttachment, AuditLog, ReplacementOrder, FinancialNote, VendorItemMap, VendorPerformanceReview, InventorySettings, AutoReorderRule, TaxConfig, NumberSeries, CustomField, WorkflowRule, AuditSession, Zone, Rack, Bin } from '@/types';

const DB_KEYS = {
  ITEMS: 'nexus_items',
  CATEGORIES: 'nexus_categories',
  BRANDS: 'nexus_brands',
  UOMS: 'nexus_uoms',
  HSN: 'nexus_hsn',
  ATTRIBUTES: 'nexus_attributes',
  WAREHOUSES: 'nexus_warehouses',
  TRANSFERS: 'nexus_transfers',
  VENDORS: 'nexus_vendors',
  PRS: 'nexus_prs',
  POS: 'nexus_pos',
  GRNS: 'nexus_grns',
  PURCHASE_INVOICES: 'nexus_purchase_invoices',
  PUTAWAY: 'nexus_putaway',
  RETURNS: 'nexus_returns',
  CUSTOMERS: 'nexus_customers',
  SOS: 'nexus_sos',
  PICKLISTS: 'nexus_picklists',
  PACKLISTS: 'nexus_packlists',
  CHALLANS: 'nexus_challans',
  DISPATCH: 'nexus_dispatch',
  SALES_RETURNS: 'nexus_sales_returns',
  INTERNAL_MOVEMENTS: 'nexus_internal_movements',
  ADJUSTMENTS: 'nexus_adjustments',
  SCRAP: 'nexus_scrap',
  CONSIGNMENT: 'nexus_consignment',
  STOCK_LEDGER: 'nexus_stock_ledger',
  BATCHES: 'nexus_batches',
  SERIALS: 'nexus_serials',
  RESERVATIONS: 'nexus_reservations',
  SCAN_LOGS: 'nexus_scan_logs',
  VALUATION_METHOD: 'nexus_val_method',
  VALUATION_SNAPSHOTS: 'nexus_val_snapshots',
  QUALITY_PARAMS: 'nexus_qm_params',
  INSPECTION_PLANS: 'nexus_qm_plans',
  CHECKLIST_TEMPLATES: 'nexus_qm_checklists',
  REWORK: 'nexus_qm_rework',
  NCRS: 'nexus_qm_ncrs',
  INVOICES: 'nexus_doc_invoices',
  EWAY_BILLS: 'nexus_doc_eway',
  INSPECTION_REPORTS: 'nexus_doc_insp',
  ATTACHMENTS: 'nexus_doc_attachments',
  AUDIT_LOGS: 'nexus_audit_logs',
  REPLACEMENTS: 'nexus_ret_replacements',
  FINANCIAL_NOTES: 'nexus_ret_fin_notes',
  VENDOR_ITEMS: 'nexus_vm_items',
  VENDOR_REVIEWS: 'nexus_vm_reviews',
  SETTINGS_GENERAL: 'nexus_set_general',
  SETTINGS_REORDER: 'nexus_set_reorder',
  SETTINGS_TAX: 'nexus_set_tax',
  SETTINGS_SERIES: 'nexus_set_series',
  SETTINGS_FIELDS: 'nexus_set_fields',
  SETTINGS_WORKFLOW: 'nexus_set_workflow',
  AUDITS: 'nexus_audit_sessions',
  ZONES: 'nexus_wm_zones',
  RACKS: 'nexus_wm_racks',
  BINS: 'nexus_wm_bins'
};

// Seed Data
const SEED_DATA = {
  items: [
    { id: '1', name: 'Industrial Ball Bearing X200', sku: 'BB-X200', category: 'Components', brand: 'SKF', uom: 'pcs', stock: 450, consignmentStock: 20, reorderLevel: 500, unitPrice: 12.50, mrp: 20.00, salePrice: 18.00, hsnCode: '8482', barcode: '890123456001', status: 'Low Stock', lastUpdated: '2023-10-25' },
    { id: '2', name: 'Hydraulic Pump HP-50', sku: 'HP-5000', category: 'Machinery', brand: 'Bosch', uom: 'pcs', stock: 12, consignmentStock: 0, reorderLevel: 10, unitPrice: 1250.00, mrp: 1800.00, salePrice: 1650.00, hsnCode: '8413', barcode: '890123456002', status: 'In Stock', lastUpdated: '2023-10-24' },
    { id: '3', name: 'Safety Gloves - Large', sku: 'SAF-GL-L', category: 'Safety Gear', brand: '3M', uom: 'pair', stock: 2000, consignmentStock: 0, reorderLevel: 200, unitPrice: 3.50, mrp: 6.00, salePrice: 5.00, hsnCode: '4015', barcode: '890123456003', status: 'In Stock', lastUpdated: '2023-10-26' },
  ] as InventoryItem[],
  categories: [
    { id: 'c1', name: 'Components', description: 'Raw operational parts' },
    { id: 'c2', name: 'Machinery', description: 'Heavy equipment' },
    { id: 'c3', name: 'Safety Gear', description: 'PPE' },
    { id: 'c4', name: 'Electronics', description: 'Control panels and chips' }
  ] as Category[],
  brands: [
    { id: 'b1', name: 'SKF', manufacturer: 'SKF India Ltd' },
    { id: 'b2', name: 'Bosch', manufacturer: 'Bosch Ltd' },
    { id: 'b3', name: '3M', manufacturer: '3M Corporation' }
  ] as Brand[],
  uoms: [
    { id: 'u1', name: 'Pieces', code: 'pcs' },
    { id: 'u2', name: 'Kilogram', code: 'kg' },
    { id: 'u3', name: 'Liter', code: 'ltr' },
    { id: 'u4', name: 'Pair', code: 'pair' }
  ] as UOM[],
  hsn: [
    { id: 'h1', code: '8482', description: 'Ball or Roller Bearings', taxRate: 18 },
    { id: 'h2', code: '8413', description: 'Pumps for Liquids', taxRate: 18 },
    { id: 'h3', code: '9801', description: 'Project Imports', taxRate: 12 }
  ] as HSN[],
  attributes: [
    { id: 'a1', name: 'Color', values: ['Red', 'Blue', 'Green'] },
    { id: 'a2', name: 'Size', values: ['S', 'M', 'L', 'XL'] },
    { id: 'a3', name: 'Material', values: ['Steel', 'Plastic', 'Rubber'] }
  ] as Attribute[],
  warehouses: [
    { id: 'w1', name: 'Central Hub - NY', location: 'New York, USA', type: 'Distribution Center', capacity: 50000, contactPerson: 'John Doe' },
    { id: 'w2', name: 'West Coast Depot', location: 'Los Angeles, USA', type: 'General', capacity: 25000, contactPerson: 'Jane Smith' },
    { id: 'w3', name: 'East Side Retail', location: 'Brooklyn, USA', type: 'Retail Store', capacity: 5000, contactPerson: 'Mike Ross' }
  ] as Warehouse[],
  transfers: [
    { 
      id: 't1', 
      sourceWarehouseId: 'w1', 
      destinationWarehouseId: 'w3', 
      items: [{ itemId: '1', itemName: 'Industrial Ball Bearing X200', quantity: 50 }], 
      status: 'Completed', 
      date: '2023-10-20',
      referenceNo: 'TRF-2023-001'
    },
    { 
      id: 't2', 
      sourceWarehouseId: 'w2', 
      destinationWarehouseId: 'w1', 
      items: [{ itemId: '3', itemName: 'Safety Gloves - Large', quantity: 200 }], 
      status: 'Pending', 
      date: '2023-11-05',
      referenceNo: 'TRF-2023-002'
    }
  ] as StockTransfer[],
  vendors: [
    { id: 'v1', name: 'Global Components Inc', code: 'VEN001', contactPerson: 'Alice Wonder', email: 'alice@globalcomp.com', phone: '+1 555-0101', status: 'Active', rating: 4.5, category: 'Components', address: '123 Supply Lane, CA', taxId: 'GST12345' },
    { id: 'v2', name: 'Safety First Supplies', code: 'VEN002', contactPerson: 'Bob Builder', email: 'bob@safetyfirst.com', phone: '+1 555-0202', status: 'Active', rating: 4.0, category: 'Safety Gear', address: '456 Safe St, NY', taxId: 'GST67890' },
    { id: 'v3', name: 'Machinery World', code: 'VEN003', contactPerson: 'Charlie Chap', email: 'charlie@machines.com', phone: '+1 555-0303', status: 'Pending Approval', rating: 0, category: 'Machinery', address: '789 Heavy Rd, TX', taxId: 'GST11223' },
    { id: 'v4', name: 'Bad Supplies Co', code: 'VEN004', contactPerson: 'Davil Downer', email: 'dave@badsupplies.com', phone: '+1 555-0404', status: 'Blacklisted', rating: 1.5, category: 'General', address: '000 Nowhere, NV', taxId: 'GST99887' }
  ] as Vendor[],
  prs: [
    {
      id: 'pr1',
      prNumber: 'PR-2023-001',
      department: 'Production',
      requestedBy: 'John Foreman',
      date: '2023-10-10',
      requiredDate: '2023-10-20',
      justification: 'Stock critical for production run #44',
      status: 'Pending Approval',
      source: 'Manual',
      items: [{ itemId: '1', itemName: 'Industrial Ball Bearing X200', quantity: 200, estimatedPrice: 12.00 }]
    }
  ] as PurchaseRequisition[],
  pos: [
    {
      id: 'po1',
      poNumber: 'PO-2023-001',
      vendorId: 'v1',
      vendorName: 'Global Components Inc',
      date: '2023-10-15',
      expectedDate: '2023-10-25',
      status: 'Sent',
      totalAmount: 5000,
      items: [
        { itemId: '1', itemName: 'Industrial Ball Bearing X200', quantity: 400, unitPrice: 12.50, receivedQty: 0 }
      ]
    },
    {
      id: 'po2',
      poNumber: 'PO-2023-002',
      vendorId: 'v3',
      vendorName: 'Machinery World',
      date: '2023-10-18',
      expectedDate: '2023-10-30',
      status: 'Draft',
      totalAmount: 12500,
      items: [
        { itemId: '2', itemName: 'Hydraulic Pump HP-50', quantity: 10, unitPrice: 1250.00, receivedQty: 0 }
      ]
    }
  ] as PurchaseOrder[],
  grns: [
      {
        id: 'grn1',
        grnNumber: 'GRN-2023-001',
        poId: 'po1',
        poNumber: 'PO-2023-001',
        vendorId: 'v1',
        vendorName: 'Global Components Inc',
        date: '2023-10-25',
        challanNumber: 'CH-123',
        status: 'QC Completed', // Ready for final approval
        items: [{ itemId: '1', itemName: 'Industrial Ball Bearing X200', poQty: 400, receivedQty: 400, acceptedQty: 400, rejectedQty: 0 }]
      }
  ] as GRN[],
  purchaseInvoices: [] as PurchaseInvoice[],
  putaway: [] as PutAwayTask[],
  returns: [] as PurchaseReturn[],
  customers: [
    { id: 'c1', name: 'Tech Solutions Ltd', email: 'contact@techsol.com', phone: '555-1001', address: '123 Tech Park, CA', type: 'Wholesale' },
    { id: 'c2', name: 'BuildRight Construction', email: 'procure@buildright.com', phone: '555-1002', address: '456 Site Rd, TX', type: 'Retail' }
  ] as Customer[],
  sos: [
    {
      id: 'so1',
      soNumber: 'SO-2023-001',
      customerId: 'c1',
      customerName: 'Tech Solutions Ltd',
      date: '2023-11-01',
      status: 'Confirmed',
      totalAmount: 1800,
      items: [
        { itemId: '1', itemName: 'Industrial Ball Bearing X200', quantity: 100, unitPrice: 18.00 }
      ]
    }
  ] as SalesOrder[],
  picklists: [] as PickList[],
  packlists: [] as PackList[],
  challans: [] as DeliveryChallan[],
  dispatch: [] as DispatchNote[],
  salesReturns: [] as SalesReturn[],
  internalMovements: [] as InternalMovement[],
  adjustments: [
    {
        id: 'adj1',
        reference: 'ADJ-2023-001',
        date: '2023-10-25',
        itemId: '1',
        itemName: 'Industrial Ball Bearing X200',
        warehouseId: 'w1',
        type: 'Damage',
        quantity: 5,
        impact: 'Deduct',
        reason: 'Water Damage',
        status: 'Approved'
    },
    {
        id: 'adj2',
        reference: 'ADJ-2023-002',
        date: '2023-11-06',
        itemId: '2',
        itemName: 'Hydraulic Pump HP-50',
        warehouseId: 'w1',
        type: 'Correction',
        quantity: 1,
        impact: 'Add',
        reason: 'Stock Count Mismatch',
        status: 'Pending'
    }
  ] as StockAdjustment[],
  scrap: [] as ScrapEntry[],
  consignment: [
    {
        id: 'con1',
        reference: 'CS-OUT-001',
        date: '2023-11-02',
        partyId: 'c1',
        partyName: 'Tech Solutions Ltd',
        itemId: '1',
        itemName: 'Industrial Ball Bearing X200',
        quantity: 20,
        type: 'Outward',
        status: 'Active'
    }
  ] as ConsignmentEntry[],
  stockLedger: [
    { id: 'le1', date: '2023-10-01', itemId: '1', itemName: 'Industrial Ball Bearing X200', transactionType: 'Initial', reference: 'OP-BAL', quantityChange: 350, runningBalance: 350 },
    { id: 'le2', date: '2023-10-15', itemId: '1', itemName: 'Industrial Ball Bearing X200', transactionType: 'Purchase', reference: 'GRN-2023-001', quantityChange: 100, runningBalance: 450 },
    { id: 'le3', date: '2023-10-20', itemId: '1', itemName: 'Industrial Ball Bearing X200', transactionType: 'Transfer', reference: 'TRF-2023-001', quantityChange: 0, runningBalance: 450 } // Transfer doesn't change global stock in this simplified view, usually tracked per warehouse
  ] as StockLedgerEntry[],
  batches: [
    { id: 'b1', batchNumber: 'B-23-OCT-01', itemId: '1', itemName: 'Industrial Ball Bearing X200', quantity: 350, mfgDate: '2023-09-01', expiryDate: '2025-09-01', costPrice: 12.00, status: 'Active' },
    { id: 'b2', batchNumber: 'B-23-OCT-15', itemId: '1', itemName: 'Industrial Ball Bearing X200', quantity: 100, mfgDate: '2023-10-01', expiryDate: '2025-10-01', costPrice: 12.50, status: 'Active' }
  ] as Batch[],
  serials: [
    { id: 's1', serialNumber: 'SN-1001', itemId: '2', itemName: 'Hydraulic Pump HP-50', status: 'Available', currentLocation: 'Central Hub - NY' },
    { id: 's2', serialNumber: 'SN-1002', itemId: '2', itemName: 'Hydraulic Pump HP-50', status: 'Available', currentLocation: 'Central Hub - NY' },
    { id: 's3', serialNumber: 'SN-1003', itemId: '2', itemName: 'Hydraulic Pump HP-50', status: 'Sold', currentLocation: 'Customer Site' }
  ] as SerialNumber[],
  reservations: [
    { id: 'res1', reference: 'SO-2023-001', itemId: '1', itemName: 'Industrial Ball Bearing X200', quantity: 50, reservedDate: '2023-11-01', expiryDate: '2023-11-08', status: 'Active' }
  ] as StockReservation[],
  scanLogs: [] as ScanLog[],
  valuationSnapshots: [
      { id: 'snap1', date: '2023-09-30', totalValue: 11000, itemCount: 1450, method: 'FIFO' },
      { id: 'snap2', date: '2023-10-31', totalValue: 12500, itemCount: 1600, method: 'FIFO' },
  ] as ClosingStockSnapshot[],
  qualityParams: [
      { id: 'qp1', name: 'Diameter', description: 'External diameter check', uom: 'mm', type: 'Numeric' },
      { id: 'qp2', name: 'Surface Finish', description: 'Visual check for scratches', uom: 'N/A', type: 'Pass/Fail' },
      { id: 'qp3', name: 'Hardness', description: 'Rockwell hardness test', uom: 'HRC', type: 'Numeric' },
  ] as QualityParameter[],
  inspectionPlans: [
      { id: 'ip1', itemId: '1', itemName: 'Industrial Ball Bearing X200', name: 'Standard Bearing QC', sampleSize: 10, parameters: [
          { parameterId: 'qp1', parameterName: 'Diameter', minValue: 49.95, maxValue: 50.05 },
          { parameterId: 'qp2', parameterName: 'Surface Finish', expectedValue: 'Pass' }
      ]}
  ] as InspectionPlan[],
  checklists: [
      { id: 'cl1', name: 'General Inward Visual', description: 'Basic box condition check', steps: ['Check for water damage', 'Verify label clarity', 'Count boxes'] }
  ] as QualityChecklistTemplate[],
  rework: [
      { id: 'rw1', itemId: '1', itemName: 'Industrial Ball Bearing X200', quantity: 5, reason: 'Minor Rust', status: 'Pending', date: '2023-10-25' }
  ] as ReworkEntry[],
  ncrs: [] as NCR[],
  invoices: [
      { id: 'inv1', invoiceNumber: 'INV-2023-001', soId: 'so1', soNumber: 'SO-2023-001', customerName: 'Tech Solutions Ltd', date: '2023-11-05', dueDate: '2023-12-05', totalAmount: 1800, taxAmount: 324, status: 'Sent', items: [{ itemId: '1', itemName: 'Industrial Ball Bearing X200', quantity: 100, unitPrice: 18.00 }] }
  ] as Invoice[],
  ewayBills: [] as EWayBill[],
  inspectionReports: [
      { id: 'ir1', reportNumber: 'IR-23-1001', referenceType: 'GRN', referenceId: 'GRN-2023-001', date: '2023-10-26', inspector: 'John QC', result: 'Pass', remarks: 'All clear' }
  ] as InspectionReport[],
  attachments: [
      { id: 'att1', fileName: 'Safety_Manual_v1.pdf', fileType: 'pdf', size: '2.4 MB', uploadDate: '2023-10-01', uploadedBy: 'Admin', referenceType: 'Item', referenceId: '3', version: 1 }
  ] as DocumentAttachment[],
  auditLogs: [
      { id: 'al1', date: '2023-11-05', timestamp: '10:00:00', user: 'Admin User', action: 'Login', module: 'Auth', description: 'User logged in' },
      { id: 'al2', date: '2023-11-05', timestamp: '10:15:20', user: 'Admin User', action: 'Create', module: 'Sales', description: 'Created Sales Order SO-2023-001' },
      { id: 'al3', date: '2023-11-06', timestamp: '09:30:00', user: 'Warehouse Mgr', action: 'Update', module: 'Inventory', description: 'Updated Stock for BB-X200' }
  ] as AuditLog[],
  replacements: [] as ReplacementOrder[],
  financialNotes: [] as FinancialNote[],
  vendorItems: [
      { id: 'vi1', vendorId: 'v1', vendorName: 'Global Components Inc', itemId: '1', itemName: 'Industrial Ball Bearing X200', sku: 'BB-X200', price: 12.00, currency: 'USD', leadTimeDays: 7, lastUpdated: '2023-10-01' },
      { id: 'vi2', vendorId: 'v2', vendorName: 'Safety First Supplies', itemId: '3', itemName: 'Safety Gloves - Large', sku: 'SAF-GL-L', price: 3.20, currency: 'USD', leadTimeDays: 3, lastUpdated: '2023-10-05' }
  ] as VendorItemMap[],
  vendorReviews: [
      { id: 'vr1', vendorId: 'v1', vendorName: 'Global Components Inc', date: '2023-10-01', period: 'Q3 2023', score: 92, metrics: { onTimeDelivery: 95, qualityAcceptance: 98, pricingCompetitiveness: 4, responsiveScore: 5 }, notes: 'Excellent service this quarter.' }
  ] as VendorPerformanceReview[],
  inventorySettings: {
      id: 'default',
      companyName: 'ACT Business Solution',
      defaultWarehouseId: 'w1',
      allowNegativeStock: false,
      enableBatchTracking: true,
      enableSerialTracking: true,
      currency: 'USD',
      dateFormat: 'YYYY-MM-DD'
  } as InventorySettings,
  autoReorderRules: [
      { id: 'arr1', name: 'General Safety Stock', itemId: '1', itemName: 'Industrial Ball Bearing X200', minStock: 50, reorderQuantity: 200, active: true }
  ] as AutoReorderRule[],
  taxConfigs: [
      { id: 'tx1', taxName: 'GST 18%', rate: 18, type: 'Percentage', isDefault: true, country: 'India' },
      { id: 'tx2', taxName: 'VAT 5%', rate: 5, type: 'Percentage', isDefault: false, country: 'UAE' }
  ] as TaxConfig[],
  numberSeries: [
      { id: 'ns1', documentType: 'PO', prefix: 'PO-', startNumber: 1, currentNumber: 2, suffix: '' },
      { id: 'ns2', documentType: 'INV', prefix: 'INV-', startNumber: 1000, currentNumber: 1001, suffix: '/23-24' }
  ] as NumberSeries[],
  customFields: [
      { id: 'cf1', module: 'Item', fieldName: 'Material Certification', fieldType: 'Text', required: false }
  ] as CustomField[],
  workflowRules: [
      { id: 'wf1', name: 'High Value PO Approval', module: 'Purchase', triggerEvent: 'Create', condition: 'Amount > 10000', action: 'Notification', active: true }
  ] as WorkflowRule[],
  auditSessions: [
      { id: 'aud1', reference: 'AUD-2023-001', type: 'Full', status: 'Completed', startDate: '2023-10-01', completionDate: '2023-10-02', warehouseId: 'w1', warehouseName: 'Central Hub - NY', auditor: 'John Doe', progress: 100, items: [] }
  ] as AuditSession[],
  
  // Warehouse Hierarchy
  zones: [
      { id: 'z1', warehouseId: 'w1', name: 'Zone A - Receiving', code: 'ZA', type: 'General' },
      { id: 'z2', warehouseId: 'w1', name: 'Zone B - Cold Storage', code: 'ZB', type: 'Cold' }
  ] as Zone[],
  racks: [
      { id: 'r1', zoneId: 'z1', name: 'Rack 01', code: 'R01', levels: 4 },
      { id: 'r2', zoneId: 'z1', name: 'Rack 02', code: 'R02', levels: 4 },
      { id: 'r3', zoneId: 'z2', name: 'Rack C1', code: 'RC1', levels: 3 }
  ] as Rack[],
  bins: [
      { id: 'b1', rackId: 'r1', shelfLevel: 1, binCode: 'W1-ZA-R01-L1-B01', name: 'Bin 01', maxCapacity: 100, currentOccupancy: 45, status: 'Partial' },
      { id: 'b2', rackId: 'r1', shelfLevel: 1, binCode: 'W1-ZA-R01-L1-B02', name: 'Bin 02', maxCapacity: 100, currentOccupancy: 0, status: 'Empty' },
      { id: 'b3', rackId: 'r3', shelfLevel: 1, binCode: 'W1-ZB-RC1-L1-B01', name: 'Cold Bin 01', maxCapacity: 50, currentOccupancy: 50, status: 'Full' }
  ] as Bin[]
};

// Helper to get data or seed
const getOrSeed = <T>(key: string, seed: T | T[]): T | T[] => {
  const data = localStorage.getItem(key);
  if (data) {
    return JSON.parse(data);
  }
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
};

// Helper to save
const save = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const mockDb = {
  // Items
  getItems: () => getOrSeed<InventoryItem[]>(DB_KEYS.ITEMS, SEED_DATA.items) as InventoryItem[],
  saveItems: (items: InventoryItem[]) => save(DB_KEYS.ITEMS, items),

  // Categories
  getCategories: () => getOrSeed<Category[]>(DB_KEYS.CATEGORIES, SEED_DATA.categories) as Category[],
  saveCategories: (data: Category[]) => save(DB_KEYS.CATEGORIES, data),

  // Brands
  getBrands: () => getOrSeed<Brand[]>(DB_KEYS.BRANDS, SEED_DATA.brands) as Brand[],
  saveBrands: (data: Brand[]) => save(DB_KEYS.BRANDS, data),

  // UOMs
  getUOMs: () => getOrSeed<UOM[]>(DB_KEYS.UOMS, SEED_DATA.uoms) as UOM[],
  saveUOMs: (data: UOM[]) => save(DB_KEYS.UOMS, data),

  // HSN
  getHSN: () => getOrSeed<HSN[]>(DB_KEYS.HSN, SEED_DATA.hsn) as HSN[],
  saveHSN: (data: HSN[]) => save(DB_KEYS.HSN, data),

  // Attributes
  getAttributes: () => getOrSeed<Attribute[]>(DB_KEYS.ATTRIBUTES, SEED_DATA.attributes) as Attribute[],
  saveAttributes: (data: Attribute[]) => save(DB_KEYS.ATTRIBUTES, data),

  // Warehouses
  getWarehouses: () => getOrSeed<Warehouse[]>(DB_KEYS.WAREHOUSES, SEED_DATA.warehouses) as Warehouse[],
  saveWarehouses: (data: Warehouse[]) => save(DB_KEYS.WAREHOUSES, data),

  // Transfers
  getTransfers: () => getOrSeed<StockTransfer[]>(DB_KEYS.TRANSFERS, SEED_DATA.transfers) as StockTransfer[],
  saveTransfers: (data: StockTransfer[]) => save(DB_KEYS.TRANSFERS, data),

  // Procurement
  getVendors: () => getOrSeed<Vendor[]>(DB_KEYS.VENDORS, SEED_DATA.vendors) as Vendor[],
  saveVendors: (data: Vendor[]) => save(DB_KEYS.VENDORS, data),

  getPRs: () => getOrSeed<PurchaseRequisition[]>(DB_KEYS.PRS, SEED_DATA.prs) as PurchaseRequisition[],
  savePRs: (data: PurchaseRequisition[]) => save(DB_KEYS.PRS, data),

  getPOs: () => getOrSeed<PurchaseOrder[]>(DB_KEYS.POS, SEED_DATA.pos) as PurchaseOrder[],
  savePOs: (data: PurchaseOrder[]) => save(DB_KEYS.POS, data),

  getGRNs: () => getOrSeed<GRN[]>(DB_KEYS.GRNS, SEED_DATA.grns) as GRN[],
  saveGRNs: (data: GRN[]) => save(DB_KEYS.GRNS, data),

  getPurchaseInvoices: () => getOrSeed<PurchaseInvoice[]>(DB_KEYS.PURCHASE_INVOICES, SEED_DATA.purchaseInvoices) as PurchaseInvoice[],
  savePurchaseInvoices: (data: PurchaseInvoice[]) => save(DB_KEYS.PURCHASE_INVOICES, data),

  getPutAwayTasks: () => getOrSeed<PutAwayTask[]>(DB_KEYS.PUTAWAY, SEED_DATA.putaway) as PutAwayTask[],
  savePutAwayTasks: (data: PutAwayTask[]) => save(DB_KEYS.PUTAWAY, data),

  getPurchaseReturns: () => getOrSeed<PurchaseReturn[]>(DB_KEYS.RETURNS, SEED_DATA.returns) as PurchaseReturn[],
  savePurchaseReturns: (data: PurchaseReturn[]) => save(DB_KEYS.RETURNS, data),

  // Sales & Outward
  getCustomers: () => getOrSeed<Customer[]>(DB_KEYS.CUSTOMERS, SEED_DATA.customers) as Customer[],
  saveCustomers: (data: Customer[]) => save(DB_KEYS.CUSTOMERS, data),

  getSOs: () => getOrSeed<SalesOrder[]>(DB_KEYS.SOS, SEED_DATA.sos) as SalesOrder[],
  saveSOs: (data: SalesOrder[]) => save(DB_KEYS.SOS, data),

  getPickLists: () => getOrSeed<PickList[]>(DB_KEYS.PICKLISTS, SEED_DATA.picklists) as PickList[],
  savePickLists: (data: PickList[]) => save(DB_KEYS.PICKLISTS, data),

  getPackLists: () => getOrSeed<PackList[]>(DB_KEYS.PACKLISTS, SEED_DATA.packlists) as PackList[],
  savePackLists: (data: PackList[]) => save(DB_KEYS.PACKLISTS, data),

  getChallans: () => getOrSeed<DeliveryChallan[]>(DB_KEYS.CHALLANS, SEED_DATA.challans) as DeliveryChallan[],
  saveChallans: (data: DeliveryChallan[]) => save(DB_KEYS.CHALLANS, data),

  getDispatchNotes: () => getOrSeed<DispatchNote[]>(DB_KEYS.DISPATCH, SEED_DATA.dispatch) as DispatchNote[],
  saveDispatchNotes: (data: DispatchNote[]) => save(DB_KEYS.DISPATCH, data),

  getSalesReturns: () => getOrSeed<SalesReturn[]>(DB_KEYS.SALES_RETURNS, SEED_DATA.salesReturns) as SalesReturn[],
  saveSalesReturns: (data: SalesReturn[]) => save(DB_KEYS.SALES_RETURNS, data),

  // Movements
  getInternalMovements: () => getOrSeed<InternalMovement[]>(DB_KEYS.INTERNAL_MOVEMENTS, SEED_DATA.internalMovements) as InternalMovement[],
  saveInternalMovements: (data: InternalMovement[]) => save(DB_KEYS.INTERNAL_MOVEMENTS, data),

  getAdjustments: () => getOrSeed<StockAdjustment[]>(DB_KEYS.ADJUSTMENTS, SEED_DATA.adjustments) as StockAdjustment[],
  saveAdjustments: (data: StockAdjustment[]) => save(DB_KEYS.ADJUSTMENTS, data),

  getScrap: () => getOrSeed<ScrapEntry[]>(DB_KEYS.SCRAP, SEED_DATA.scrap) as ScrapEntry[],
  saveScrap: (data: ScrapEntry[]) => save(DB_KEYS.SCRAP, data),

  getConsignment: () => getOrSeed<ConsignmentEntry[]>(DB_KEYS.CONSIGNMENT, SEED_DATA.consignment) as ConsignmentEntry[],
  saveConsignment: (data: ConsignmentEntry[]) => save(DB_KEYS.CONSIGNMENT, data),

  // Stock Control
  getStockLedger: () => getOrSeed<StockLedgerEntry[]>(DB_KEYS.STOCK_LEDGER, SEED_DATA.stockLedger) as StockLedgerEntry[],
  saveStockLedger: (data: StockLedgerEntry[]) => save(DB_KEYS.STOCK_LEDGER, data),

  getBatches: () => getOrSeed<Batch[]>(DB_KEYS.BATCHES, SEED_DATA.batches) as Batch[],
  saveBatches: (data: Batch[]) => save(DB_KEYS.BATCHES, data),

  getSerials: () => getOrSeed<SerialNumber[]>(DB_KEYS.SERIALS, SEED_DATA.serials) as SerialNumber[],
  saveSerials: (data: SerialNumber[]) => save(DB_KEYS.SERIALS, data),

  getReservations: () => getOrSeed<StockReservation[]>(DB_KEYS.RESERVATIONS, SEED_DATA.reservations) as StockReservation[],
  saveReservations: (data: StockReservation[]) => save(DB_KEYS.RESERVATIONS, data),

  // Logs
  getScanLogs: () => getOrSeed<ScanLog[]>(DB_KEYS.SCAN_LOGS, SEED_DATA.scanLogs) as ScanLog[],
  saveScanLogs: (data: ScanLog[]) => save(DB_KEYS.SCAN_LOGS, data),

  // Valuation
  getValuationMethod: () => localStorage.getItem(DB_KEYS.VALUATION_METHOD) as 'FIFO' | 'LIFO' | 'Avg' || 'FIFO',
  saveValuationMethod: (method: string) => localStorage.setItem(DB_KEYS.VALUATION_METHOD, method),

  getValuationSnapshots: () => getOrSeed<ClosingStockSnapshot[]>(DB_KEYS.VALUATION_SNAPSHOTS, SEED_DATA.valuationSnapshots) as ClosingStockSnapshot[],
  saveValuationSnapshots: (data: ClosingStockSnapshot[]) => save(DB_KEYS.VALUATION_SNAPSHOTS, data),

  // Quality Management
  getQualityParams: () => getOrSeed<QualityParameter[]>(DB_KEYS.QUALITY_PARAMS, SEED_DATA.qualityParams) as QualityParameter[],
  saveQualityParams: (data: QualityParameter[]) => save(DB_KEYS.QUALITY_PARAMS, data),

  getInspectionPlans: () => getOrSeed<InspectionPlan[]>(DB_KEYS.INSPECTION_PLANS, SEED_DATA.inspectionPlans) as InspectionPlan[],
  saveInspectionPlans: (data: InspectionPlan[]) => save(DB_KEYS.INSPECTION_PLANS, data),

  getChecklists: () => getOrSeed<QualityChecklistTemplate[]>(DB_KEYS.CHECKLIST_TEMPLATES, SEED_DATA.checklists) as QualityChecklistTemplate[],
  saveChecklists: (data: QualityChecklistTemplate[]) => save(DB_KEYS.CHECKLIST_TEMPLATES, data),

  getReworkEntries: () => getOrSeed<ReworkEntry[]>(DB_KEYS.REWORK, SEED_DATA.rework) as ReworkEntry[],
  saveReworkEntries: (data: ReworkEntry[]) => save(DB_KEYS.REWORK, data),

  getNCRs: () => getOrSeed<NCR[]>(DB_KEYS.NCRS, SEED_DATA.ncrs) as NCR[],
  saveNCRs: (data: NCR[]) => save(DB_KEYS.NCRS, data),

  // Document Management
  getInvoices: () => getOrSeed<Invoice[]>(DB_KEYS.INVOICES, SEED_DATA.invoices) as Invoice[],
  saveInvoices: (data: Invoice[]) => save(DB_KEYS.INVOICES, data),

  getEWayBills: () => getOrSeed<EWayBill[]>(DB_KEYS.EWAY_BILLS, SEED_DATA.ewayBills) as EWayBill[],
  saveEWayBills: (data: EWayBill[]) => save(DB_KEYS.EWAY_BILLS, data),

  getInspectionReports: () => getOrSeed<InspectionReport[]>(DB_KEYS.INSPECTION_REPORTS, SEED_DATA.inspectionReports) as InspectionReport[],
  saveInspectionReports: (data: InspectionReport[]) => save(DB_KEYS.INSPECTION_REPORTS, data),

  getAttachments: () => getOrSeed<DocumentAttachment[]>(DB_KEYS.ATTACHMENTS, SEED_DATA.attachments) as DocumentAttachment[],
  saveAttachments: (data: DocumentAttachment[]) => save(DB_KEYS.ATTACHMENTS, data),

  // Audit
  getAuditLogs: () => getOrSeed<AuditLog[]>(DB_KEYS.AUDIT_LOGS, SEED_DATA.auditLogs) as AuditLog[],
  saveAuditLogs: (data: AuditLog[]) => save(DB_KEYS.AUDIT_LOGS, data),

  // Returns Management
  getReplacements: () => getOrSeed<ReplacementOrder[]>(DB_KEYS.REPLACEMENTS, SEED_DATA.replacements) as ReplacementOrder[],
  saveReplacements: (data: ReplacementOrder[]) => save(DB_KEYS.REPLACEMENTS, data),

  getFinancialNotes: () => getOrSeed<FinancialNote[]>(DB_KEYS.FINANCIAL_NOTES, SEED_DATA.financialNotes) as FinancialNote[],
  saveFinancialNotes: (data: FinancialNote[]) => save(DB_KEYS.FINANCIAL_NOTES, data),

  // Vendor Management
  getVendorItemMaps: () => getOrSeed<VendorItemMap[]>(DB_KEYS.VENDOR_ITEMS, SEED_DATA.vendorItems) as VendorItemMap[],
  saveVendorItemMaps: (data: VendorItemMap[]) => save(DB_KEYS.VENDOR_ITEMS, data),

  getVendorReviews: () => getOrSeed<VendorPerformanceReview[]>(DB_KEYS.VENDOR_REVIEWS, SEED_DATA.vendorReviews) as VendorPerformanceReview[],
  saveVendorReviews: (data: VendorPerformanceReview[]) => save(DB_KEYS.VENDOR_REVIEWS, data),

  // Settings & Configuration
  getInventorySettings: () => getOrSeed<InventorySettings>(DB_KEYS.SETTINGS_GENERAL, SEED_DATA.inventorySettings) as InventorySettings,
  saveInventorySettings: (data: InventorySettings) => save(DB_KEYS.SETTINGS_GENERAL, data),

  getAutoReorderRules: () => getOrSeed<AutoReorderRule[]>(DB_KEYS.SETTINGS_REORDER, SEED_DATA.autoReorderRules) as AutoReorderRule[],
  saveAutoReorderRules: (data: AutoReorderRule[]) => save(DB_KEYS.SETTINGS_REORDER, data),

  getTaxConfigs: () => getOrSeed<TaxConfig[]>(DB_KEYS.SETTINGS_TAX, SEED_DATA.taxConfigs) as TaxConfig[],
  saveTaxConfigs: (data: TaxConfig[]) => save(DB_KEYS.SETTINGS_TAX, data),

  getNumberSeries: () => getOrSeed<NumberSeries[]>(DB_KEYS.SETTINGS_SERIES, SEED_DATA.numberSeries) as NumberSeries[],
  saveNumberSeries: (data: NumberSeries[]) => save(DB_KEYS.SETTINGS_SERIES, data),

  getCustomFields: () => getOrSeed<CustomField[]>(DB_KEYS.SETTINGS_FIELDS, SEED_DATA.customFields) as CustomField[],
  saveCustomFields: (data: CustomField[]) => save(DB_KEYS.SETTINGS_FIELDS, data),

  getWorkflowRules: () => getOrSeed<WorkflowRule[]>(DB_KEYS.SETTINGS_WORKFLOW, SEED_DATA.workflowRules) as WorkflowRule[],
  saveWorkflowRules: (data: WorkflowRule[]) => save(DB_KEYS.SETTINGS_WORKFLOW, data),

  // Audit Sessions
  getAuditSessions: () => getOrSeed<AuditSession[]>(DB_KEYS.AUDITS, SEED_DATA.auditSessions) as AuditSession[],
  saveAuditSessions: (data: AuditSession[]) => save(DB_KEYS.AUDITS, data),

  // Hierarchy
  getZones: () => getOrSeed<Zone[]>(DB_KEYS.ZONES, SEED_DATA.zones) as Zone[],
  saveZones: (data: Zone[]) => save(DB_KEYS.ZONES, data),

  getRacks: () => getOrSeed<Rack[]>(DB_KEYS.RACKS, SEED_DATA.racks) as Rack[],
  saveRacks: (data: Rack[]) => save(DB_KEYS.RACKS, data),

  getBins: () => getOrSeed<Bin[]>(DB_KEYS.BINS, SEED_DATA.bins) as Bin[],
  saveBins: (data: Bin[]) => save(DB_KEYS.BINS, data),
};
