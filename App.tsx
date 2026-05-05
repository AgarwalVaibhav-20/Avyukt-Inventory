import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ItemMaster from './components/ItemMaster';
import MasterCrud from './components/MasterCrud';
import GenericView from './components/GenericView';
import StockTransfer from './components/StockTransfer';
import PurchaseOrderView from './components/PurchaseOrderView';
import GRNView from './components/GRNView';
import QualityCheckView from './components/QualityCheckView';
import PutAwayView from './components/PutAwayView';
import InwardReturnView from './components/InwardReturnView';
import SupplierChallanView from './components/SupplierChallanView';
import SalesOrderView from './components/SalesOrderView';
import OutwardOpsView from './components/OutwardOpsView';
import SalesReturnView from './components/SalesReturnView';
import CustomerInvoiceView from './components/CustomerInvoiceView';
import InternalMovementView from './components/InternalMovementView';
import StockAdjustmentView from './components/StockAdjustmentView';
import ScrapManagementView from './components/ScrapManagementView';
import ConsignmentStockView from './components/ConsignmentStockView';
import ItemPricingView from './components/ItemPricingView';
import ReorderLevelView from './components/ReorderLevelView';
import BarcodeMappingView from './components/BarcodeMappingView';
import StockLedgerView from './components/StockLedgerView';
import BatchTrackingView from './components/BatchTrackingView';
import SerialTrackingView from './components/SerialTrackingView';
import ExpiryTrackingView from './components/ExpiryTrackingView';
import StockReservationView from './components/StockReservationView';
import ValuationMethodsView from './components/ValuationMethodsView';
import ItemWiseValuationView from './components/ItemWiseValuationView';
import WarehouseValuationView from './components/WarehouseValuationView';
import RealTimeValuationView from './components/RealTimeValuationView';
import ClosingStockReportView from './components/ClosingStockReportView';
import CostRecalculationView from './components/CostRecalculationView';
import QualityParametersView from './components/QualityParametersView';
import InspectionPlansView from './components/InspectionPlansView';
import QualityChecklistsView from './components/QualityChecklistsView';
import AcceptedRejectedStockView from './components/AcceptedRejectedStockView';
import ReworkManagementView from './components/ReworkManagementView';
import NCRView from './components/NCRView';
import InvoicesView from './components/InvoicesView';
import ChallansDocView from './components/ChallansDocView';
import EWayBillsView from './components/EWayBillsView';
import PackingListsDocView from './components/PackingListsDocView';
import InspectionReportsDocView from './components/InspectionReportsDocView';
import DocumentVersionsView from './components/DocumentVersionsView';
import StockSummaryReportView from './components/StockSummaryReportView';
import ItemStockReportView from './components/ItemStockReportView';
import WarehouseReportView from './components/WarehouseReportView';
import AgingAnalysisView from './components/AgingAnalysisView';
import ExpiryAnalysisReportView from './components/ExpiryAnalysisReportView';
import MovementAnalysisReportView from './components/MovementAnalysisReportView';
import ValuationReportDocView from './components/ValuationReportDocView';
import GstTaxReportView from './components/GstTaxReportView';
import AuditReportView from './components/AuditReportView';
import PurchaseReturnMgmtView from './components/PurchaseReturnMgmtView';
import SalesReturnMgmtView from './components/SalesReturnMgmtView';
import ReplacementHandlingView from './components/ReplacementHandlingView';
import DebitCreditNotesView from './components/DebitCreditNotesView';
import VendorMasterView from './components/VendorMasterView';
import VendorPriceListView from './components/VendorPriceListView';
import LeadTimeManagementView from './components/LeadTimeManagementView';
import VendorPerformanceView from './components/VendorPerformanceView';
import ApprovedVendorListView from './components/ApprovedVendorListView';
import PurchaseApprovalView from './components/PurchaseApprovalView';
import GRNApprovalView from './components/GRNApprovalView';
import StockAdjustmentApprovalView from './components/StockAdjustmentApprovalView';
import TransferApprovalView from './components/TransferApprovalView';
import ReturnApprovalView from './components/ReturnApprovalView';
import InventorySettingsView from './components/InventorySettingsView';
import AutoReorderRulesView from './components/AutoReorderRulesView';
import TaxConfigurationView from './components/TaxConfigurationView';
import NumberSeriesView from './components/NumberSeriesView';
import CustomFieldsView from './components/CustomFieldsView';
import WorkflowRulesView from './components/WorkflowRulesView';
import StockAuditView from './components/StockAuditView';
import CycleCountView from './components/CycleCountView';
import PhysicalVerificationView from './components/PhysicalVerificationView';
import AdjustmentHistoryView from './components/AdjustmentHistoryView';
import UserActivityLogView from './components/UserActivityLogView';
import ZoneStructureView from './components/ZoneStructureView';
import BinManagementView from './components/BinManagementView';
import WarehouseCapacityView from './components/WarehouseCapacityView';
import DashboardApprovals from './components/DashboardApprovals';
import DashboardExpiry from './components/DashboardExpiry';
import DashboardMovement from './components/DashboardMovement';
import DashboardWarehouse from './components/DashboardWarehouse';
import DashboardInOut from './components/DashboardInOut';
import BarcodeGeneratorView from './components/BarcodeGeneratorView';
import BarcodeScannerView from './components/BarcodeScannerView';
import LabelPrintingView from './components/LabelPrintingView';
import RfidIntegrationView from './components/RfidIntegrationView';
import AiAssistantModal from './components/AiAssistantModal';
import { productService } from './services/productService';
import { warehouseService } from './services/warehouseService';
import { procurementService } from './services/procurementService';
import { Bell, Menu, User, Rocket } from 'lucide-react';

const App: React.FC = () => {
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
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 border border-slate-300">
                <User size={16} />
             </div>
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
