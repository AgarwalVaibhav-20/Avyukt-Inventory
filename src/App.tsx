import React, { useState, useEffect } from "react";
import ItemVariantPage from "@/components/product-master/ItemVariantPage";
import Sidebar from "@/components/admin/Sidebar";
import Dashboard from "@/components/dashboard/Dashboard";
import ItemMaster from "@/components/product-master/ItemMaster";
import MasterCrud from "@/components/admin/MasterCrud";
import GenericView from "@/components/admin/GenericView";
import StockTransfer from "@/components/movement/StockTransfer";
import PurchaseOrderView from "@/components/inward/PurchaseOrderView";
import GRNView from "@/components/inward/GRNView";
import QualityCheckView from "@/components/inward/QualityCheckView";
import PutAwayView from "@/components/inward/PutAwayView";
import InwardReturnView from "@/components/inward/InwardReturnView";
import InvoiceMatchingView from "@/components/inward/InvoiceMatchingView";
import SalesOrderView from "@/components/outward/SalesOrderView";
import OutwardOpsView from "@/components/outward/OutwardOpsView";
import SalesReturnView from "@/components/outward/SalesReturnView";
import CustomerInvoiceView from "@/components/outward/CustomerInvoiceView";
import InternalMovementView from "@/components/movement/InternalMovementView";
import StockAdjustmentView from "@/components/movement/StockAdjustmentView";
import ScrapManagementView from "@/components/movement/ScrapManagementView";
import ConsignmentStockView from "@/components/movement/ConsignmentStockView";
import ItemPricingView from "@/components/product-master/ItemPricingView";
import ReorderLevelView from "@/components/product-master/ReorderLevelView";
import BarcodeMappingView from "@/components/barcode/BarcodeMappingView";
import StockLedgerView from "@/components/control/StockLedgerView";
import BatchTrackingView from "@/components/control/BatchTrackingView";
import SerialTrackingView from "@/components/control/SerialTrackingView";
import ExpiryTrackingView from "@/components/control/ExpiryTrackingView";
import StockReservationView from "@/components/control/StockReservationView";
import ValuationMethodsView from "@/components/valuation/ValuationMethodsView";
import ItemWiseValuationView from "@/components/valuation/ItemWiseValuationView";
import WarehouseValuationView from "@/components/valuation/WarehouseValuationView";
import RealTimeValuationView from "@/components/valuation/RealTimeValuationView";
import ClosingStockReportView from "@/components/valuation/ClosingStockReportView";
import CostRecalculationView from "@/components/valuation/CostRecalculationView";
import COGSView from "@/components/valuation/COGSView";
import QualityParametersView from "@/components/quality/QualityParametersView";
import InspectionPlansView from "@/components/quality/InspectionPlansView";
import QualityChecklistsView from "@/components/quality/QualityChecklistsView";
import AcceptedRejectedStockView from "@/components/quality/AcceptedRejectedStockView";
import ReworkManagementView from "@/components/quality/ReworkManagementView";
import NCRView from "@/components/quality/NCRView";
import InvoicesView from "@/components/documents/InvoicesView";
import ChallansDocView from "@/components/documents/ChallansDocView";
import EWayBillsView from "@/components/documents/EWayBillsView";
import PackingListsDocView from "@/components/documents/PackingListsDocView";
import InspectionReportsDocView from "@/components/documents/InspectionReportsDocView";
import DocumentVersionsView from "@/components/documents/DocumentVersionsView";
import StockSummaryReportView from "@/components/reports/StockSummaryReportView";
import ItemStockReportView from "@/components/reports/ItemStockReportView";
import WarehouseReportView from "@/components/reports/WarehouseReportView";
import AgingAnalysisView from "@/components/reports/AgingAnalysisView";
import ExpiryAnalysisReportView from "@/components/reports/ExpiryAnalysisReportView";
import MovementAnalysisReportView from "@/components/reports/MovementAnalysisReportView";
import ValuationReportDocView from "@/components/reports/ValuationReportDocView";
import GstTaxReportView from "@/components/reports/GstTaxReportView";
import AuditReportView from "@/components/reports/AuditReportView";
import PurchaseReturnMgmtView from "@/components/returns/PurchaseReturnMgmtView";
import SalesReturnMgmtView from "@/components/returns/SalesReturnMgmtView";
import ReplacementHandlingView from "@/components/returns/ReplacementHandlingView";
import DebitCreditNotesView from "@/components/returns/DebitCreditNotesView";
import VendorMasterView from "@/components/vendor/VendorMasterView";
import VendorPriceListView from "@/components/vendor/VendorPriceListView";
import LeadTimeManagementView from "@/components/vendor/LeadTimeManagementView";
import VendorPerformanceView from "@/components/vendor/VendorPerformanceView";
import ApprovedVendorListView from "@/components/vendor/ApprovedVendorListView";
import PurchaseApprovalView from "@/components/approvals/PurchaseApprovalView";
import GRNApprovalView from "@/components/approvals/GRNApprovalView";
import StockAdjustmentApprovalView from "@/components/approvals/StockAdjustmentApprovalView";
import TransferApprovalView from "@/components/approvals/TransferApprovalView";
import ReturnApprovalView from "@/components/approvals/ReturnApprovalView";
import SettingsView from "@/components/settings/SettingsView";
import InventorySettingsView from "@/components/settings/InventorySettingsView";
import AutoReorderRulesView from "@/components/settings/AutoReorderRulesView";
import TaxConfigurationView from "@/components/settings/TaxConfigurationView";
import NumberSeriesView from "@/components/settings/NumberSeriesView";
import CustomFieldsView from "@/components/settings/CustomFieldsView";
import WorkflowRulesView from "@/components/settings/WorkflowRulesView";
import StockAuditView from "@/components/audit/StockAuditView";
import CycleCountView from "@/components/audit/CycleCountView";
import PhysicalVerificationView from "@/components/audit/PhysicalVerificationView";
import AdjustmentHistoryView from "@/components/audit/AdjustmentHistoryView";
import UserActivityLogView from "@/components/audit/UserActivityLogView";
import ZoneStructureView from "@/components/warehouse/ZoneStructureView";
import BinManagementView from "@/components/warehouse/BinManagementView";
import WarehouseCapacityView from "@/components/warehouse/WarehouseCapacityView";
import DashboardApprovals from "@/components/dashboard/DashboardApprovals";
import DashboardExpiry from "@/components/dashboard/DashboardExpiry";
import DashboardMovement from "@/components/dashboard/DashboardMovement";
import DashboardWarehouse from "@/components/dashboard/DashboardWarehouse";
import DashboardInOut from "@/components/dashboard/DashboardInOut";
import BarcodeGeneratorView from "@/components/barcode/BarcodeGeneratorView";
import BarcodeScannerView from "@/components/barcode/BarcodeScannerView";
import LabelPrintingView from "@/components/barcode/LabelPrintingView";
import RfidIntegrationView from "@/components/barcode/RfidIntegrationView";
import PurchaseRequisitionView from "@/components/inward/PurchaseRequisitionView";
import AiAssistantModal from "@/components/common/AiAssistantModal";
import SearchResultsPage from "@/components/common/SearchResultsPage";
import GlobalSearch from "@/components/common/GlobalSearch";
import UserManagementView from "@/components/users/UserManagementView";
import SessionBanner from "@/components/users/SessionBanner";

// Master Data Views
import CategoryView from "@/components/admin/master/CategoryView";
import BrandView from "@/components/admin/master/BrandView";
import UomView from "@/components/admin/master/UomView";
import HsnView from "@/components/admin/master/HsnView";
import AttributeView from "@/components/admin/master/AttributeView";
import WarehouseMasterView from "@/components/admin/master/WarehouseMasterView";
import MultiWarehouseView from "@/components/admin/master/MultiWarehouseView";

import { productService } from "@/services/productService";
import { warehouseService } from "@/services/warehouseService";
import { procurementService } from "@/services/procurementService";
import {
  Bell,
  Menu,
  User,
  Rocket,
  Settings,
  LogOut,
  ChevronDown,
  Camera,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import ProfileView from "@/components/common/ProfileView";
import { notificationService } from "@/services/notificationService";
import { delegatedAccessService } from "@/services/delegatedAccessService";
import toast, { Toaster } from "react-hot-toast";
import { fetchProfile } from "@/store/slices/authSlice";
import Login from "@/components/common/Login";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, endDelegatedSession } from "@/store/slices/authSlice";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { MENU_ITEMS } from "@/constants";
import LowStockAlerts from "./components/dashboard/Lowstockalerts";
import OverstockAlerts from "./components/dashboard/OverStockAlert";

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [activeMenuId, setActiveMenuId] = useState("dash-overview");
  const [parentLabel, setParentLabel] = useState("Dashboard");
  const [activeLabel, setActiveLabel] = useState("Inventory Overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null);
  const [pendingAccessRequests, setPendingAccessRequests] = useState<any[]>([]);
  const [respondingAccessId, setRespondingAccessId] = useState<string | null>(null);

  // Socket ref
  const socketRef = React.useRef<any>(null);

  const { user, isDelegatedSession } = useAppSelector((state) => state.auth);
  const currentUserId = String(user?._id || user?.id || "");
  const normalizeNotificationList = (data: any) =>
    Array.isArray(data) ? data : data?.notifications || [];
  const mergeNotifications = (base: any[], incoming: any[]) => {
    const seen = new Set<string>();
    return [...incoming, ...base].filter((notification) => {
      const id = String(notification._id || notification.id || "");
      if (!id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };
  const pendingInvites = notifications.filter((notification) => {
    const receiverId =
      typeof notification.receiverId === "object"
        ? notification.receiverId?._id
        : notification.receiverId;
    return (
      notification.type === "invite" &&
      notification.inviteResponse === "pending" &&
      (!receiverId || String(receiverId) === currentUserId)
    );
  });
  const pendingAccessNotifications = notifications.filter(
    (notification) => {
      const receiverId =
        typeof notification.receiverId === "object"
          ? notification.receiverId?._id
          : notification.receiverId;
      return (
        notification.type === "access_request" &&
        (notification.status === "unread" || notification.read === false) &&
        (!receiverId || String(receiverId) === currentUserId)
      );
    },
  );
  const activeInvite = pendingInvites[0];
  const activeAccessRequest = pendingAccessRequests[0];
  const activeAccessNotification = pendingAccessNotifications[0];
  const headerRequestCount =
    pendingInvites.length +
    Math.max(pendingAccessRequests.length, pendingAccessNotifications.length);

  const handleInviteResponse = async (
    notificationId: string,
    response: "accepted" | "rejected",
  ) => {
    try {
      setRespondingInviteId(notificationId);
      const result = await notificationService.respondToInvite(
        notificationId,
        response,
      );
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId || notification.id === notificationId
            ? {
                ...notification,
                status: "read",
                read: true,
                inviteResponse: response,
              }
            : notification,
        ),
      );

      if (response === "accepted") {
        const updatedUser = result?.updatedUser;
        if (updatedUser) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
          if (updatedUser.organisationId) {
            localStorage.setItem("organisationId", updatedUser.organisationId);
          }
        }
        await dispatch(fetchProfile());
        toast.success("Invitation accepted");
      } else {
        toast.success("Invitation rejected");
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || `Failed to ${response} invitation`;
      toast.error(message);
    } finally {
      setRespondingInviteId(null);
    }
  };

  const handleAccessRequestResponse = async (
    requestId: string,
    response: "approved" | "rejected",
  ) => {
    try {
      setRespondingAccessId(requestId);
      if (response === "approved") {
        await delegatedAccessService.approveAccess(requestId);
        toast.success("Access request approved");
      } else {
        await delegatedAccessService.rejectAccess(requestId, "Request rejected");
        toast.success("Access request rejected");
      }
      setPendingAccessRequests((prev) =>
        prev.filter((request) => request._id !== requestId),
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          `Failed to ${response === "approved" ? "approve" : "reject"} access request`,
      );
    } finally {
      setRespondingAccessId(null);
    }
  };

  const openAccessRequestCenter = () => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification._id === activeAccessNotification?._id ||
        notification.id === activeAccessNotification?.id
          ? { ...notification, status: "read", read: true }
          : notification,
      ),
    );
    navigate("/users/usr-mgmt");
  };

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProfile());
    }

    // Setup Socket.IO client for real-time notifications
    // Dynamically import socket.io-client to avoid Vite import-resolution issues
    import("socket.io-client")
      .then(({ io }) => {
        try {
          const socket = io(
            import.meta.env.VITE_SOCKET_URL ||
              "https://inventory-backend-alpha-eight.vercel.app",
            { transports: ["websocket", "polling"] },
          );
          socketRef.current = socket;

          socket.on("connect", () => {
            console.log("Socket connected", socket.id);
          });

          socket.on("notification", (payload: any) => {
            if (payload?.type === "invite") {
              const receiverId =
                typeof payload.receiverId === "object"
                  ? payload.receiverId?._id
                  : payload.receiverId;
              if (receiverId && String(receiverId) !== currentUserId) return;
            }
            setNotifications((prev) => [payload, ...prev]);
          });

          socket.on("notification:updated", (payload: any) => {
            // payload: { id, status }
            setNotifications((prev) =>
              prev.map((n) =>
                n._id === payload.id || n.id === payload.id
                  ? {
                      ...n,
                      status: payload.status,
                      read: payload.status === "read",
                    }
                  : n,
              ),
            );
          });

          socket.on("notifications:markedAll", (payload: any) => {
            // Mark all matching notifications as read locally
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          });

          socket.on("inventory:update", () => {
            notificationService
              .getNotifications()
              .then((data) => {
                setNotifications(normalizeNotificationList(data));
              })
              .catch(() => {});
          });

          socket.on("disconnect", () => {
            console.log("Socket disconnected");
          });
        } catch (err) {
          console.warn("Socket initialization failed", err);
        }
      })
      .catch((err) => {
        console.warn("Failed dynamic import of socket.io-client", err);
      });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [dispatch, isAuthenticated, currentUserId]);

  // Lazy polling: refresh notifications every 60s and when tab becomes visible
  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;
    const fetchList = async () => {
      setNotificationsLoading(true);
      try {
        const [data, inviteData, accessData] = await Promise.all([
          notificationService.getNotifications(),
          notificationService.getPendingInvites(),
          delegatedAccessService.getReceivedRequests("pending", 1, 20),
        ]);
        if (!mounted) return;
        setPendingAccessRequests(accessData?.requests || []);
        setNotifications(
          mergeNotifications(
            normalizeNotificationList(data),
            normalizeNotificationList(inviteData),
          ),
        );
      } catch (err) {
        console.error("Failed to poll notifications", err);
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchList();
    const interval = setInterval(fetchList, 60000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchList();
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAuthenticated]);

  // Sync labels with current path
  useEffect(() => {
    const path = location.pathname;
    if (path === "/") {
      navigate("/dashboard/dash-overview", { replace: true });
      return;
    }

    let found = false;
    MENU_ITEMS.forEach((item) => {
      item.subMenus?.forEach((sub) => {
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
      MENU_ITEMS.forEach((item) => {
        if (path === `/${item.id}`) {
          if (item.subMenus && item.subMenus.length > 0) {
            navigate(`/${item.id}/${item.subMenus[0].id}`, { replace: true });
          }
        }
      });
    }
  }, [location.pathname, navigate]);

  const handleMenuSelect = (id: string, pLabel = "", cLabel = "") => {
    // Labels are now synced via useEffect and URL
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => {}} />;
  }

  const renderContent = () => {
    console.log("📍 renderContent called with activeMenuId:", activeMenuId);
    switch (activeMenuId) {
      // --- Dashboard Sub-Menus ---
      case "dash-overview":
        return <Dashboard />;
      case "dash-approvals":
        return <DashboardApprovals />;
      case "dash-expiry":
        return <DashboardExpiry />;
      case "dash-movement":
        return <DashboardMovement />;
      case "dash-warehouse":
        return <DashboardWarehouse />;
      case "dash-in-out":
        return <DashboardInOut />;
      case "dash-valuation":
        return <RealTimeValuationView />;
      case "dash-low-stock":
      case "dash-overstock":
        return <GenericView title={activeLabel} parent={parentLabel} />;

      // --- Product Master Sub-Menus ---
      case "pm-master":
        return <ItemMaster />;

      case "pm-variants":
        return <ItemVariantPage />;

      case "pm-categories":
        return <CategoryView />;

      case "pm-brand":
        return <BrandView />;

      case "pm-uom":
        return <UomView />;

      case "pm-hsn":
        return <HsnView />;

      case "pm-attributes":
        return <AttributeView />;

      case "pm-pricing":
        return <ItemPricingView />;

      case "pm-reorder":
        return <ReorderLevelView />;

      case "pm-barcode":
        return <BarcodeMappingView />;

      // --- Warehouse Management ---
      case "wm-master":
        return <WarehouseMasterView />;
      case "wm-multi":
        return <MultiWarehouseView />;

      case "wm-inter":
        return <StockTransfer />;

      case "wm-zone":
        return <ZoneStructureView />;

      case "wm-location":
        return <BinManagementView />;

      case "wm-capacity":
        return <WarehouseCapacityView />;

      // --- Inward / Procurement ---
      case "in-req":
        return <PurchaseRequisitionView />;
      case "in-po":
        return <PurchaseOrderView />;

      case "in-grn":
        return <GRNView />;

      case "in-qc":
        return <QualityCheckView />;

      case "in-putaway":
        return <PutAwayView />;

      case "in-return":
        return <InwardReturnView />;

      case "in-invoice":
        return <InvoiceMatchingView />;

      // --- Outward / Dispatch ---
      case "out-so":
        return <SalesOrderView />;
      case "out-pick":
        return <OutwardOpsView stage="pick" />;
      case "out-pack":
        return <OutwardOpsView stage="pack" />;
      case "out-challan":
        return <OutwardOpsView stage="challan" />;
      case "out-dispatch":
        return <OutwardOpsView stage="dispatch" />;
      case "out-return":
        return <SalesReturnView />;
      case "out-invoice":
        return <CustomerInvoiceView />;

      // --- Stock Movement ---
      case "mv-transfer":
        return <StockTransfer />;
      case "mv-internal":
        return <InternalMovementView />;
      case "mv-adj":
      case "mv-damage": // Reusing adjustment view for damage entry as they are same logic usually
        return <StockAdjustmentView />;
      case "mv-scrap":
        return <ScrapManagementView />;
      case "mv-consign":
        return <ConsignmentStockView />;

      // --- Stock Control ---
      case "ctrl-ledger":
        return <StockLedgerView />;
      case "ctrl-batch":
        return <BatchTrackingView />;
      case "ctrl-serial":
        return <SerialTrackingView />;
      case "ctrl-expiry":
        return <ExpiryTrackingView />;
      case "ctrl-reserve":
        return <StockReservationView />;
      case "ctrl-safety":
        return <ReorderLevelView />; // Reusing Reorder Level view as it serves safety stock purpose
      case "ctrl-valuation":
        return <ValuationMethodsView />;

      // --- Inventory Valuation ---
      case "val-method":
        return <ValuationMethodsView />;
      case "val-item":
        return <ItemWiseValuationView />;
      case "val-wh":
        return <WarehouseValuationView />;
      case "val-realtime":
        return <RealTimeValuationView />;
      case "val-closing":
        return <ClosingStockReportView />;
      case "val-recalc":
        return <CostRecalculationView />;

      // --- Barcode & Automation ---
      case "bc-gen":
      case "bc-qr":
        return <BarcodeGeneratorView />;
      case "bc-scan":
        return <BarcodeScannerView />;
      case "bc-mobile":
        return <BarcodeScannerView isMobileMode={true} />;
      case "bc-label":
        return <LabelPrintingView />;
      case "bc-rfid":
        return <RfidIntegrationView />;

      // --- Quality Management ---
      case "qm-param":
        return <QualityParametersView />;
      case "qm-plan":
        return <InspectionPlansView />;
      case "qm-check":
        return <QualityChecklistsView />;
      case "qm-stock":
        return <AcceptedRejectedStockView />;
      case "qm-rework":
        return <ReworkManagementView />;
      case "qm-ncr":
        return <NCRView />;

      // --- Documents Management ---
      case "doc-inv":
        return <InvoicesView />;
      case "doc-chal":
        return <ChallansDocView />;
      case "doc-eway":
        return <EWayBillsView />;
      case "doc-pack":
        return <PackingListsDocView />;
      case "doc-insp":
        return <InspectionReportsDocView />;
      case "doc-ver":
        return <DocumentVersionsView />;

      // --- Returns Management ---
      case "ret-purchase":
        return <PurchaseReturnMgmtView />;
      case "ret-sales":
        return <SalesReturnMgmtView />;
      case "ret-replace":
        return <ReplacementHandlingView />;
      case "ret-notes":
        return <DebitCreditNotesView />;

      // --- Vendor Management ---
      case "vm-master":
        return <VendorMasterView />;
      case "vm-price":
        return <VendorPriceListView />;
      case "vm-lead":
        return <LeadTimeManagementView />;
      case "vm-perf":
        return <VendorPerformanceView />;
      case "vm-approved":
        return <ApprovedVendorListView />;

      // --- Customer Stock ---
      case "cs-consign":
      case "cs-loc":
      case "cs-ret":
        return <ConsignmentStockView />;

      // --- Approvals & Controls ---
      case "app-pur":
        return <PurchaseApprovalView />;
      case "app-grn":
        return <GRNApprovalView />;
      case "app-adj":
        return <StockAdjustmentApprovalView />;
      case "app-trans":
        return <TransferApprovalView />;
      case "app-ret":
        return <ReturnApprovalView />;

      // --- Settings & Configuration ---
      case "set-inv":
        return <SettingsView defaultTab="inventory" />;
      case "set-rule":
        return <SettingsView defaultTab="autoreorder" />;
      case "set-tax":
        return <SettingsView defaultTab="tax" />;
      case "set-num":
        return <SettingsView defaultTab="number" />;
      case "set-field":
        return <SettingsView defaultTab="custom" />;
      case "set-flow":
        return <SettingsView defaultTab="workflow" />;

      // --- Audit & Logs ---
      case "aud-stock":
        return <StockAuditView />;
      case "aud-cycle":
        return <CycleCountView />;
      case "aud-phy":
        return <PhysicalVerificationView sessionId={""} onBack={() => {}} />;
      case "aud-hist":
        return <AdjustmentHistoryView />;
      case "aud-log":
        return <UserActivityLogView />;

      // --- Reports & Analytics ---
      case "rep-summ":
        return <StockSummaryReportView />;
      case "rep-item":
        return <ItemStockReportView />;
      case "rep-wh":
        return <WarehouseReportView />;
      case "rep-aging":
        return <AgingAnalysisView />;
      case "rep-exp":
        return <ExpiryAnalysisReportView />;
      case "rep-move":
        return <MovementAnalysisReportView />;
      case "rep-val":
        return <ValuationReportDocView />;
      case "rep-gst":
        return <GstTaxReportView />;
      case "rep-audit":
        return <AuditReportView />;

      // --- User & Access ---
      case "usr-mgmt":
        console.log("🎯 Rendering UserManagementView");
        return <UserManagementView />;

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

      <div
        className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isSidebarOpen ? "md:pl-72" : "pl-0"}`}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4 flex-1 max-w-3xl">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-all active:scale-95 flex-shrink-0"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <ChevronRight size={24} />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-800 truncate">
                {activeLabel}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block truncate">
                ACT Business Solution / {parentLabel} / {activeLabel}
              </p>
            </div>
            {/* Global Search */}
            <div className="hidden lg:block ml-auto">
              <GlobalSearch className="w-64" />
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

            {headerRequestCount > 0 && (
              <button
                onClick={() => setShowNotifications(true)}
                className="flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                title="Pending invitations and access requests"
              >
                <Bell size={14} />
                Invitation
                <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] leading-none text-white">
                  {headerRequestCount}
                </span>
              </button>
            )}

            <button
              onClick={async () => {
                const next = !showNotifications;
                setShowNotifications(next);
                if (next && notifications.length === 0) {
                  setNotificationsLoading(true);
                  try {
                    const [data, inviteData, accessData] = await Promise.all([
                      notificationService.getNotifications(),
                      notificationService.getPendingInvites(),
                      delegatedAccessService.getReceivedRequests("pending", 1, 20),
                    ]);
                    setPendingAccessRequests(accessData?.requests || []);
                    setNotifications(
                      mergeNotifications(
                        normalizeNotificationList(data),
                        normalizeNotificationList(inviteData),
                      ),
                    );
                  } catch (err) {
                    console.error("Failed to load notifications", err);
                  } finally {
                    setNotificationsLoading(false);
                  }
                }
              }}
              className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Bell size={20} />
              {notifications.some(
                (notification) =>
                  notification.status === "unread" || notification.read === false,
              ) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNotifications(false)}
                ></div>
                <div className="fixed top-20 right-8 w-96 max-h-96 bg-white rounded-xl shadow-2xl border border-slate-100 z-20 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50 bg-white rounded-t-xl sticky top-0">
                    <p className="text-sm font-semibold">Notifications</p>
                    <button
                      onClick={async () => {
                        try {
                          await notificationService.markAllAsRead();
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, read: true })),
                          );
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {notificationsLoading && (
                      <p className="p-3 text-sm text-slate-500">Loading...</p>
                    )}
                    {!notificationsLoading && notifications.length === 0 && (
                      <p className="p-3 text-sm text-slate-500">
                        No notifications
                      </p>
                    )}
                    {!notificationsLoading &&
                      notifications.map((n) => (
                        <div
                          key={n._id || n.id}
                          onClick={() => {
                            // if notification contains a route, navigate
                            const route = n.route || n.link || n.url;
                            if (route) {
                              navigate(route);
                              setShowNotifications(false);
                            }
                          }}
                          className={`px-4 py-3 border-b border-slate-50 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${n.read ? "bg-white" : "bg-indigo-50"}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 break-words">
                              {n.title || n.subject}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap break-words line-clamp-3">
                              {n.body ||
                                n.message ||
                                n.remark ||
                                (n.materialData &&
                                  JSON.stringify(n.materialData, null, 2))}
                            </p>
                            <div className="text-[11px] text-slate-400 mt-2">
                              {new Date(
                                n.createdAt || n.created,
                              ).toLocaleString()}
                            </div>
                          </div>
                          {!n.read && (
                            <div className="flex flex-col items-end gap-2">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await notificationService.markAsRead(
                                      n._id || n.id,
                                    );
                                    setNotifications((prev) =>
                                      prev.map((x) =>
                                        x._id === n._id || x.id === n.id
                                          ? { ...x, read: true }
                                          : x,
                                      ),
                                    );
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                className="text-xs text-blue-600"
                              >
                                Mark
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const detail =
                                      await notificationService.getNotificationById(
                                        n._id || n.id,
                                      );
                                    // Show full details in a new tab or route - for now navigate if route present else alert
                                    if (
                                      detail &&
                                      (detail.route ||
                                        detail.url ||
                                        detail.link)
                                    ) {
                                      navigate(
                                        detail.route ||
                                          detail.url ||
                                          detail.link,
                                      );
                                      setShowNotifications(false);
                                    } else {
                                      // simple modal fallback
                                      alert(JSON.stringify(detail, null, 2));
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                className="text-xs text-slate-600"
                              >
                                Details
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden border border-blue-200">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-700 leading-none">
                    {user?.fullname || "Admin User"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {user?.role || "Administrator"}
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform ${showProfileDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showProfileDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        User Account
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <User size={16} /> My Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate("/settings/set-inv");
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <Settings size={16} /> Settings
                    </button>
                    <div className="h-px bg-slate-50 my-1"></div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {(activeAccessRequest || activeAccessNotification) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Access Request
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    You have an invitation
                  </h2>
                </div>
                <button
                  onClick={() => {
                    if (activeAccessRequest) {
                      handleAccessRequestResponse(activeAccessRequest._id, "rejected");
                    } else {
                      openAccessRequestCenter();
                    }
                  }}
                  disabled={activeAccessRequest && respondingAccessId === activeAccessRequest._id}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                  title="Reject request"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-slate-700">
                  {activeAccessRequest
                    ? `${
                        activeAccessRequest.requesterId?.fullname ||
                        activeAccessRequest.requesterEmail
                      } is requesting ${activeAccessRequest.permissionLevel} access to your account.`
                    : activeAccessNotification?.message ||
                      activeAccessNotification?.remark ||
                      "Someone is requesting access to your account."}
                </p>
                {activeAccessRequest?.reason && (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {activeAccessRequest.reason}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                {activeAccessRequest ? (
                  <>
                    <button
                      onClick={() =>
                        handleAccessRequestResponse(activeAccessRequest._id, "rejected")
                      }
                      disabled={respondingAccessId === activeAccessRequest._id}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() =>
                        handleAccessRequestResponse(activeAccessRequest._id, "approved")
                      }
                      disabled={respondingAccessId === activeAccessRequest._id}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      <Check size={16} />
                      Approve
                    </button>
                  </>
                ) : (
                  <button
                    onClick={openAccessRequestCenter}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  >
                    Open Request Center
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!activeAccessRequest && !activeAccessNotification && activeInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Organisation Invite
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    You have an invite
                  </h2>
                </div>
                <button
                  onClick={() =>
                    handleInviteResponse(
                      activeInvite._id || activeInvite.id,
                      "rejected",
                    )
                  }
                  disabled={respondingInviteId === (activeInvite._id || activeInvite.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                  title="Reject invitation"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-slate-700">
                  {activeInvite.message ||
                    activeInvite.remark ||
                    "You have been invited to join another organisation."}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Accepting will switch your account to the invited organisation.
                </p>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                <button
                  onClick={() =>
                    handleInviteResponse(
                      activeInvite._id || activeInvite.id,
                      "rejected",
                    )
                  }
                  disabled={respondingInviteId === (activeInvite._id || activeInvite.id)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() =>
                    handleInviteResponse(
                      activeInvite._id || activeInvite.id,
                      "accepted",
                    )
                  }
                  disabled={respondingInviteId === (activeInvite._id || activeInvite.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  <Check size={16} />
                  Accept Invite
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session Banner */}
        {isDelegatedSession && user?.email && (
          <SessionBanner
            delegatedUserEmail={user.email}
            onReturnToOriginal={() => {
              dispatch(endDelegatedSession());
              navigate("/dashboard/dash-overview");
            }}
          />
        )}

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              {/* Dashboard */}
              <Route path="/dashboard/dash-overview" element={<Dashboard />} />
              <Route
                path="/dashboard/dash-approvals"
                element={<DashboardApprovals />}
              />
              <Route
                path="/dashboard/dash-expiry"
                element={<DashboardExpiry />}
              />
              <Route
                path="/dashboard/dash-movement"
                element={<DashboardMovement />}
              />
              <Route
                path="/dashboard/dash-warehouse"
                element={<DashboardWarehouse />}
              />
              <Route
                path="/dashboard/dash-in-out"
                element={<DashboardInOut />}
              />
              <Route
                path="/dashboard/dash-valuation"
                element={<RealTimeValuationView />}
              />
              <Route
                path="/dashboard/dash-low-stock"
                element={
                  <LowStockAlerts />
                }
              />
              <Route
                path="/dashboard/dash-overstock"
                element={
                  <OverstockAlerts />
                }
              />

              {/* Product Master */}
              <Route
                path="/product-master/pm-master"
                element={<ItemMaster />}
              />
              <Route
                path="/product-master/pm-variants"
                element={<ItemVariantPage />}
              />
              <Route
                path="/product-master/pm-categories"
                element={<CategoryView />}
              />
              <Route path="/product-master/pm-brand" element={<BrandView />} />
              <Route path="/product-master/pm-uom" element={<UomView />} />
              <Route path="/product-master/pm-hsn" element={<HsnView />} />
              <Route
                path="/product-master/pm-attributes"
                element={<AttributeView />}
              />
              <Route
                path="/product-master/pm-pricing"
                element={<ItemPricingView />}
              />
              <Route
                path="/product-master/pm-reorder"
                element={<ReorderLevelView />}
              />
              <Route
                path="/product-master/pm-barcode"
                element={<BarcodeMappingView />}
              />

              {/* Warehouse Management */}
              <Route
                path="/warehouse/wm-master"
                element={<WarehouseMasterView />}
              />
              <Route
                path="/warehouse/wm-location"
                element={<BinManagementView />}
              />
              <Route
                path="/warehouse/wm-zone"
                element={<ZoneStructureView />}
              />
              <Route
                path="/warehouse/wm-multi"
                element={<MultiWarehouseView />}
              />
              <Route path="/warehouse/wm-inter" element={<StockTransfer />} />
              <Route
                path="/warehouse/wm-capacity"
                element={<WarehouseCapacityView />}
              />

              {/* Inward / Procurement */}
              <Route
                path="/inward/in-req"
                element={<PurchaseRequisitionView />}
              />
              <Route path="/inward/in-po" element={<PurchaseOrderView />} />
              <Route path="/inward/in-grn" element={<GRNView />} />
              <Route path="/inward/in-qc" element={<QualityCheckView />} />
              <Route path="/inward/in-putaway" element={<PutAwayView />} />
              <Route path="/inward/in-return" element={<InwardReturnView />} />
              <Route
                path="/inward/in-invoice"
                element={<InvoiceMatchingView />}
              />

              {/* Outward / Dispatch */}
              <Route path="/outward/out-so" element={<SalesOrderView />} />
              <Route
                path="/outward/out-pick"
                element={<OutwardOpsView stage="pick" />}
              />
              <Route
                path="/outward/out-pack"
                element={<OutwardOpsView stage="pack" />}
              />
              <Route
                path="/outward/out-challan"
                element={<OutwardOpsView stage="challan" />}
              />
              <Route
                path="/outward/out-dispatch"
                element={<OutwardOpsView stage="dispatch" />}
              />
              <Route path="/outward/out-eway" element={<EWayBillsView />} />
              <Route path="/outward/out-return" element={<SalesReturnView />} />
              <Route
                path="/outward/out-invoice"
                element={<CustomerInvoiceView />}
              />

              {/* Stock Movement */}
              <Route path="/movement/mv-transfer" element={<StockTransfer />} />
              <Route
                path="/movement/mv-internal"
                element={<InternalMovementView />}
              />
              <Route
                path="/movement/mv-adj"
                element={<StockAdjustmentView />}
              />
              <Route
                path="/movement/mv-damage"
                element={<StockAdjustmentView />}
              />
              <Route
                path="/movement/mv-scrap"
                element={<ScrapManagementView />}
              />
              <Route
                path="/movement/mv-consign"
                element={<ConsignmentStockView />}
              />

              {/* Dispatch & Compliance */}
              <Route
                path="/compliance/comp-reserve"
                element={<StockReservationView />}
              />
              <Route
                path="/compliance/comp-deduct"
                element={<StockLedgerView />}
              />
              <Route path="/compliance/comp-cogs" element={<COGSView />} />
              <Route
                path="/compliance/comp-invoice"
                element={<CustomerInvoiceView />}
              />
              <Route path="/compliance/comp-eway" element={<EWayBillsView />} />

              {/* Stock Control */}
              <Route
                path="/control/ctrl-ledger"
                element={<StockLedgerView />}
              />
              <Route
                path="/control/ctrl-batch"
                element={<BatchTrackingView />}
              />
              <Route
                path="/control/ctrl-serial"
                element={<SerialTrackingView />}
              />
              <Route
                path="/control/ctrl-expiry"
                element={<ExpiryTrackingView />}
              />
              <Route
                path="/control/ctrl-reserve"
                element={<StockReservationView />}
              />
              <Route
                path="/control/ctrl-safety"
                element={<ReorderLevelView />}
              />
              <Route
                path="/control/ctrl-valuation"
                element={<ValuationMethodsView />}
              />

              {/* Inventory Valuation */}
              <Route
                path="/valuation/val-method"
                element={<ValuationMethodsView />}
              />
              <Route
                path="/valuation/val-item"
                element={<ItemWiseValuationView />}
              />
              <Route
                path="/valuation/val-wh"
                element={<WarehouseValuationView />}
              />
              <Route
                path="/valuation/val-realtime"
                element={<RealTimeValuationView />}
              />
              <Route
                path="/valuation/val-closing"
                element={<ClosingStockReportView />}
              />
              <Route
                path="/valuation/val-recalc"
                element={<CostRecalculationView />}
              />
              <Route path="/valuation/val-cogs" element={<COGSView />} />

              {/* Barcode & Automation */}
              <Route
                path="/barcode/bc-gen"
                element={<BarcodeGeneratorView />}
              />
              <Route path="/barcode/bc-qr" element={<BarcodeGeneratorView />} />
              <Route path="/barcode/bc-scan" element={<BarcodeScannerView />} />
              <Route
                path="/barcode/bc-mobile"
                element={<BarcodeScannerView isMobileMode={true} />}
              />
              <Route path="/barcode/bc-label" element={<LabelPrintingView />} />
              <Route
                path="/barcode/bc-rfid"
                element={<RfidIntegrationView />}
              />

              {/* Quality Management */}
              <Route
                path="/quality/qm-param"
                element={<QualityParametersView />}
              />
              <Route
                path="/quality/qm-plan"
                element={<InspectionPlansView />}
              />
              <Route
                path="/quality/qm-check"
                element={<QualityChecklistsView />}
              />
              <Route
                path="/quality/qm-stock"
                element={<AcceptedRejectedStockView />}
              />
              <Route
                path="/quality/qm-rework"
                element={<ReworkManagementView />}
              />
              <Route path="/quality/qm-ncr" element={<NCRView />} />

              {/* Documents */}
              <Route path="/documents/doc-inv" element={<InvoicesView />} />
              <Route path="/documents/doc-chal" element={<ChallansDocView />} />
              <Route path="/documents/doc-eway" element={<EWayBillsView />} />
              <Route
                path="/documents/doc-pack"
                element={<PackingListsDocView />}
              />
              <Route
                path="/documents/doc-insp"
                element={<InspectionReportsDocView />}
              />
              <Route
                path="/documents/doc-ver"
                element={<DocumentVersionsView />}
              />

              {/* Returns */}
              <Route
                path="/returns/ret-purchase"
                element={<PurchaseReturnMgmtView />}
              />
              <Route
                path="/returns/ret-sales"
                element={<SalesReturnMgmtView />}
              />
              <Route
                path="/returns/ret-replace"
                element={<ReplacementHandlingView />}
              />
              <Route
                path="/returns/ret-notes"
                element={<DebitCreditNotesView />}
              />

              {/* Customer Stock */}
              <Route
                path="/customer/cs-consign"
                element={<ConsignmentStockView />}
              />
              <Route
                path="/customer/cs-loc"
                element={<ConsignmentStockView />}
              />
              <Route
                path="/customer/cs-ret"
                element={<ConsignmentStockView />}
              />

              {/* Vendor Management */}
              <Route path="/vendor/vm-master" element={<VendorMasterView />} />
              <Route
                path="/vendor/vm-price"
                element={<VendorPriceListView />}
              />
              <Route
                path="/vendor/vm-lead"
                element={<LeadTimeManagementView />}
              />
              <Route
                path="/vendor/vm-perf"
                element={<VendorPerformanceView />}
              />
              <Route
                path="/vendor/vm-approved"
                element={<ApprovedVendorListView />}
              />

              {/* Approvals */}
              <Route
                path="/approvals/app-pur"
                element={<PurchaseApprovalView />}
              />
              <Route path="/approvals/app-grn" element={<GRNApprovalView />} />
              <Route
                path="/approvals/app-adj"
                element={<StockAdjustmentApprovalView />}
              />
              <Route
                path="/approvals/app-trans"
                element={<TransferApprovalView />}
              />
              <Route
                path="/approvals/app-ret"
                element={<ReturnApprovalView />}
              />

              {/* Settings */}
              <Route
                path="/settings/set-inv"
                element={<SettingsView defaultTab="inventory" />}
              />
              <Route
                path="/settings/set-rule"
                element={<SettingsView defaultTab="autoreorder" />}
              />
              <Route
                path="/settings/set-tax"
                element={<SettingsView defaultTab="tax" />}
              />
              <Route
                path="/settings/set-num"
                element={<SettingsView defaultTab="number" />}
              />
              <Route
                path="/settings/set-field"
                element={<SettingsView defaultTab="custom" />}
              />
              <Route
                path="/settings/set-flow"
                element={<SettingsView defaultTab="workflow" />}
              />

              {/* Audit */}
              <Route path="/audit/aud-stock" element={<StockAuditView />} />
              <Route path="/audit/aud-cycle" element={<CycleCountView />} />
              <Route
                path="/audit/aud-phy"
                element={
                  <PhysicalVerificationView
                    sessionId=""
                    onBack={() => navigate("/dashboard/dash-overview")}
                  />
                }
              />
              <Route
                path="/audit/aud-hist"
                element={<AdjustmentHistoryView />}
              />
              <Route path="/audit/aud-log" element={<UserActivityLogView />} />

              {/* Reports */}
              <Route
                path="/reports/rep-summ"
                element={<StockSummaryReportView />}
              />
              <Route
                path="/reports/rep-item"
                element={<ItemStockReportView />}
              />
              <Route path="/reports/rep-wh" element={<WarehouseReportView />} />
              <Route
                path="/reports/rep-aging"
                element={<AgingAnalysisView />}
              />
              <Route
                path="/reports/rep-exp"
                element={<ExpiryAnalysisReportView />}
              />
              <Route
                path="/reports/rep-move"
                element={<MovementAnalysisReportView />}
              />
              <Route
                path="/reports/rep-val"
                element={<ValuationReportDocView />}
              />
              <Route path="/reports/rep-gst" element={<GstTaxReportView />} />
              <Route path="/reports/rep-audit" element={<AuditReportView />} />

              {/* Users & Access */}
              <Route path="/users/usr-mgmt" element={<UserManagementView />} />

              {/* Profile */}
              <Route path="/profile" element={<ProfileView />} />

              {/* Global Search */}
              <Route path="/search" element={<SearchResultsPage />} />

              {/* Fallback */}
              <Route
                path="*"
                element={
                  <GenericView title={activeLabel} parent={parentLabel} />
                }
              />
            </Routes>
          </div>
        </main>
      </div>

      {showAiModal && (
        <AiAssistantModal onClose={() => setShowAiModal(false)} />
      )}
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default App;
