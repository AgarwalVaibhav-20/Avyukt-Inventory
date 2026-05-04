import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  subMenus?: SubMenuItem[];
}

export interface SubMenuItem {
  id: string;
  label: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string; // Stored as ID or Name
  categoryId?: string;
  brand: string;
  brandId?: string;
  description?: string;
  itemType: 'Raw Material' | 'Finished Goods' | 'Semi-Finished' | 'Consumable' | 'Trading';
  uom: string;
  uomId?: string;
  alternateUom?: string;
  conversionFactor?: number;
  stock: number;
  consignmentStock: number; // Stock held by customers
  reorderLevel: number;
  reorderQuantity?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  unitPrice: number; // Cost Price
  mrp: number;
  salePrice: number;
  hsnCode: string;
  hsnId?: string;
  taxRate?: number;
  barcode: string;
  shelfLife?: number; // in days
  leadTime?: number; // in days
  images?: string[]; // URLs to product images
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  isActive: boolean;
  lastUpdated: string;
  attributes?: Record<string, string>;
  variantGroupId?: string; // For grouped variants
}

export interface DashboardStats {
  totalValue: number;
  lowStockItems: number;
  pendingApprovals: number;
  activeWarehouses: number;
}

// --- Product Master Types ---

export interface Category {
  id: string;
  name: string;
  description: string;
  parentCategoryId?: string; // For hierarchical categories
  code?: string;
  defaultAttributes?: string[]; // Attribute IDs
  defaultTaxCode?: string;
  valuationMethod?: 'FIFO' | 'LIFO' | 'Weighted Average' | 'Standard Cost';
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
  manufacturer: string;
  description?: string;
  website?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
}

export interface UOM {
  id: string;
  name: string; // e.g., Kilogram
  code: string; // e.g., kg
  symbol?: string; // e.g., kg
  conversionTable?: UOMConversion[]; // Conversions to other UOMs
  isActive: boolean;
}

export interface UOMConversion {
  fromUomId: string;
  toUomId: string;
  conversionFactor: number; // e.g., 1 Carton = 12 Boxes
  fromUomName?: string;
  toUomName?: string;
}

export interface HSN {
  id: string;
  code: string; // e.g., 8517.62
  description: string;
  taxRate: number; // GST %
  applicableForGoods: boolean;
  applicableForServices: boolean;
  isActive: boolean;
  section?: string; // e.g., "Chapter 85"
}

export interface Attribute {
  id: string;
  name: string; // e.g., Color, Size
  description?: string;
  values: string[]; // Comma separated options
  dataType: 'Text' | 'Number' | 'Date' | 'Dropdown' | 'Checkbox';
  isRequired: boolean;
  isActive: boolean;
}

export interface Variant {
  id: string;
  itemId: string;
  parentItemId?: string; // Parent item if this is a variant
  name: string; // e.g., Red / Large
  sku: string; // Unique SKU for variant
  skuModifier?: string; // e.g., -RED-L
  barcode?: string;
  attributeValues: Record<string, string>; // e.g., { Color: "Red", Size: "Large" }
  pricing?: {
    costPrice?: number;
    sellingPrice?: number;
    mrp?: number;
  };
  stock?: number;
  images?: string[];
  isActive: boolean;
}

export interface BarcodeMapping {
  id: string;
  itemId: string;
  barcodeValue: string;
  barcodeType: 'EAN-13' | 'Code128' | 'QR' | 'GS1';
  variantId?: string; // If barcode is for a specific variant
  isManufacturerBarcode: boolean;
  isPrimary: boolean;
  isActive: boolean;
  createdDate: string;
}

export interface ItemPricing {
  id: string;
  itemId: string;
  priceListName: string; // e.g., "Standard", "Retail", "Wholesale"
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  currency: string; // e.g., "USD", "INR"
  effectiveFromDate: string;
  effectiveToDate?: string;
  customerSpecific?: string; // Customer ID if customer-specific price
  quantityBreakTiers?: QuantityPriceTier[];
  notes?: string;
  isActive: boolean;
}

export interface QuantityPriceTier {
  fromQuantity: number;
  toQuantity?: number;
  price: number;
  discount?: number; // %
}

export interface ReorderLevel {
  id: string;
  itemId: string;
  warehouseId?: string; // If warehouse-specific
  minimumStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number; // EOQ
  maximumStockLevel: number;
  leadTimeInDays?: number;
  safetyStock?: number;
  lastUpdated: string;
}


// --- Warehouse Management Types ---

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  type: 'Distribution Center' | 'Retail Store' | 'Cold Storage' | 'General';
  capacity: number; // e.g. in sq ft or units
  contactPerson: string;
}

export interface Zone {
  id: string;
  warehouseId: string;
  name: string; // e.g., "Zone A - Cold Storage"
  code: string; // e.g., "ZA"
  type: 'General' | 'Cold' | 'Hazardous' | 'High Value';
}

export interface Rack {
  id: string;
  zoneId: string;
  name: string; // e.g., "Rack 01"
  code: string; // e.g., "R01"
  levels: number; // Number of shelves/levels
}

export interface Bin {
  id: string;
  rackId: string; // Parent Rack
  shelfLevel: number; // Which shelf level (1, 2, 3...)
  binCode: string; // e.g., "W1-ZA-R01-L1-B01" (Full Location Code)
  name: string; // e.g. "Bin 01"
  maxCapacity: number; // Max units or volume
  currentOccupancy: number; // Current units stored
  status: 'Empty' | 'Partial' | 'Full' | 'Blocked';
}

export interface WarehouseCapacityStats {
  warehouseId: string;
  warehouseName: string;
  totalBins: number;
  occupiedBins: number;
  utilizationRate: number; // %
  zoneStats: {
    zoneName: string;
    capacity: number;
    used: number;
  }[];
}

export interface StockTransfer {
  id: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
  }[];
  status: 'Pending' | 'In Transit' | 'Completed' | 'Rejected';
  date: string;
  referenceNo: string;
}

// --- Procurement & Vendor Types ---

export interface Vendor {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  taxId?: string; // GSTIN / VAT
  paymentTerms?: string;
  status: 'Active' | 'Inactive' | 'Blacklisted' | 'Pending Approval';
  rating: number; // 0-5
  category?: string;
}

export interface VendorItemMap {
  id: string;
  vendorId: string;
  vendorName: string;
  itemId: string;
  itemName: string;
  sku: string;
  vendorSku?: string;
  price: number;
  currency: string;
  leadTimeDays: number;
  lastUpdated: string;
}

export interface VendorPerformanceReview {
  id: string;
  vendorId: string;
  vendorName: string;
  date: string;
  period: string; // "Q3 2023"
  score: number; // 0-100
  metrics: {
    onTimeDelivery: number; // %
    qualityAcceptance: number; // %
    pricingCompetitiveness: number; // 1-5
    responsiveScore: number; // 1-5
  };
  notes: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  expectedDate: string;
  status: 'Draft' | 'Pending Approval' | 'Sent' | 'Partially Received' | 'Completed' | 'Cancelled' | 'Rejected';
  totalAmount: number;
  items: POItem[];
}

export interface POItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  receivedQty: number;
}

export interface GRN {
  id: string;
  grnNumber: string;
  poId: string; // Reference to Purchase Order
  poNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  challanNumber: string;
  status: 'Pending QC' | 'QC Completed' | 'Approved' | 'Put Away Completed' | 'Rejected';
  items: GRNItem[];
}

export interface GRNItem {
  itemId: string;
  itemName: string;
  poQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  qcRemarks?: string;
}

export interface PutAwayTask {
  id: string;
  grnId: string;
  grnNumber: string;
  itemId: string;
  itemName: string;
  quantity: number;
  status: 'Pending' | 'Completed';
  assignedLocation?: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  grnId: string; // Linked to original GRN
  vendorId: string;
  vendorName: string;
  date: string;
  items: ReturnItem[];
  status: 'Draft' | 'Pending Approval' | 'Sent' | 'Rejected';
}

export interface ReturnItem {
  itemId: string;
  itemName: string;
  quantity: number;
  reason: string;
}

// --- Sales & Outward Types ---

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'Retail' | 'Wholesale' | 'Distributor';
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  status: 'Draft' | 'Confirmed' | 'Picking' | 'Packed' | 'Challan Generated' | 'Dispatched' | 'Delivered' | 'Cancelled';
  totalAmount: number;
  items: SOItem[];
}

export interface SOItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  pickedQty?: number;
}

// Workflow Types
export interface PickList {
  id: string;
  pickNumber: string;
  soId: string;
  soNumber: string;
  date: string;
  status: 'Pending' | 'Picked';
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    location: string;
  }[];
}

export interface PackList {
  id: string;
  packNumber: string;
  soId: string;
  soNumber: string;
  date: string;
  status: 'Packed';
  boxCount: number;
}

export interface DeliveryChallan {
  id: string;
  challanNumber: string;
  soId: string;
  soNumber: string;
  customerName: string;
  date: string;
  status: 'Generated' | 'Dispatched';
}

export interface DispatchNote {
  id: string;
  dispatchNumber: string;
  challanId: string;
  challanNumber: string;
  transporter: string;
  vehicleNo: string;
  trackingId: string;
  date: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  soId: string;
  soNumber: string;
  customerName: string;
  date: string;
  items: ReturnItem[];
  status: 'Received' | 'Pending Approval' | 'Processed' | 'Rejected';
}

// --- Stock Movement Types ---

export interface InternalMovement {
  id: string;
  reference: string;
  date: string;
  warehouseId: string;
  itemId: string;
  itemName: string;
  fromBin: string;
  toBin: string;
  quantity: number;
  performedBy: string;
}

export type AdjustmentType = 'Correction' | 'Damage' | 'Loss' | 'Theft' | 'Found';

export interface StockAdjustment {
  id: string;
  reference: string;
  date: string;
  itemId: string;
  itemName: string;
  warehouseId: string;
  type: AdjustmentType;
  quantity: number; // Absolute value
  impact: 'Add' | 'Deduct'; // Derived from type
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface ScrapEntry {
  id: string;
  reference: string;
  date: string;
  itemId: string;
  itemName: string;
  quantity: number;
  reason: string;
  salvageValue: number;
  status: 'Pending' | 'Approved' | 'Disposed';
}

export interface ConsignmentEntry {
  id: string;
  reference: string;
  date: string;
  partyId: string; // Customer or Vendor ID
  partyName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  type: 'Outward' | 'Inward'; // Out to Customer or In from Vendor
  status: 'Active' | 'Returned' | 'Sold';
}

// --- Stock Control Types ---

export interface StockLedgerEntry {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  transactionType: 'Purchase' | 'Sales' | 'Transfer' | 'Adjustment' | 'Scrap' | 'Initial' | 'Audit';
  reference: string;
  quantityChange: number; // Positive for In, Negative for Out
  runningBalance?: number; // Calculated on fly or stored
}

export interface Batch {
  id: string;
  batchNumber: string;
  itemId: string;
  itemName: string;
  quantity: number;
  mfgDate: string;
  expiryDate: string;
  costPrice: number;
  status: 'Active' | 'Expired' | 'Depleted';
}

export interface SerialNumber {
  id: string;
  serialNumber: string;
  itemId: string;
  itemName: string;
  batchNumber?: string;
  status: 'Available' | 'Sold' | 'Reserved' | 'Defective';
  currentLocation: string;
}

export interface StockReservation {
  id: string;
  reference: string; // SO Number or Project ID
  itemId: string;
  itemName: string;
  quantity: number;
  reservedDate: string;
  expiryDate: string; // Date when reservation expires if not used
  status: 'Active' | 'Fulfilled' | 'Released';
}

// --- Dashboard & Analytics Types ---

export interface ApprovalItem {
  id: string;
  type: 'Purchase Order' | 'GRN QC' | 'Stock Transfer' | 'Adjustment';
  reference: string;
  date: string;
  initiator: string; // Vendor Name or User
  details: string;
  status: string;
}

export interface MovementAnalysis {
  itemId: string;
  itemName: string;
  sku: string;
  category: string;
  turnoverRate: number; // Calculated score
  classification: 'Fast Moving' | 'Slow Moving' | 'Non-Moving';
  lastMovementDate: string;
}

export interface WarehouseStockReport {
  warehouseId: string;
  warehouseName: string;
  totalItems: number;
  totalValue: number;
  utilization: number; // Mock percentage
}

export interface InOutSummary {
  period: string; // e.g., "Jan 2024"
  inwardQty: number;
  outwardQty: number;
  inwardValue: number;
  outwardValue: number;
}

// --- Automation & Barcode Types ---

export interface ScanLog {
  id: string;
  date: string;
  timestamp: string;
  scannedCode: string;
  itemId?: string;
  itemName?: string;
  actionType: 'Check' | 'Inward' | 'Outward' | 'Count';
  status: 'Success' | 'Not Found';
  deviceId: string;
}

export interface LabelTemplate {
  id: string;
  name: string;
  width: string; // e.g. "4in"
  height: string; // e.g. "6in"
  type: 'Product' | 'Shipping' | 'Rack';
}

// --- Valuation Types ---

export interface ClosingStockSnapshot {
  id: string;
  date: string; // Month End Date
  totalValue: number;
  itemCount: number;
  method: 'FIFO' | 'LIFO' | 'Avg';
}

// --- Quality Management Types ---

export interface QualityParameter {
  id: string;
  name: string; // e.g. "Length", "pH Value"
  description: string;
  uom: string; // e.g. "mm", "pH"
  type: 'Numeric' | 'Pass/Fail' | 'Text';
}

export interface InspectionPlan {
  id: string;
  itemId: string;
  itemName: string;
  name: string; // e.g. "Standard Inward Check"
  parameters: {
    parameterId: string;
    parameterName: string;
    minValue?: number;
    maxValue?: number;
    expectedValue?: string; // For Pass/Fail
  }[];
  sampleSize: number; // e.g. 10%
}

export interface QualityChecklistTemplate {
  id: string;
  name: string;
  description: string;
  steps: string[]; // Simple list of checks
}

export interface ReworkEntry {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  reason: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Scrapped';
  date: string;
  completionDate?: string;
  outcome?: 'Restocked' | 'Scrapped';
}

export interface NCR {
  id: string;
  ncrNumber: string;
  refType: 'GRN' | 'Production' | 'Customer Return';
  refId: string; // e.g. GRN ID
  itemId: string;
  itemName: string;
  quantity: number;
  description: string; // Non-conformance details
  rootCause?: string;
  correctiveAction?: string;
  status: 'Open' | 'Investigating' | 'Closed';
  date: string;
}

// --- Document Management Types ---

export interface Invoice {
  id: string;
  invoiceNumber: string;
  soId: string;
  soNumber: string;
  customerName: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  taxAmount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  items: SOItem[];
}

export interface EWayBill {
  id: string;
  billNumber: string;
  challanId: string;
  challanNumber: string;
  customerName: string;
  transporter: string;
  vehicleNo: string;
  distance: number;
  validUntil: string;
  status: 'Active' | 'Expired' | 'Cancelled';
  generatedDate: string;
}

export interface InspectionReport {
  id: string;
  reportNumber: string;
  referenceType: 'GRN' | 'Production';
  referenceId: string; // GRN Number
  date: string;
  inspector: string;
  result: 'Pass' | 'Fail' | 'Conditional';
  remarks: string;
}

export interface DocumentAttachment {
  id: string;
  fileName: string;
  fileType: string;
  size: string;
  uploadDate: string;
  uploadedBy: string;
  referenceType: 'Item' | 'Order' | 'Invoice' | 'General';
  referenceId?: string;
  version: number;
  url?: string;
}

// --- Report Types ---

export interface AuditLog {
  id: string;
  date: string;
  timestamp: string;
  user: string;
  action: 'Create' | 'Update' | 'Delete' | 'Approve' | 'Reject' | 'Login';
  module: string;
  description: string;
  ipAddress?: string;
}

export interface AgingBucket {
  range: string; // "0-30 Days"
  quantity: number;
  value: number;
}

export interface AgingAnalysisItem {
  itemId: string;
  itemName: string;
  totalStock: number;
  buckets: AgingBucket[];
}

export interface GstReportItem {
  invoiceNo: string;
  date: string;
  customerName: string;
  taxableAmount: number;
  sgst: number;
  cgst: number;
  igst: number;
  totalAmount: number;
}

// --- Returns Management Types ---

export interface ReplacementOrder {
  id: string;
  reference: string;
  date: string;
  type: 'Customer' | 'Vendor'; // Customer (we send replacement), Vendor (they send replacement)
  originalReturnId: string; // SalesReturn ID or PurchaseReturn ID
  itemId: string;
  itemName: string;
  quantity: number;
  status: 'Pending' | 'Shipped' | 'Received';
}

export interface FinancialNote {
  id: string;
  noteNumber: string; // DN-xxx or CN-xxx
  date: string;
  type: 'Debit Note' | 'Credit Note';
  referenceId: string; // Return ID
  partyName: string; // Vendor or Customer
  amount: number;
  reason: string;
  status: 'Draft' | 'Issued' | 'Adjusted';
}

// --- Settings & Configuration Types ---

export interface InventorySettings {
  id: string; // Singleton usually 'default'
  companyName: string;
  defaultWarehouseId: string;
  allowNegativeStock: boolean;
  enableBatchTracking: boolean;
  enableSerialTracking: boolean;
  currency: string;
  dateFormat: string;
}

export interface AutoReorderRule {
  id: string;
  name: string;
  itemId: string;
  itemName: string;
  minStock: number;
  reorderQuantity: number; // or EOQ
  vendorId?: string; // Preferred vendor
  vendorName?: string;
  active: boolean;
}

export interface TaxConfig {
  id: string;
  taxName: string; // e.g., GST 18%, VAT 5%
  rate: number;
  type: 'Percentage' | 'Fixed';
  isDefault: boolean;
  country: string;
}

export interface NumberSeries {
  id: string;
  documentType: 'PO' | 'SO' | 'INV' | 'GRN' | 'DC' | 'TRF';
  prefix: string;
  startNumber: number;
  currentNumber: number;
  suffix?: string;
}

export interface CustomField {
  id: string;
  module: 'Item' | 'Order' | 'Vendor';
  fieldName: string;
  fieldType: 'Text' | 'Number' | 'Date' | 'Dropdown';
  options?: string[]; // For dropdown
  required: boolean;
}

export interface WorkflowRule {
  id: string;
  name: string;
  module: 'Purchase' | 'Sales' | 'Stock';
  triggerEvent: 'Create' | 'Update' | 'Approve';
  condition: string; // Simple text for demo, e.g. "Amount > 5000"
  action: 'Email' | 'Notification' | 'Auto-Approve';
  active: boolean;
}

// --- Audit & Logs Types ---

export interface AuditSession {
  id: string;
  reference: string; // AUD-2024-001
  type: 'Full' | 'Cycle';
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
  startDate: string;
  completionDate?: string;
  warehouseId: string;
  warehouseName: string;
  auditor: string;
  items: AuditItem[];
  progress: number; // Percentage
}

export interface AuditItem {
  itemId: string;
  itemName: string;
  sku: string;
  systemQty: number; // Snapshot at start
  physicalQty?: number;
  variance: number; // physical - system
  status: 'Pending' | 'Counted' | 'Verified';
  notes?: string;
}
