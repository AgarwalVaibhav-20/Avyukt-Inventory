import React, { useState, useEffect } from 'react';
import ItemVariantPage from '@/components/product-master/ItemVariantPage';
import Sidebar from '@/components/admin/Sidebar';
import Dashboard from '@/components/dashboard/Dashboard';
import ItemMaster from '@/components/product-master/ItemMaster';
import MasterCrud from '@/components/admin/MasterCrud';
import GenericView from '@/components/admin/GenericView';
import StockTransfer from '@/components/movement/StockTransfer';
import PurchaseOrderView from '@/components/inward/PurchaseOrderView';
import GRNView from '@/components/inward/GRNView';
import QualityCheckView from '@/components/inward/QualityCheckView';
import PutAwayView from '@/components/inward/PutAwayView';
import InwardReturnView from '@/components/inward/InwardReturnView';
import SupplierChallanView from '@/components/inward/SupplierChallanView';
import SalesOrderView from '@/components/outward/SalesOrderView';
import OutwardOpsView from '@/components/outward/OutwardOpsView';
import SalesReturnView from '@/components/outward/SalesReturnView';
import CustomerInvoiceView from '@/components/outward/CustomerInvoiceView';
import InternalMovementView from '@/components/movement/InternalMovementView';
import StockAdjustmentView from '@/components/movement/StockAdjustmentView';
import ScrapManagementView from '@/components/movement/ScrapManagementView';
import ConsignmentStockView from '@/components/movement/ConsignmentStockView';
import ItemPricingView from '@/components/product-master/ItemPricingView';
import ReorderLevelView from '@/components/product-master/ReorderLevelView';
import BarcodeMappingView from '@/components/barcode/BarcodeMappingView';
import StockLedgerView from '@/components/control/StockLedgerView';
import BatchTrackingView from '@/components/control/BatchTrackingView';
import SerialTrackingView from '@/components/control/SerialTrackingView';
import ExpiryTrackingView from '@/components/control/ExpiryTrackingView';
import StockReservationView from '@/components/control/StockReservationView';
import ValuationMethodsView from '@/components/valuation/ValuationMethodsView';
import ItemWiseValuationView from '@/components/valuation/ItemWiseValuationView';
import WarehouseValuationView from '@/components/valuation/WarehouseValuationView';
import RealTimeValuationView from '@/components/valuation/RealTimeValuationView';
import ClosingStockReportView from '@/components/valuation/ClosingStockReportView';
import CostRecalculationView from '@/components/valuation/CostRecalculationView';
import QualityParametersView from '@/components/quality/QualityParametersView';
import InspectionPlansView from '@/components/quality/InspectionPlansView';
import QualityChecklistsView from '@/components/quality/QualityChecklistsView';
import AcceptedRejectedStockView from '@/components/quality/AcceptedRejectedStockView';
import ReworkManagementView from '@/components/quality/ReworkManagementView';
import NCRView from '@/components/quality/NCRView';
import InvoicesView from '@/components/documents/InvoicesView';
import ChallansDocView from '@/components/documents/ChallansDocView';
import EWayBillsView from '@/components/documents/EWayBillsView';
import PackingListsDocView from '@/components/documents/PackingListsDocView';
import InspectionReportsDocView from '@/components/documents/InspectionReportsDocView';
import DocumentVersionsView from '@/components/documents/DocumentVersionsView';
import StockSummaryReportView from '@/components/reports/StockSummaryReportView';
import ItemStockReportView from '@/components/reports/ItemStockReportView';
import WarehouseReportView from '@/components/reports/WarehouseReportView';
import AgingAnalysisView from '@/components/reports/AgingAnalysisView';
import ExpiryAnalysisReportView from '@/components/reports/ExpiryAnalysisReportView';
import MovementAnalysisReportView from '@/components/reports/MovementAnalysisReportView';
import ValuationReportDocView from '@/components/reports/ValuationReportDocView';
import GstTaxReportView from '@/components/reports/GstTaxReportView';
import AuditReportView from '@/components/reports/AuditReportView';
import PurchaseReturnMgmtView from '@/components/returns/PurchaseReturnMgmtView';
import SalesReturnMgmtView from '@/components/returns/SalesReturnMgmtView';
import ReplacementHandlingView from '@/components/returns/ReplacementHandlingView';
import DebitCreditNotesView from '@/components/returns/DebitCreditNotesView';
import VendorMasterView from '@/components/vendor/VendorMasterView';
import VendorPriceListView from '@/components/vendor/VendorPriceListView';
import LeadTimeManagementView from '@/components/vendor/LeadTimeManagementView';
import VendorPerformanceView from '@/components/vendor/VendorPerformanceView';
import ApprovedVendorListView from '@/components/vendor/ApprovedVendorListView';
import PurchaseApprovalView from '@/components/approvals/PurchaseApprovalView';
import GRNApprovalView from '@/components/approvals/GRNApprovalView';
import StockAdjustmentApprovalView from '@/components/approvals/StockAdjustmentApprovalView';
import TransferApprovalView from '@/components/approvals/TransferApprovalView';
import ReturnApprovalView from '@/components/approvals/ReturnApprovalView';
import InventorySettingsView from '@/components/settings/InventorySettingsView';
import AutoReorderRulesView from '@/components/settings/AutoReorderRulesView';
import TaxConfigurationView from '@/components/settings/TaxConfigurationView';
import NumberSeriesView from '@/components/settings/NumberSeriesView';
import CustomFieldsView from '@/components/settings/CustomFieldsView';
import WorkflowRulesView from '@/components/settings/WorkflowRulesView';
import StockAuditView from '@/components/audit/StockAuditView';
import CycleCountView from '@/components/audit/CycleCountView';
import PhysicalVerificationView from '@/components/audit/PhysicalVerificationView';
import AdjustmentHistoryView from '@/components/audit/AdjustmentHistoryView';
import UserActivityLogView from '@/components/audit/UserActivityLogView';
import ZoneStructureView from '@/components/warehouse/ZoneStructureView';
import BinManagementView from '@/components/warehouse/BinManagementView';
import WarehouseCapacityView from '@/components/warehouse/WarehouseCapacityView';
import DashboardApprovals from '@/components/dashboard/DashboardApprovals';
import DashboardExpiry from '@/components/dashboard/DashboardExpiry';
import DashboardMovement from '@/components/dashboard/DashboardMovement';
import DashboardWarehouse from '@/components/dashboard/DashboardWarehouse';
import DashboardInOut from '@/components/dashboard/DashboardInOut';
import BarcodeGeneratorView from '@/components/barcode/BarcodeGeneratorView';
import BarcodeScannerView from '@/components/barcode/BarcodeScannerView';
import LabelPrintingView from '@/components/barcode/LabelPrintingView';
import RfidIntegrationView from '@/components/barcode/RfidIntegrationView';
import AiAssistantModal from '@/components/common/AiAssistantModal';
import { productService } from '@/services/productService';
import { warehouseService } from '@/services/warehouseService';
import { procurementService } from '@/services/procurementService';
import { Bell, Menu, User, Rocket } from 'lucide-react';
import Login from '@/components/common/Login';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { MENU_ITEMS } from '@/constants';

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [activeMenuId, setActiveMenuId] = useState('dash-overview');
  const [parentLabel, setParentLabel] = useState('Dashboard');
  const [activeLabel, setActiveLabel] = useState('Inventory Overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Sync labels with current path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      navigate('/dashboard/dash-overview', { replace: true });
      return;
    }

    let found = false;
    MENU_ITEMS.forEach(item => {
      item.subMenus?.forEach(sub => {
        const expectedPath = `/${item.id}/${sub.id}`;
        if (path === expectedPath) {
          setActiveMenuId(sub.id);
          setParentLabel(item.label);
          setActiveLabel(sub.label);
          found = true;
        }
      });
    });
    
    // Support parent paths if needed
    if (!found) {
        MENU_ITEMS.forEach(item => {
            if (path === `/${item.id}`) {
                if (item.subMenus && item.subMenus.length > 0) {
                    navigate(`/${item.id}/${item.subMenus[0].id}`, { replace: true });
                }
            }
        });
    }
  }, [location.pathname, navigate]);

  const handleMenuSelect = (id: string, pLabel = '', cLabel = '') => {
    // Labels are now synced via useEffect and URL
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
      
      case 'pm-variants':
        return <ItemVariantPage />;
      
      case 'pm-categories':
        return (
          <MasterCrud 
            title="Item Categories" 
            description="Manage product classifications and groups."
            type="category"
            columns={[
              { key: 'name', label: 'Category Name' },
              { key: 'description', label: 'Description' }
            ]}
          />
        );

      case 'pm-brand':
        return (
           <MasterCrud 
            title="Brand Master" 
            description="Manage manufacturers and brands."
            type="brand"
            columns={[
              { key: 'name', label: 'Brand Name' },
              { key: 'manufacturer', label: 'Manufacturer' }
            ]}
          />
        );
      
      case 'pm-uom':
        return (
           <MasterCrud 
            title="Unit of Measure (UoM)" 
            description="Manage standard units for stock keeping."
            type="uom"
            columns={[
              { key: 'name', label: 'Unit Name' },
              { key: 'code', label: 'Unit Code' }
            ]}
          />
        );

      case 'pm-hsn':
        return (
           <MasterCrud 
            title="HSN / SAC Master" 
            description="Harmonized System of Nomenclature for Taxation."
            type="hsn"
            columns={[
              { key: 'hsnCode', label: 'HSN Code' },
              { key: 'description', label: 'Description' },
              { key: 'taxPercentage', label: 'Tax Rate (%)', type: 'number' }
            ]}
          />
        );

       case 'pm-attributes':
        return (
           <MasterCrud 
            title="Item Attributes" 
            description="Global attributes for item variants (Color, Size, Material)."
            type="attribute"
            columns={[
              { key: 'name', label: 'Attribute Name' },
              { key: 'options', label: 'Options', type: 'array' }
            ]}
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
             <Routes>
               {/* Dashboard */}
               <Route path="/dashboard/dash-overview" element={<Dashboard />} />
               <Route path="/dashboard/dash-approvals" element={<DashboardApprovals />} />
               <Route path="/dashboard/dash-expiry" element={<DashboardExpiry />} />
               <Route path="/dashboard/dash-movement" element={<DashboardMovement />} />
               <Route path="/dashboard/dash-warehouse" element={<DashboardWarehouse />} />
               <Route path="/dashboard/dash-in-out" element={<DashboardInOut />} />
               <Route path="/dashboard/dash-valuation" element={<RealTimeValuationView />} />
               <Route path="/dashboard/dash-low-stock" element={<GenericView title="Low Stock Alerts" parent="Dashboard" />} />
               <Route path="/dashboard/dash-overstock" element={<GenericView title="Overstock Alerts" parent="Dashboard" />} />

               {/* Product Master */}
               <Route path="/product-master/pm-master" element={<ItemMaster />} />
               <Route path="/product-master/pm-variants" element={<ItemVariantPage />} />
               <Route path="/product-master/pm-categories" element={
                 <MasterCrud 
                   title="Item Categories" 
                   description="Manage product classifications and groups."
                   type="category"
                   columns={[
                     { key: 'name', label: 'Category Name' },
                     { key: 'description', label: 'Description' }
                   ]}
                 />
               } />
               <Route path="/product-master/pm-brand" element={
                 <MasterCrud 
                   title="Brand Master" 
                   description="Manage manufacturers and brands."
                   type="brand"
                   columns={[
                     { key: 'name', label: 'Brand Name' },
                     { key: 'manufacturer', label: 'Manufacturer' }
                   ]}
                 />
               } />
               <Route path="/product-master/pm-uom" element={
                 <MasterCrud 
                   title="Unit of Measure (UoM)" 
                   description="Manage standard units for stock keeping."
                   type="uom"
                   columns={[
                     { key: 'name', label: 'Unit Name' },
                     { key: 'code', label: 'Unit Code' }
                   ]}
                 />
               } />
               <Route path="/product-master/pm-hsn" element={
                 <MasterCrud 
                   title="HSN / SAC Master" 
                   description="Harmonized System of Nomenclature for Taxation."
                   type="hsn"
                   columns={[
                     { key: 'hsnCode', label: 'HSN Code' },
                     { key: 'description', label: 'Description' },
                     { key: 'taxPercentage', label: 'Tax Rate (%)', type: 'number' }
                   ]}
                 />
               } />
               <Route path="/product-master/pm-attributes" element={
                 <MasterCrud 
                   title="Item Attributes" 
                   description="Global attributes for item variants (Color, Size, Material)."
                   type="attribute"
                   columns={[
                     { key: 'name', label: 'Attribute Name' },
                     { key: 'options', label: 'Options', type: 'array' }
                   ]}
                 />
               } />
               <Route path="/product-master/pm-pricing" element={<ItemPricingView />} />
               <Route path="/product-master/pm-reorder" element={<ReorderLevelView />} />
               <Route path="/product-master/pm-barcode" element={<BarcodeMappingView />} />

               {/* Warehouse Management */}
               <Route path="/warehouse/wm-master" element={
                 <MasterCrud
                   title="Warehouse Master"
                   description="Manage warehouse locations and capacities."
                   type="warehouse"
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
               } />
               <Route path="/warehouse/wm-location" element={<BinManagementView />} />
               <Route path="/warehouse/wm-zone" element={<ZoneStructureView />} />
               <Route path="/warehouse/wm-multi" element={
                 <MasterCrud
                   title="Multi-Warehouse Configuration"
                   description="Configure and synchronize across multiple warehouse locations."
                   type="warehouse"
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
               } />
               <Route path="/warehouse/wm-inter" element={<StockTransfer />} />
               <Route path="/warehouse/wm-capacity" element={<WarehouseCapacityView />} />

               {/* Inward / Procurement */}
               <Route path="/inward/in-req" element={<PurchaseOrderView />} />
               <Route path="/inward/in-po" element={<PurchaseOrderView />} />
               <Route path="/inward/in-grn" element={<GRNView />} />
               <Route path="/inward/in-qc" element={<QualityCheckView />} />
               <Route path="/inward/in-putaway" element={<PutAwayView />} />
               <Route path="/inward/in-return" element={<InwardReturnView />} />
               <Route path="/inward/in-invoice" element={<SupplierChallanView />} />

               {/* Outward / Dispatch */}
               <Route path="/outward/out-so" element={<SalesOrderView />} />
               <Route path="/outward/out-pick" element={<OutwardOpsView stage="pick" />} />
               <Route path="/outward/out-pack" element={<OutwardOpsView stage="pack" />} />
               <Route path="/outward/out-challan" element={<OutwardOpsView stage="challan" />} />
               <Route path="/outward/out-dispatch" element={<OutwardOpsView stage="dispatch" />} />
               <Route path="/outward/out-return" element={<SalesReturnView />} />
               <Route path="/outward/out-invoice" element={<CustomerInvoiceView />} />

               {/* Stock Movement */}
               <Route path="/movement/mv-transfer" element={<StockTransfer />} />
               <Route path="/movement/mv-internal" element={<InternalMovementView />} />
               <Route path="/movement/mv-adj" element={<StockAdjustmentView />} />
               <Route path="/movement/mv-damage" element={<StockAdjustmentView />} />
               <Route path="/movement/mv-scrap" element={<ScrapManagementView />} />
               <Route path="/movement/mv-consign" element={<ConsignmentStockView />} />

               {/* Stock Control */}
               <Route path="/control/ctrl-ledger" element={<StockLedgerView />} />
               <Route path="/control/ctrl-batch" element={<BatchTrackingView />} />
               <Route path="/control/ctrl-serial" element={<SerialTrackingView />} />
               <Route path="/control/ctrl-expiry" element={<ExpiryTrackingView />} />
               <Route path="/control/ctrl-reserve" element={<StockReservationView />} />
               <Route path="/control/ctrl-safety" element={<ReorderLevelView />} />
               <Route path="/control/ctrl-valuation" element={<ValuationMethodsView />} />

               {/* Inventory Valuation */}
               <Route path="/valuation/val-method" element={<ValuationMethodsView />} />
               <Route path="/valuation/val-item" element={<ItemWiseValuationView />} />
               <Route path="/valuation/val-wh" element={<WarehouseValuationView />} />
               <Route path="/valuation/val-realtime" element={<RealTimeValuationView />} />
               <Route path="/valuation/val-closing" element={<ClosingStockReportView />} />
               <Route path="/valuation/val-recalc" element={<CostRecalculationView />} />

               {/* Barcode & Automation */}
               <Route path="/barcode/bc-gen" element={<BarcodeGeneratorView />} />
               <Route path="/barcode/bc-qr" element={<BarcodeGeneratorView />} />
               <Route path="/barcode/bc-scan" element={<BarcodeScannerView />} />
               <Route path="/barcode/bc-mobile" element={<BarcodeScannerView isMobileMode={true} />} />
               <Route path="/barcode/bc-label" element={<LabelPrintingView />} />
               <Route path="/barcode/bc-rfid" element={<RfidIntegrationView />} />

               {/* Quality Management */}
               <Route path="/quality/qm-param" element={<QualityParametersView />} />
               <Route path="/quality/qm-plan" element={<InspectionPlansView />} />
               <Route path="/quality/qm-check" element={<QualityChecklistsView />} />
               <Route path="/quality/qm-stock" element={<AcceptedRejectedStockView />} />
               <Route path="/quality/qm-rework" element={<ReworkManagementView />} />
               <Route path="/quality/qm-ncr" element={<NCRView />} />

               {/* Documents */}
               <Route path="/documents/doc-inv" element={<InvoicesView />} />
               <Route path="/documents/doc-chal" element={<ChallansDocView />} />
               <Route path="/documents/doc-eway" element={<EWayBillsView />} />
               <Route path="/documents/doc-pack" element={<PackingListsDocView />} />
               <Route path="/documents/doc-insp" element={<InspectionReportsDocView />} />
               <Route path="/documents/doc-ver" element={<DocumentVersionsView />} />

               {/* Returns */}
               <Route path="/returns/ret-purchase" element={<PurchaseReturnMgmtView />} />
               <Route path="/returns/ret-sales" element={<SalesReturnMgmtView />} />
               <Route path="/returns/ret-replace" element={<ReplacementHandlingView />} />
               <Route path="/returns/ret-notes" element={<DebitCreditNotesView />} />

               {/* Vendor Management */}
               <Route path="/vendor/vm-master" element={<VendorMasterView />} />
               <Route path="/vendor/vm-price" element={<VendorPriceListView />} />
               <Route path="/vendor/vm-lead" element={<LeadTimeManagementView />} />
               <Route path="/vendor/vm-perf" element={<VendorPerformanceView />} />
               <Route path="/vendor/vm-approved" element={<ApprovedVendorListView />} />

               {/* Approvals */}
               <Route path="/approvals/app-pur" element={<PurchaseApprovalView />} />
               <Route path="/approvals/app-grn" element={<GRNApprovalView />} />
               <Route path="/approvals/app-adj" element={<StockAdjustmentApprovalView />} />
               <Route path="/approvals/app-trans" element={<TransferApprovalView />} />
               <Route path="/approvals/app-ret" element={<ReturnApprovalView />} />

               {/* Settings */}
               <Route path="/settings/set-inv" element={<InventorySettingsView />} />
               <Route path="/settings/set-rule" element={<AutoReorderRulesView />} />
               <Route path="/settings/set-tax" element={<TaxConfigurationView />} />
               <Route path="/settings/set-num" element={<NumberSeriesView />} />
               <Route path="/settings/set-field" element={<CustomFieldsView />} />
               <Route path="/settings/set-flow" element={<WorkflowRulesView />} />

               {/* Audit */}
               <Route path="/audit/aud-stock" element={<StockAuditView />} />
               <Route path="/audit/aud-cycle" element={<CycleCountView />} />
               <Route path="/audit/aud-phy" element={<PhysicalVerificationView sessionId="" onBack={() => navigate('/dashboard/dash-overview')} />} />
               <Route path="/audit/aud-hist" element={<AdjustmentHistoryView />} />
               <Route path="/audit/aud-log" element={<UserActivityLogView />} />

               {/* Reports */}
               <Route path="/reports/rep-summ" element={<StockSummaryReportView />} />
               <Route path="/reports/rep-item" element={<ItemStockReportView />} />
               <Route path="/reports/rep-wh" element={<WarehouseReportView />} />
               <Route path="/reports/rep-aging" element={<AgingAnalysisView />} />
               <Route path="/reports/rep-exp" element={<ExpiryAnalysisReportView />} />
               <Route path="/reports/rep-move" element={<MovementAnalysisReportView />} />
               <Route path="/reports/rep-val" element={<ValuationReportDocView />} />
               <Route path="/reports/rep-gst" element={<GstTaxReportView />} />
               <Route path="/reports/rep-audit" element={<AuditReportView />} />

               {/* Fallback */}
               <Route path="*" element={<GenericView title={activeLabel} parent={parentLabel} />} />
             </Routes>
           </div>
        </main>
      </div>

      {showAiModal && <AiAssistantModal onClose={() => setShowAiModal(false)} />}
    </div>
  );
};

export default App;
