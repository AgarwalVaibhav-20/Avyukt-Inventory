import React, { useState } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Dashboard from '@/components/dashboard/Dashboard';
import ItemMaster from '@/components/inventory/ItemMaster';
import MasterCrud from '@/components/admin/MasterCrud';
import GenericView from '@/components/admin/GenericView';
import StockTransfer from '@/components/inventory/StockTransfer';
import PurchaseOrderView from '@/components/procurement/PurchaseOrderView';
import GRNView from '@/components/procurement/GRNView';
import QualityCheckView from '@/components/quality/QualityCheckView';
import PutAwayView from '@/components/inventory/PutAwayView';
import InwardReturnView from '@/components/procurement/InwardReturnView';
import SupplierChallanView from '@/components/procurement/SupplierChallanView';
import SalesOrderView from '@/components/sales/SalesOrderView';
import OutwardOpsView from '@/components/sales/OutwardOpsView';
import SalesReturnView from '@/components/sales/SalesReturnView';
import CustomerInvoiceView from '@/components/sales/CustomerInvoiceView';
import InternalMovementView from '@/components/inventory/InternalMovementView';
import StockAdjustmentView from '@/components/inventory/StockAdjustmentView';
import ScrapManagementView from '@/components/inventory/ScrapManagementView';
import ConsignmentStockView from '@/components/inventory/ConsignmentStockView';
import ItemPricingView from '@/components/inventory/ItemPricingView';
import ReorderLevelView from '@/components/inventory/ReorderLevelView';
import BarcodeMappingView from '@/components/automation/BarcodeMappingView';
import StockLedgerView from '@/components/inventory/StockLedgerView';
import BatchTrackingView from '@/components/inventory/BatchTrackingView';
import SerialTrackingView from '@/components/inventory/SerialTrackingView';
import ExpiryTrackingView from '@/components/inventory/ExpiryTrackingView';
import StockReservationView from '@/components/inventory/StockReservationView';
import ValuationMethodsView from '@/components/finance/ValuationMethodsView';
import ItemWiseValuationView from '@/components/finance/ItemWiseValuationView';
import WarehouseValuationView from '@/components/finance/WarehouseValuationView';
import RealTimeValuationView from '@/components/finance/RealTimeValuationView';
import ClosingStockReportView from '@/components/reports/ClosingStockReportView';
import CostRecalculationView from '@/components/finance/CostRecalculationView';
import QualityParametersView from '@/components/quality/QualityParametersView';
import InspectionPlansView from '@/components/quality/InspectionPlansView';
import QualityChecklistsView from '@/components/quality/QualityChecklistsView';
import AcceptedRejectedStockView from '@/components/quality/AcceptedRejectedStockView';
import ReworkManagementView from '@/components/quality/ReworkManagementView';
import NCRView from '@/components/quality/NCRView';
import InvoicesView from '@/components/logistics/InvoicesView';
import ChallansDocView from '@/components/logistics/ChallansDocView';
import EWayBillsView from '@/components/logistics/EWayBillsView';
import PackingListsDocView from '@/components/logistics/PackingListsDocView';
import InspectionReportsDocView from '@/components/logistics/InspectionReportsDocView';
import DocumentVersionsView from '@/components/admin/DocumentVersionsView';
import StockSummaryReportView from '@/components/reports/StockSummaryReportView';
import ItemStockReportView from '@/components/reports/ItemStockReportView';
import WarehouseReportView from '@/components/reports/WarehouseReportView';
import AgingAnalysisView from '@/components/reports/AgingAnalysisView';
import ExpiryAnalysisReportView from '@/components/reports/ExpiryAnalysisReportView';
import MovementAnalysisReportView from '@/components/reports/MovementAnalysisReportView';
import ValuationReportDocView from '@/components/reports/ValuationReportDocView';
import GstTaxReportView from '@/components/reports/GstTaxReportView';
import AuditReportView from '@/components/reports/AuditReportView';
import PurchaseReturnMgmtView from '@/components/procurement/PurchaseReturnMgmtView';
import SalesReturnMgmtView from '@/components/sales/SalesReturnMgmtView';
import ReplacementHandlingView from '@/components/sales/ReplacementHandlingView';
import DebitCreditNotesView from '@/components/finance/DebitCreditNotesView';
import VendorMasterView from '@/components/procurement/VendorMasterView';
import VendorPriceListView from '@/components/procurement/VendorPriceListView';
import LeadTimeManagementView from '@/components/procurement/LeadTimeManagementView';
import VendorPerformanceView from '@/components/procurement/VendorPerformanceView';
import ApprovedVendorListView from '@/components/procurement/ApprovedVendorListView';
import PurchaseApprovalView from '@/components/procurement/PurchaseApprovalView';
import GRNApprovalView from '@/components/procurement/GRNApprovalView';
import StockAdjustmentApprovalView from '@/components/inventory/StockAdjustmentApprovalView';
import TransferApprovalView from '@/components/inventory/TransferApprovalView';
import ReturnApprovalView from '@/components/procurement/ReturnApprovalView';
import InventorySettingsView from '@/components/admin/InventorySettingsView';
import AutoReorderRulesView from '@/components/admin/AutoReorderRulesView';
import TaxConfigurationView from '@/components/finance/TaxConfigurationView';
import NumberSeriesView from '@/components/admin/NumberSeriesView';
import CustomFieldsView from '@/components/admin/CustomFieldsView';
import WorkflowRulesView from '@/components/admin/WorkflowRulesView';
import StockAuditView from '@/components/inventory/StockAuditView';
import CycleCountView from '@/components/inventory/CycleCountView';
import PhysicalVerificationView from '@/components/inventory/PhysicalVerificationView';
import AdjustmentHistoryView from '@/components/inventory/AdjustmentHistoryView';
import UserActivityLogView from '@/components/admin/UserActivityLogView';
import ZoneStructureView from '@/components/inventory/ZoneStructureView';
import BinManagementView from '@/components/inventory/BinManagementView';
import WarehouseCapacityView from '@/components/inventory/WarehouseCapacityView';
import DashboardApprovals from '@/components/dashboard/DashboardApprovals';
import DashboardExpiry from '@/components/dashboard/DashboardExpiry';
import DashboardMovement from '@/components/dashboard/DashboardMovement';
import DashboardWarehouse from '@/components/dashboard/DashboardWarehouse';
import DashboardInOut from '@/components/dashboard/DashboardInOut';
import BarcodeGeneratorView from '@/components/automation/BarcodeGeneratorView';
import BarcodeScannerView from '@/components/automation/BarcodeScannerView';
import LabelPrintingView from '@/components/automation/LabelPrintingView';
import RfidIntegrationView from '@/components/automation/RfidIntegrationView';
import AiAssistantModal from '@/components/common/AiAssistantModal';
import { productService } from '@/services/productService';
import { warehouseService } from '@/services/warehouseService';
import { procurementService } from '@/services/procurementService';
import { Bell, Menu, User, Rocket } from 'lucide-react';
import Login from '@/components/common/Login';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [activeMenuId, setActiveMenuId] = useState('dash-overview');
  const [parentLabel, setParentLabel] = useState('Dashboard');
  const [activeLabel, setActiveLabel] = useState('Inventory Overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Special State for Physical Verification navigation
  const [activeAuditSessionId, setActiveAuditSessionId] = useState<string | null>(null);

  const handleMenuSelect = (id: string, pLabel = '', cLabel = '') => {
    setActiveMenuId(id);
    setParentLabel(pLabel);
    setActiveLabel(cLabel);
    setActiveAuditSessionId(null); // Reset special states
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => {}} />;
  }

  const renderContent = () => {
    switch (activeMenuId) {
      // --- Dashboard Sub-Menus ---
      case 'dash-overview':
        return <Dashboard />;
      case 'dash-approvals':
        return <DashboardApprovals />;
      case 'dash-expiry':
        return <DashboardExpiry />;
      case 'dash-movement':
        return <DashboardMovement />;
      case 'dash-warehouse':
        return <DashboardWarehouse />;
      case 'dash-in-out':
        return <DashboardInOut />;
      case 'dash-valuation':
        return <RealTimeValuationView />;
      case 'dash-low-stock': 
      case 'dash-overstock':
        return <GenericView title={activeLabel} parent={parentLabel} />; 

      // --- Product Master Sub-Menus ---
      case 'pm-master':
        return <ItemMaster />;
      
      case 'pm-categories':
        return (
          <MasterCrud 
            title="Item Categories" 
            description="Manage product classifications and groups."
            columns={[
              { key: 'name', label: 'Category Name' },
              { key: 'description', label: 'Description' }
            ]}
            fetchData={productService.getCategories}
            addData={productService.addCategory}
            deleteData={productService.deleteCategory}
          />
        );

      case 'pm-brand':
        return (
           <MasterCrud 
            title="Brand Master" 
            description="Manage manufacturers and brands."
            columns={[
              { key: 'name', label: 'Brand Name' },
              { key: 'manufacturer', label: 'Manufacturer' }
            ]}
            fetchData={productService.getBrands}
            addData={productService.addBrand}
            deleteData={productService.deleteBrand}
          />
        );
      
      case 'pm-uom':
        return (
           <MasterCrud 
            title="Unit of Measure (UoM)" 
            description="Manage standard units for stock keeping."
            columns={[
              { key: 'name', label: 'Unit Name' },
              { key: 'code', label: 'Unit Code' }
            ]}
            fetchData={productService.getUOMs}
            addData={productService.addUOM}
            deleteData={productService.deleteUOM}
          />
        );

      case 'pm-hsn':
        return (
           <MasterCrud 
            title="HSN / SAC Master" 
            description="Harmonized System of Nomenclature for Taxation."
            columns={[
              { key: 'code', label: 'HSN Code' },
              { key: 'description', label: 'Description' },
              { key: 'taxRate', label: 'Tax Rate (%)', type: 'number' }
            ]}
            fetchData={productService.getHSN}
            addData={productService.addHSN}
            deleteData={productService.deleteHSN}
          />
        );

       case 'pm-attributes':
        return (
           <MasterCrud 
            title="Item Attributes" 
            description="Global attributes for item variants (Color, Size, Material)."
            columns={[
              { key: 'name', label: 'Attribute Name' },
              { key: 'values', label: 'Options', type: 'array' }
            ]}
            fetchData={productService.getAttributes}
            addData={productService.addAttribute}
            deleteData={productService.deleteAttribute}
          />
        );
      
      case 'pm-pricing':
        return <ItemPricingView />;
      
      case 'pm-reorder':
        return <ReorderLevelView />;

      case 'pm-barcode':
        return <BarcodeMappingView />;

      // --- Warehouse Management ---
      case 'wm-master':
      case 'wm-multi': 
        return (
            <MasterCrud
                title="Warehouse Master"
                description="Manage warehouse locations and capacities."
                columns={[
                    { key: 'name', label: 'Warehouse Name' },
                    { key: 'location', label: 'Location' },
                    { key: 'type', label: 'Type' },
                    { key: 'capacity', label: 'Capacity', type: 'number' },
                    { key: 'contactPerson', label: 'Contact Person' }
                ]}
                fetchData={warehouseService.getAllWarehouses}
                addData={warehouseService.addWarehouse}
                deleteData={warehouseService.deleteWarehouse}
            />
        );
      
      case 'wm-inter':
        return <StockTransfer />;
      
      case 'wm-zone':
        return <ZoneStructureView />;
      
      case 'wm-location':
        return <BinManagementView />;
      
      case 'wm-capacity':
        return <WarehouseCapacityView />;

      // --- Inward / Procurement ---
      case 'in-req': 
      case 'in-po':
        return <PurchaseOrderView />;
      
      case 'in-grn':
        return <GRNView />;

      case 'in-qc':
        return <QualityCheckView />;

      case 'in-putaway':
        return <PutAwayView />;
      
      case 'in-return':
        return <InwardReturnView />;

      case 'in-invoice':
        return <SupplierChallanView />;

      // --- Outward / Dispatch ---
      case 'out-so':
         return <SalesOrderView />;
      case 'out-pick':
         return <OutwardOpsView stage="pick" />;
      case 'out-pack':
         return <OutwardOpsView stage="pack" />;
      case 'out-challan':
         return <OutwardOpsView stage="challan" />;
      case 'out-dispatch':
         return <OutwardOpsView stage="dispatch" />;
      case 'out-return':
         return <SalesReturnView />;
      case 'out-invoice':
         return <CustomerInvoiceView />;

      // --- Stock Movement ---
      case 'mv-transfer':
         return <StockTransfer />;
      case 'mv-internal':
         return <InternalMovementView />;
      case 'mv-adj':
      case 'mv-damage': // Reusing adjustment view for damage entry as they are same logic usually
         return <StockAdjustmentView />;
      case 'mv-scrap':
         return <ScrapManagementView />;
      case 'mv-consign':
         return <ConsignmentStockView />;

      // --- Stock Control ---
      case 'ctrl-ledger':
         return <StockLedgerView />;
      case 'ctrl-batch':
         return <BatchTrackingView />;
      case 'ctrl-serial':
         return <SerialTrackingView />;
      case 'ctrl-expiry':
         return <ExpiryTrackingView />;
      case 'ctrl-reserve':
         return <StockReservationView />;
      case 'ctrl-safety':
         return <ReorderLevelView />; // Reusing Reorder Level view as it serves safety stock purpose
      case 'ctrl-valuation':
         return <ValuationMethodsView />;

      // --- Inventory Valuation ---
      case 'val-method':
         return <ValuationMethodsView />;
      case 'val-item':
         return <ItemWiseValuationView />;
      case 'val-wh':
         return <WarehouseValuationView />;
      case 'val-realtime':
         return <RealTimeValuationView />;
      case 'val-closing':
         return <ClosingStockReportView />;
      case 'val-recalc':
         return <CostRecalculationView />;

      // --- Barcode & Automation ---
      case 'bc-gen':
      case 'bc-qr':
         return <BarcodeGeneratorView />;
      case 'bc-scan':
         return <BarcodeScannerView />;
      case 'bc-mobile':
         return <BarcodeScannerView isMobileMode={true} />;
      case 'bc-label':
         return <LabelPrintingView />;
      case 'bc-rfid':
         return <RfidIntegrationView />;

      // --- Quality Management ---
      case 'qm-param':
         return <QualityParametersView />;
      case 'qm-plan':
         return <InspectionPlansView />;
      case 'qm-check':
         return <QualityChecklistsView />;
      case 'qm-stock':
         return <AcceptedRejectedStockView />;
      case 'qm-rework':
         return <ReworkManagementView />;
      case 'qm-ncr':
         return <NCRView />;

      // --- Documents Management ---
      case 'doc-inv':
         return <InvoicesView />;
      case 'doc-chal':
         return <ChallansDocView />;
      case 'doc-eway':
         return <EWayBillsView />;
      case 'doc-pack':
         return <PackingListsDocView />;
      case 'doc-insp':
         return <InspectionReportsDocView />;
      case 'doc-ver':
         return <DocumentVersionsView />;

      // --- Returns Management ---
      case 'ret-purchase':
         return <PurchaseReturnMgmtView />;
      case 'ret-sales':
         return <SalesReturnMgmtView />;
      case 'ret-replace':
         return <ReplacementHandlingView />;
      case 'ret-notes':
         return <DebitCreditNotesView />;

      // --- Vendor Management ---
      case 'vm-master':
         return <VendorMasterView />;
      case 'vm-price':
         return <VendorPriceListView />;
      case 'vm-lead':
         return <LeadTimeManagementView />;
      case 'vm-perf':
         return <VendorPerformanceView />;
      case 'vm-approved':
         return <ApprovedVendorListView />;

      // --- Approvals & Controls ---
      case 'app-pur':
         return <PurchaseApprovalView />;
      case 'app-grn':
         return <GRNApprovalView />;
      case 'app-adj':
         return <StockAdjustmentApprovalView />;
      case 'app-trans':
         return <TransferApprovalView />;
      case 'app-ret':
         return <ReturnApprovalView />;

      // --- Settings & Configuration ---
      case 'set-inv':
         return <InventorySettingsView />;
      case 'set-rule':
         return <AutoReorderRulesView />;
      case 'set-tax':
         return <TaxConfigurationView />;
      case 'set-num':
         return <NumberSeriesView />;
      case 'set-field':
         return <CustomFieldsView />;
      case 'set-flow':
         return <WorkflowRulesView />;

      // --- Audit & Logs ---
      case 'aud-stock':
         return <StockAuditView />;
      case 'aud-cycle':
         return <CycleCountView />;
      case 'aud-phy':
         return <PhysicalVerificationView sessionId={activeAuditSessionId || ''} onBack={() => setActiveMenuId('dash-overview')} />; 
         // Note: Normally Physical Verification is launched from within Audit, but menu access needs logic to pick active.
         // For direct menu access, we'll show a "Select Session" screen if ID is missing (handled inside component logic or we add a wrapper)
      case 'aud-hist':
         return <AdjustmentHistoryView />;
      case 'aud-log':
         return <UserActivityLogView />;

      // --- Reports & Analytics ---
      case 'rep-summ':
         return <StockSummaryReportView />;
      case 'rep-item':
         return <ItemStockReportView />;
      case 'rep-wh':
         return <WarehouseReportView />;
      case 'rep-aging':
         return <AgingAnalysisView />;
      case 'rep-exp':
         return <ExpiryAnalysisReportView />;
      case 'rep-move':
         return <MovementAnalysisReportView />;
      case 'rep-val':
         return <ValuationReportDocView />;
      case 'rep-gst':
         return <GstTaxReportView />;
      case 'rep-audit':
         return <AuditReportView />;

      // Reusing Generic for others
      default:
        return <GenericView title={activeLabel} parent={parentLabel} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        activeMenuId={activeMenuId} 
        onMenuSelect={handleMenuSelect}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-500 hover:text-slate-700">
                <Menu size={24} />
             </button>
             <div>
                <h1 className="text-xl font-bold text-slate-800">{activeLabel}</h1>
                <p className="text-xs text-slate-500 hidden sm:block">ACT Business Solution / {parentLabel} / {activeLabel}</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             {/* AI Button */}
             <button 
                onClick={() => setShowAiModal(true)}
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
             >
                <Rocket size={14} /> AI Analyst
             </button>

             <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
             
             <button 
                onClick={handleLogout}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
                title="Logout"
             >
                <User size={16} />
             </button>
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
           <div className="max-w-7xl mx-auto">
             {renderContent()}
           </div>
        </main>
      </div>

      {showAiModal && <AiAssistantModal onClose={() => setShowAiModal(false)} />}
    </div>
  );
};

export default App;
