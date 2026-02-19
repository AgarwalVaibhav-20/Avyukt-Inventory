import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  Settings,
  BarChart3,
  QrCode,
  ShieldCheck,
  Undo2,
  Users,
  UserCheck,
  FileText,
  PieChart,
  Lock,
  Cpu,
  History,
  Rocket
} from 'lucide-react';
import { MenuItem, InventoryItem } from './types';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    subMenus: [
      { id: 'dash-overview', label: 'Inventory Overview' },
      { id: 'dash-valuation', label: 'Stock Valuation Summary' },
      { id: 'dash-low-stock', label: 'Low Stock Alerts' },
      { id: 'dash-overstock', label: 'Overstock Alerts' },
      { id: 'dash-in-out', label: 'Inward vs Outward Summary' },
      { id: 'dash-warehouse', label: 'Warehouse-wise Stock' },
      { id: 'dash-movement', label: 'Fast / Slow / Non-Moving' },
      { id: 'dash-expiry', label: 'Expiry Alerts' },
      { id: 'dash-approvals', label: 'Pending Approvals' },
    ]
  },
  {
    id: 'product-master',
    label: 'Item / Product Master',
    icon: Package,
    subMenus: [
      { id: 'pm-master', label: 'Item Master' },
      { id: 'pm-categories', label: 'Item Categories' },
      { id: 'pm-variants', label: 'Item Variants' },
      { id: 'pm-uom', label: 'Unit of Measure (UoM)' },
      { id: 'pm-hsn', label: 'HSN / SAC Master' },
      { id: 'pm-brand', label: 'Brand Master' },
      { id: 'pm-attributes', label: 'Item Attributes' },
      { id: 'pm-reorder', label: 'Reorder Levels' },
      { id: 'pm-barcode', label: 'Barcode / QR Mapping' },
      { id: 'pm-pricing', label: 'Item Pricing' },
    ]
  },
  {
    id: 'warehouse',
    label: 'Warehouse Management',
    icon: Warehouse,
    subMenus: [
      { id: 'wm-master', label: 'Warehouse Master' },
      { id: 'wm-location', label: 'Location / Bin Management' },
      { id: 'wm-zone', label: 'Zone / Rack / Shelf Setup' },
      { id: 'wm-multi', label: 'Multi-Warehouse Config' },
      { id: 'wm-inter', label: 'Inter-Warehouse Transfer' },
      { id: 'wm-capacity', label: 'Warehouse Capacity Planning' },
    ]
  },
  {
    id: 'inward',
    label: 'Inward / Procurement',
    icon: ArrowDownToLine,
    subMenus: [
      { id: 'in-req', label: 'Purchase Requisition' },
      { id: 'in-po', label: 'Purchase Order' },
      { id: 'in-grn', label: 'Goods Receipt Note (GRN)' },
      { id: 'in-qc', label: 'Quality Inspection (Inward)' },
      { id: 'in-putaway', label: 'Put-Away Process' },
      { id: 'in-return', label: 'Inward Returns' },
      { id: 'in-invoice', label: 'Supplier Challan Mapping' },
    ]
  },
  {
    id: 'outward',
    label: 'Outward / Dispatch',
    icon: ArrowUpFromLine,
    subMenus: [
      { id: 'out-so', label: 'Sales Order Integration' },
      { id: 'out-pick', label: 'Pick List' },
      { id: 'out-pack', label: 'Packing' },
      { id: 'out-challan', label: 'Delivery Challan' },
      { id: 'out-dispatch', label: 'Dispatch Note' },
      { id: 'out-return', label: 'Outward Returns' },
      { id: 'out-invoice', label: 'Customer Invoice Mapping' },
    ]
  },
  {
    id: 'movement',
    label: 'Stock Movement',
    icon: ArrowRightLeft,
    subMenus: [
      { id: 'mv-transfer', label: 'Stock Transfer' },
      { id: 'mv-internal', label: 'Internal Movement' },
      { id: 'mv-adj', label: 'Adjustment / Correction' },
      { id: 'mv-damage', label: 'Damage / Loss Entry' },
      { id: 'mv-scrap', label: 'Scrap Management' },
      { id: 'mv-consign', label: 'Consignment Stock' },
    ]
  },
  {
    id: 'control',
    label: 'Stock Control',
    icon: Settings, // Reusing Generic
    subMenus: [
      { id: 'ctrl-ledger', label: 'Stock Ledger' },
      { id: 'ctrl-batch', label: 'Batch / Lot Tracking' },
      { id: 'ctrl-serial', label: 'Serial Number Tracking' },
      { id: 'ctrl-expiry', label: 'Expiry Date Tracking' },
      { id: 'ctrl-reserve', label: 'Stock Reservation' },
      { id: 'ctrl-safety', label: 'Safety Stock Monitoring' },
      { id: 'ctrl-valuation', label: 'FIFO / LIFO / Avg' },
    ]
  },
  {
    id: 'valuation',
    label: 'Inventory Valuation',
    icon: BarChart3,
    subMenus: [
      { id: 'val-method', label: 'Valuation Methods' },
      { id: 'val-item', label: 'Item-wise Valuation' },
      { id: 'val-wh', label: 'Warehouse-wise Valuation' },
      { id: 'val-realtime', label: 'Real-Time Stock Value' },
      { id: 'val-closing', label: 'Closing Stock Reports' },
      { id: 'val-recalc', label: 'Cost Recalculation' },
    ]
  },
  {
    id: 'barcode',
    label: 'Barcode & Automation',
    icon: QrCode,
    subMenus: [
      { id: 'bc-gen', label: 'Barcode Generation' },
      { id: 'bc-scan', label: 'Barcode Scanning' },
      { id: 'bc-qr', label: 'QR Code Support' },
      { id: 'bc-mobile', label: 'Mobile Scanning' },
      { id: 'bc-label', label: 'Label Printing' },
      { id: 'bc-rfid', label: 'RFID Integration' },
    ]
  },
  {
    id: 'quality',
    label: 'Quality Management',
    icon: ShieldCheck,
    subMenus: [
      { id: 'qm-param', label: 'Quality Parameters' },
      { id: 'qm-plan', label: 'Inspection Plans' },
      { id: 'qm-check', label: 'Quality Checklists' },
      { id: 'qm-stock', label: 'Accepted / Rejected Stock' },
      { id: 'qm-rework', label: 'Rework Management' },
      { id: 'qm-ncr', label: 'Non-Conformance (NCR)' },
    ]
  },
  {
    id: 'returns',
    label: 'Returns Management',
    icon: Undo2,
    subMenus: [
      { id: 'ret-purchase', label: 'Purchase Return' },
      { id: 'ret-sales', label: 'Sales Return' },
      { id: 'ret-replace', label: 'Replacement Handling' },
      { id: 'ret-notes', label: 'Debit / Credit Note' },
    ]
  },
  {
    id: 'vendor',
    label: 'Vendor Management',
    icon: Users,
    subMenus: [
      { id: 'vm-master', label: 'Vendor Master' },
      { id: 'vm-price', label: 'Vendor Price List' },
      { id: 'vm-lead', label: 'Lead Time Management' },
      { id: 'vm-perf', label: 'Vendor Performance' },
      { id: 'vm-approved', label: 'Approved Vendor List' },
    ]
  },
  {
    id: 'customer',
    label: 'Customer Stock',
    icon: UserCheck,
    subMenus: [
      { id: 'cs-consign', label: 'Customer Consignment' },
      { id: 'cs-loc', label: 'Stock at Customer Loc' },
      { id: 'cs-ret', label: 'Customer Returns' },
    ]
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    subMenus: [
      { id: 'doc-inv', label: 'Invoices' },
      { id: 'doc-chal', label: 'Challans' },
      { id: 'doc-eway', label: 'E-Way Bills' },
      { id: 'doc-pack', label: 'Packing Lists' },
      { id: 'doc-insp', label: 'Inspection Reports' },
      { id: 'doc-ver', label: 'Attachments & Version' },
    ]
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: PieChart,
    subMenus: [
      { id: 'rep-summ', label: 'Stock Summary Report' },
      { id: 'rep-item', label: 'Item-wise Stock Report' },
      { id: 'rep-wh', label: 'Warehouse-wise Report' },
      { id: 'rep-aging', label: 'Aging Analysis' },
      { id: 'rep-exp', label: 'Expiry Analysis' },
      { id: 'rep-move', label: 'Movement Analysis' },
      { id: 'rep-val', label: 'Valuation Reports' },
      { id: 'rep-gst', label: 'GST / Tax Reports' },
      { id: 'rep-audit', label: 'Audit Reports' },
    ]
  },
  {
    id: 'approvals',
    label: 'Approvals & Controls',
    icon: Lock,
    subMenus: [
      { id: 'app-pur', label: 'Purchase Approval' },
      { id: 'app-grn', label: 'GRN Approval' },
      { id: 'app-adj', label: 'Stock Adjustment Appr' },
      { id: 'app-trans', label: 'Transfer Approval' },
      { id: 'app-ret', label: 'Return Approval' },
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Cpu,
    subMenus: [
      { id: 'set-inv', label: 'Inventory Settings' },
      { id: 'set-rule', label: 'Auto Reorder Rules' },
      { id: 'set-tax', label: 'Tax & GST Configuration' },
      { id: 'set-num', label: 'Number Series' },
      { id: 'set-field', label: 'Custom Fields' },
      { id: 'set-flow', label: 'Workflow Rules' },
    ]
  },
  {
    id: 'users',
    label: 'User & Access',
    icon: Users,
    subMenus: [
      { id: 'usr-mgmt', label: 'User Management' },
      { id: 'usr-rbac', label: 'Role-Based Access (RBAC)' },
      { id: 'usr-wh', label: 'Warehouse-wise Access' },
      { id: 'usr-hier', label: 'Approval Hierarchy' },
    ]
  },
  {
    id: 'audit',
    label: 'Audit & Logs',
    icon: History,
    subMenus: [
      { id: 'aud-stock', label: 'Stock Audit' },
      { id: 'aud-cycle', label: 'Cycle Count' },
      { id: 'aud-phy', label: 'Physical Verification' },
      { id: 'aud-hist', label: 'Adjustment History' },
      { id: 'aud-log', label: 'User Activity Logs' },
    ]
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: Rocket,
    subMenus: [
      { id: 'adv-forecast', label: 'Demand Forecasting' },
      { id: 'adv-ai', label: 'AI Reorder Suggestions' },
      { id: 'adv-multi', label: 'Multi-Company Inventory' },
      { id: 'adv-curr', label: 'Multi-Currency Support' },
      { id: 'adv-comp', label: 'Compliance Automation' },
      { id: 'adv-iot', label: 'IoT / Smart Warehouse' },
    ]
  },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { 
    id: '1', 
    name: 'Industrial Ball Bearing X200', 
    sku: 'BB-X200', 
    category: 'Components', 
    brand: 'SKF',
    uom: 'pcs',
    stock: 450, 
    consignmentStock: 20,
    reorderLevel: 500, 
    unitPrice: 12.50, 
    mrp: 20.00,
    salePrice: 18.00,
    hsnCode: '8482',
    barcode: '890123456001',
    status: 'Low Stock', 
    lastUpdated: '2023-10-25' 
  },
  { 
    id: '2', 
    name: 'Hydraulic Pump HP-50', 
    sku: 'HP-5000', 
    category: 'Machinery', 
    brand: 'Bosch',
    uom: 'pcs',
    stock: 12, 
    consignmentStock: 0,
    reorderLevel: 10, 
    unitPrice: 1250.00, 
    mrp: 1800.00,
    salePrice: 1650.00,
    hsnCode: '8413',
    barcode: '890123456002',
    status: 'In Stock', 
    lastUpdated: '2023-10-24' 
  },
  { 
    id: '3', 
    name: 'Safety Gloves - Large', 
    sku: 'SAF-GL-L', 
    category: 'Safety Gear', 
    brand: '3M',
    uom: 'pair',
    stock: 2000, 
    consignmentStock: 0,
    reorderLevel: 200, 
    unitPrice: 3.50, 
    mrp: 6.00,
    salePrice: 5.00,
    hsnCode: '4015',
    barcode: '890123456003',
    status: 'In Stock', 
    lastUpdated: '2023-10-26' 
  },
  { 
    id: '4', 
    name: 'Control Panel V3', 
    sku: 'CP-V3', 
    category: 'Electronics', 
    brand: 'Siemens',
    uom: 'unit',
    stock: 0, 
    consignmentStock: 0,
    reorderLevel: 5, 
    unitPrice: 450.00, 
    mrp: 600.00,
    salePrice: 550.00,
    hsnCode: '8537',
    barcode: '890123456004',
    status: 'Out of Stock', 
    lastUpdated: '2023-10-20' 
  },
  { 
    id: '5', 
    name: 'M10 Stainless Bolt', 
    sku: 'BLT-M10', 
    category: 'Fasteners', 
    brand: 'Generic',
    uom: 'pcs',
    stock: 15000, 
    consignmentStock: 0,
    reorderLevel: 1000, 
    unitPrice: 0.15, 
    mrp: 0.30,
    salePrice: 0.25,
    hsnCode: '7318',
    barcode: '890123456005',
    status: 'In Stock', 
    lastUpdated: '2023-10-25' 
  },
];