import React, { useState, useEffect } from "react";
import { MENU_ITEMS } from "@/constants";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Menu as MenuIcon,
  X,
  Box,
  User as UserIcon,
} from "lucide-react";
import { MenuItem } from "@/types";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchItems } from "@/store/slices/inventorySlice";
import { fetchStockControlData } from "@/store/slices/stockControlSlice";
import {
  fetchPRs,
  fetchPOs,
  fetchQCQueue,
} from "@/store/slices/procurementSlice";
import { notificationService } from "@/services/notificationService";

interface SidebarProps {
  activeMenuId: string;
  onMenuSelect: (id: string, parentLabel?: string, childLabel?: string) => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

const hasPermissionMap = (permissions: any) =>
  permissions && typeof permissions === "object" && Object.keys(permissions).length > 0;

const canViewPage = (permissions: any, pageId: string) =>
  !hasPermissionMap(permissions) || permissions?.[pageId]?.view === true;

const Sidebar: React.FC<SidebarProps> = ({
  activeMenuId,
  onMenuSelect,
  isOpen,
  setIsOpen,
}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isDelegatedSession, isAuthenticated, delegatedPermissionLevel } = useAppSelector((state) => state.auth);
  const { items } = useAppSelector((state) => state.inventory);
  const { expiryBatches } = useAppSelector((state) => state.stockControl);
  const { prs, pos, qcQueue } = useAppSelector((state) => state.procurement);

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

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

    const fetchList = async () => {
      try {
        const [data, inviteData] = await Promise.all([
          notificationService.getNotifications(),
          notificationService.getPendingInvites(),
        ]);
        setNotifications(
          mergeNotifications(
            normalizeNotificationList(data),
            normalizeNotificationList(inviteData),
          ),
        );
      } catch (err) {
        console.warn("Failed to poll sidebar notifications", err);
      }
    };

    fetchList();
    const interval = setInterval(fetchList, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const currentUserId = String(user?._id || user?.id || "");
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

  const alertCounts = {
    "dash-low-stock": items.filter(
      (item) => item.stock < (item.reorderLevel || 0),
    ).length,
    "dash-overstock": items.filter(
      (item) => item.maximumStockLevel && item.stock > item.maximumStockLevel,
    ).length,
    "dash-expiry": expiryBatches.length,
    "dash-approvals":
      prs.filter((p) => p.status === "Pending Approval").length +
      pos.filter((p) => p.status === "Pending Approval").length +
      qcQueue.length,
    "notif-all": notifications.filter(n => !n.read && n.status !== "read").length,
    "notif-invites": pendingInvites.length + pendingAccessNotifications.length,
    "notif-alerts": notifications.filter(n => n.type !== "invite" && n.type !== "access_request" && !n.read && n.status !== "read").length,
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    dispatch(fetchItems());
    dispatch(fetchStockControlData());
    dispatch(fetchPRs());
    dispatch(fetchPOs());
    dispatch(fetchQCQueue());
  }, [dispatch, isAuthenticated]);

  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(
    new Set(["dashboard"]),
  );
  const [searchTerm, setSearchTerm] = useState("");

  const visibleMenuItems = React.useMemo(() => {
    let items = MENU_ITEMS;
    const role = user?.role || 'employee';
    const isDelegatedView = isDelegatedSession && delegatedPermissionLevel === 'view';
    const hasExplicitPermissions = hasPermissionMap(user?.permissions) && !isDelegatedView;

    if (hasExplicitPermissions) {
      items = items
        .map((item) => ({
          ...item,
          subMenus: (item.subMenus || []).filter((sub) =>
            canViewPage(user?.permissions, sub.id),
          ),
        }))
        .filter((item) => item.subMenus && item.subMenus.length > 0);
    }

    if (!isDelegatedView) {
      if (!hasExplicitPermissions && role === 'user') {
        items = items.filter(item => ['dashboard', 'documents', 'reports', 'notifications'].includes(item.id));
      } else if (!hasExplicitPermissions && role === 'employee') {
        items = items.filter(item => !['users', 'settings', 'audit', 'advanced', 'approvals'].includes(item.id));
      } else if (!hasExplicitPermissions && role === 'manager') {
        items = items.filter(item => !['advanced'].includes(item.id));
      }
    }

    if (isDelegatedSession) {
      items = items.filter((item) => item.id !== "users");
    }

    // Hide 'users' (User & Access) menu item if the user is not an admin
    if (user?.role !== 'admin') {
      items = items.filter((item) => item.id !== "users");
    }

    return items;
  }, [user?.role, user?.permissions, isDelegatedSession, delegatedPermissionLevel]);

  useEffect(() => {
    const activeParent = visibleMenuItems.find((item) =>
      item.subMenus?.some((sub) => sub.id === activeMenuId),
    );

    if (activeParent) {
      setExpandedMenus(new Set([activeParent.id]));
    }
  }, [activeMenuId, visibleMenuItems]);

  const toggleExpand = (item: MenuItem) => {
    const isExpanded = expandedMenus.has(item.id);

    setExpandedMenus((current) =>
      current.has(item.id) ? new Set() : new Set([item.id]),
    );

    if (!isExpanded && item.subMenus?.length) {
      const firstSubMenu = item.subMenus[0];
      const path = `/${item.id}/${firstSubMenu.id}`;

      if (location.pathname !== path) {
        onMenuSelect(firstSubMenu.id, item.label, firstSubMenu.label);
        navigate(path);
      }
    }
  };

  const filteredItems = visibleMenuItems.map((item) => {
    if (!searchTerm) return item;
    const matchesLabel = item.label
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchingSubMenus = item.subMenus?.filter((sub) =>
      sub.label.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (matchesLabel || (matchingSubMenus && matchingSubMenus.length > 0)) {
      return {
        ...item,
        subMenus: matchingSubMenus?.length ? matchingSubMenus : item.subMenus,
      };
    }
    return null;
  }).filter(Boolean) as MenuItem[];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`
        fixed top-0 left-0 z-30 h-screen w-72 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        flex flex-col border-r border-slate-800 shadow-xl
      `}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 text-white font-bold text-lg leading-tight">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Box size={20} className="text-white" />
            </div>
            <span>
              ACT <span className="text-blue-500">BUSINESS</span>
              <br />
              <span className="text-xs font-medium text-slate-400">
                SOLUTION
              </span>
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800"
            title="Hide Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-slate-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search menus..."
              className="w-full bg-slate-800 text-sm text-slate-200 pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-4">
          {filteredItems.map((item) => {
            const Icon = item.icon!;
            const isExpanded = expandedMenus.has(item.id) || !!searchTerm;
            const isActiveParent = item.subMenus?.some(
              (sub) => sub.id === activeMenuId,
            );
            const hasAlert = item.subMenus?.some(
              (sub) => (alertCounts as any)[sub.id] > 0,
            );

            return (
              <div key={item.id} className="mb-1">
                <a
                  href="javascript:void(0)"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleExpand(item);
                  }}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors
                    ${isActiveParent ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={
                        isActiveParent ? "text-blue-400" : "text-slate-500"
                      }
                    />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasAlert && !isExpanded && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                    {item.subMenus &&
                      (isExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      ))}
                  </div>
                </a>

                {item.subMenus && isExpanded && (
                  <div className="ml-9 mt-1 space-y-0.5 border-l border-slate-700 pl-2">
                    {item.subMenus.map((sub) => {
                      const path = `/${item.id}/${sub.id}`;
                      const isSubActive = location.pathname === path;

                      return (
                        <Link
                          key={sub.id}
                          to={path}
                          onClick={() => {
                            onMenuSelect(sub.id, item.label, sub.label);
                            if (window.innerWidth < 768) setIsOpen(false);
                          }}
                          className={`
                            block w-full text-left py-2 px-3 rounded-md text-sm transition-colors relative
                            ${
                              isSubActive
                                ? "bg-blue-600/10 text-blue-400 font-medium"
                                : "text-slate-400 hover:text-slate-200"
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span>{sub.label}</span>
                            {(alertCounts as any)[sub.id] > 0 && (
                              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                {(alertCounts as any)[sub.id]}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-700">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={18} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.fullname || "Admin User"}
              </p>
              <p className="text-xs text-slate-500 truncate capitalize">
                {user?.role || "Warehouse Mgr"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
