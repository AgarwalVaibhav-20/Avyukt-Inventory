import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { notificationService } from "@/services/notificationService";
import { delegatedAccessService } from "@/services/delegatedAccessService";
import { fetchProfile } from "@/store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Bell,
  Check,
  X,
  ChevronRight,
  Info,
  Calendar,
  User,
  Building2,
  Shield,
  ArrowRight,
  Search,
  Sparkles,
  Clock,
  Inbox,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

const getSenderName = (notif: any) => {
  if (!notif) return "System";
  
  if (notif.senderId && typeof notif.senderId === "object") {
    return notif.senderId.fullname || notif.senderId.email || "System";
  }
  
  const msg = notif.body || notif.message || notif.remark || "";
  
  if (notif.type === "access_approved" && msg.includes(" approved your access request")) {
    return msg.split(" approved your access request")[0];
  }
  if (notif.type === "access_rejected" && msg.includes(" rejected your access request")) {
    return msg.split(" rejected your access request")[0];
  }
  if (notif.type === "access_request" && msg.includes(" wants access")) {
    return msg.split(" wants access")[0];
  }
  if (notif.type === "invite" && msg.includes(" has invited you")) {
    return msg.split(" has invited you")[0];
  }

  if (msg.includes(" is requesting ")) {
    return msg.split(" is requesting ")[0];
  }
  
  if (notif.senderId && typeof notif.senderId === "string") {
    return "User (" + notif.senderId.substring(0, 6) + ")";
  }
  
  return "System";
};

interface NotificationsPageProps {
  filterType?: "all" | "invites" | "alerts";
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ filterType = "all" }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const currentUserId = String(user?._id || user?.id || "");

  // States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingAccessRequests, setPendingAccessRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "invites" | "alerts" | "unread">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Sync prop filterType with tab
  useEffect(() => {
    if (filterType === "invites") {
      setActiveTab("invites");
    } else if (filterType === "alerts") {
      setActiveTab("alerts");
    } else {
      setActiveTab("all");
    }
  }, [filterType]);

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

  const fetchAllData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
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
      console.error("Failed to load notifications page data", err);
      toast.error("Failed to sync notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [isAuthenticated]);

  // Actions
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true, status: "read" } : n))
      );
      toast.success("Notification marked as read");
      if (selectedNotif && (selectedNotif._id === id || selectedNotif.id === id)) {
        setSelectedNotif((prev: any) => ({ ...prev, read: true, status: "read" }));
      }
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, status: "read" })));
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleInviteResponse = async (id: string, response: "accepted" | "rejected", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionLoadingId(id);
    try {
      const result = await notificationService.respondToInvite(id, response);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id || n.id === id
            ? { ...n, read: true, status: "read", inviteResponse: response }
            : n
        )
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
        toast.success("Invitation accepted successfully!");
      } else {
        toast.success("Invitation rejected");
      }
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to respond to invitation`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAccessResponse = async (id: string, response: "approved" | "rejected", e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionLoadingId(id);
    try {
      if (response === "approved") {
        await delegatedAccessService.approveAccess(id);
        toast.success("Access request approved!");
      } else {
        await delegatedAccessService.rejectAccess(id, "Rejected from Notification Center");
        toast.success("Access request rejected");
      }
      setPendingAccessRequests((prev) => prev.filter((r) => r._id !== id));
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to respond to access request`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Stats calculation
  const totalCount = notifications.length + pendingAccessRequests.length;
  const unreadCount = notifications.filter((n) => !n.read && n.status !== "read").length;

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

  const invitesCount = pendingInvites.length + pendingAccessRequests.length;
  const alertsCount = notifications.filter(
    (n) => n.type !== "invite" && n.type !== "access_request" && !n.read && n.status !== "read"
  ).length;

  // Filter & Search implementation
  const filteredNotifications = React.useMemo(() => {
    let list = [...notifications];

    if (activeTab === "invites") {
      list = list.filter((n) => n.type === "invite" || n.type === "access_request");
    } else if (activeTab === "alerts") {
      list = list.filter((n) => n.type !== "invite" && n.type !== "access_request");
    } else if (activeTab === "unread") {
      list = list.filter((n) => !n.read && n.status !== "read");
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (n) =>
          (n.title || n.subject || "").toLowerCase().includes(q) ||
          (n.body || n.message || n.remark || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [notifications, activeTab, searchTerm]);

  // Combine active pending access requests when in "All" or "Invites" tab
  const showAccessRequests = activeTab === "all" || activeTab === "invites";

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "invite":
        return <Building2 className="text-emerald-500" size={20} />;
      case "access_request":
        return <Shield className="text-indigo-500" size={20} />;
      case "low_stock_raw_material":
      case "low_stock_product":
        return <AlertCircle className="text-rose-500" size={20} />;
      case "batch_expiry":
      case "deadline_reminder":
        return <Clock className="text-amber-500" size={20} />;
      default:
        return <Bell className="text-slate-400" size={20} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-8rem)] gap-6 p-1">
      {/* Main List Area */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Page Title & Bulk Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              Notification Center <Sparkles className="text-indigo-500 w-5 h-5 animate-pulse" />
            </h1>
            <p className="text-sm text-slate-500">
              Manage organization invites, delegated access requests, and warehouse alerts.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="self-start sm:self-auto flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-indigo-100 transition-all active:scale-[0.98]"
            >
              <Check size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-2xl border border-indigo-100 shadow-sm transition-transform hover:-translate-y-0.5">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Total Inbox</p>
            <p className="text-2xl font-black text-indigo-900 mt-1">{totalCount}</p>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 rounded-2xl border border-rose-100 shadow-sm transition-transform hover:-translate-y-0.5">
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Unread Messages</p>
            <p className="text-2xl font-black text-rose-900 mt-1">{unreadCount}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-2xl border border-emerald-100 shadow-sm transition-transform hover:-translate-y-0.5">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Invitations</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{invitesCount}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-2xl border border-amber-100 shadow-sm transition-transform hover:-translate-y-0.5">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Stock Alerts</p>
            <p className="text-2xl font-black text-amber-900 mt-1">{alertsCount}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
          {/* Glassmorphic Tabs */}
          <div className="flex items-center p-1 bg-slate-50 rounded-xl w-full md:w-auto">
            {(["all", "invites", "alerts", "unread"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none text-xs font-bold px-4 py-2 rounded-lg transition-all capitalize ${
                  activeTab === tab
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab === "invites" ? "Invitations" : tab === "alerts" ? "System Alerts" : tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 md:ml-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-700 pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white placeholder-slate-400 transition-all"
            />
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin-slow rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-xs text-slate-500 mt-4">Fetching your notification mailbox...</p>
          </div>
        ) : filteredNotifications.length === 0 && (!showAccessRequests || pendingAccessRequests.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
              <Inbox size={20} />
            </div>
            <p className="text-sm font-bold text-slate-700">Inbox Clean & Clear</p>
            <p className="text-xs text-slate-400 mt-1">No notifications matching the active filters were found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* 1. Show Delegated Access Requests first (High Priority) */}
            {showAccessRequests &&
              pendingAccessRequests.map((req) => (
                <div
                  key={req._id}
                  onClick={() => setSelectedNotif({ ...req, type: "access_request" })}
                  className="group relative flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/70 shadow-sm transition-all hover:shadow cursor-pointer animate-in fade-in slide-in-from-top-1"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="text-indigo-600" size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                          Delegated Access Request
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      </div>
                      <p className="text-sm font-black text-slate-800 mt-1">
                        {req.requesterId?.fullname || req.requesterEmail} wants access
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        Reason: {req.reason || "No reason specified."}
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-400">
                        <Calendar size={12} />
                        Requested on {new Date(req.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 md:mt-0 self-end md:self-auto border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
                    <button
                      onClick={(e) => handleAccessResponse(req._id, "rejected", e)}
                      disabled={actionLoadingId === req._id}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-3.5 py-2 rounded-xl transition-all disabled:opacity-50"
                    >
                      <X size={14} /> Reject
                    </button>
                    <button
                      onClick={(e) => handleAccessResponse(req._id, "approved", e)}
                      disabled={actionLoadingId === req._id}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                    >
                      <Check size={14} /> {actionLoadingId === req._id ? "Approving..." : "Approve"}
                    </button>
                  </div>
                </div>
              ))}

            {/* 2. Show Standard Notifications list */}
            {filteredNotifications.map((notif) => {
              const isUnread = !notif.read && notif.status !== "read";
              const isInvite = notif.type === "invite";
              const isInvitePending = isInvite && notif.inviteResponse === "pending";

              return (
                <div
                  key={notif._id || notif.id}
                  onClick={() => setSelectedNotif(notif)}
                  className={`group relative flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                    isUnread
                      ? "bg-slate-50 border-slate-200/80 shadow-sm"
                      : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  {/* Left Side Indicator bar for Unread */}
                  {isUnread && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-600 rounded-r-full"></div>
                  )}

                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        isUnread ? "bg-white border-slate-100" : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isInvite ? "text-emerald-600" : "text-slate-500"
                          }`}
                        >
                          {notif.type ? notif.type.replace(/_/g, " ") : "General"}
                        </span>
                        {isUnread && (
                          <span className="bg-indigo-600 text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                            New
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 break-words leading-tight ${isUnread ? "font-black text-slate-800" : "font-semibold text-slate-700"}`}>
                        {notif.title || notif.subject || (isInvite ? "Organization Invitation" : "Notification")}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {notif.body || notif.message || notif.remark || (notif.materialData && JSON.stringify(notif.materialData))}
                      </p>

                      <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(notif.createdAt || notif.created).toLocaleString()}
                        </span>
                        {notif.senderId && (
                          <span className="flex items-center gap-1 border-l border-slate-200 pl-3">
                            <User size={12} />
                            Sender: {getSenderName(notif)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center gap-2 mt-4 md:mt-0 self-end md:self-auto border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto justify-end">
                    {isInvitePending ? (
                      <>
                        <button
                          onClick={(e) => handleInviteResponse(notif._id || notif.id, "rejected", e)}
                          disabled={actionLoadingId === (notif._id || notif.id)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all disabled:opacity-50"
                        >
                          <X size={14} /> Decline
                        </button>
                        <button
                          onClick={(e) => handleInviteResponse(notif._id || notif.id, "accepted", e)}
                          disabled={actionLoadingId === (notif._id || notif.id)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-100 disabled:opacity-50"
                        >
                          <Check size={14} /> Accept Invite
                        </button>
                      </>
                    ) : (
                      <>
                        {isInvite && notif.inviteResponse && (
                          <span
                            className={`text-xs font-black px-3 py-1.5 rounded-xl border capitalize ${
                              notif.inviteResponse === "accepted"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-rose-50 text-rose-700 border-rose-100"
                            }`}
                          >
                            {notif.inviteResponse}
                          </span>
                        )}

                        {isUnread && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif._id || notif.id, e)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/30 px-3 py-2 rounded-xl transition-all"
                          >
                            Mark Read
                          </button>
                        )}
                        <ChevronRight className="text-slate-400 group-hover:text-slate-600 transition-colors hidden md:block" size={16} />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Side Details Drawer */}
      {selectedNotif && (
        <div className="w-full lg:w-96 bg-white rounded-3xl border border-slate-100 shadow-xl p-6 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notification Detail</p>
              <h2 className="text-sm font-black text-slate-800 mt-0.5">Details Pane</h2>
            </div>
            <button
              onClick={() => setSelectedNotif(null)}
              className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg border border-transparent hover:border-slate-100 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Details Body */}
          <div className="flex-1 overflow-y-auto space-y-5">
            <div>
              <p className="text-xs font-bold text-slate-400">Title</p>
              <p className="text-sm font-black text-slate-800 mt-1">
                {selectedNotif.title || selectedNotif.subject || (selectedNotif.type === "invite" ? "Organization Invitation" : "Notification")}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400">Message</p>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80 mt-1 whitespace-pre-wrap">
                {selectedNotif.body || selectedNotif.message || selectedNotif.remark || (selectedNotif.type === "access_request" && `Wants ${selectedNotif.permissionLevel} access.`)}
              </p>
            </div>

            {/* Table of Details */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
              <div className="grid grid-cols-3 border-b border-slate-50 bg-slate-50 p-2.5 font-bold text-slate-500">
                <div className="col-span-1">Attribute</div>
                <div className="col-span-2">Value</div>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-50 p-2.5">
                <div className="col-span-1 text-slate-400">Type</div>
                <div className="col-span-2 font-semibold capitalize text-slate-700">{selectedNotif.type || "General"}</div>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-50 p-2.5">
                <div className="col-span-1 text-slate-400">Status</div>
                <div className="col-span-2">
                  <span
                    className={`font-semibold capitalize ${
                      selectedNotif.read || selectedNotif.status === "read" ? "text-slate-400" : "text-rose-600 font-bold"
                    }`}
                  >
                    {selectedNotif.read || selectedNotif.status === "read" ? "Read" : "Unread"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-50 p-2.5">
                <div className="col-span-1 text-slate-400">Created</div>
                <div className="col-span-2 text-slate-600">
                  {new Date(selectedNotif.createdAt || selectedNotif.created).toLocaleString()}
                </div>
              </div>
              {selectedNotif.senderId && (
                <div className="grid grid-cols-3 border-b border-slate-50 p-2.5">
                  <div className="col-span-1 text-slate-400">Sender</div>
                  <div className="col-span-2 text-slate-600">
                    {getSenderName(selectedNotif)}
                  </div>
                </div>
              )}
              {selectedNotif.route && (
                <div className="grid grid-cols-3 border-b border-slate-50 p-2.5">
                  <div className="col-span-1 text-slate-400">Route Link</div>
                  <div className="col-span-2 text-slate-600 font-medium break-all">{selectedNotif.route}</div>
                </div>
              )}
            </div>

            {/* Invite specific details */}
            {selectedNotif.type === "invite" && selectedNotif.metadata?.permissions && (
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                <p className="text-xs font-bold text-slate-500">Access Permissions Included</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Object.entries(selectedNotif.metadata.permissions).map(([pageId, permission]: any) => (
                    <span
                      key={pageId}
                      className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200"
                    >
                      {pageId} : {permission?.edit || permission?.delete ? "Edit/Delete" : "View only"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions for Detail Panel */}
            <div className="space-y-2 pt-4">
              {selectedNotif.type === "invite" && selectedNotif.inviteResponse === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleInviteResponse(selectedNotif._id || selectedNotif.id, "rejected", e)}
                    className="flex-1 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                  >
                    Decline Invite
                  </button>
                  <button
                    onClick={(e) => handleInviteResponse(selectedNotif._id || selectedNotif.id, "accepted", e)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all"
                  >
                    Accept Invite
                  </button>
                </div>
              )}

              {selectedNotif.type === "access_request" && (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleAccessResponse(selectedNotif._id, "rejected", e)}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold py-2.5 rounded-xl transition-all"
                  >
                    Reject Access
                  </button>
                  <button
                    onClick={(e) => handleAccessResponse(selectedNotif._id, "approved", e)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100"
                  >
                    Approve Access
                  </button>
                </div>
              )}

              {selectedNotif.route && (
                <button
                  onClick={() => {
                    navigate(selectedNotif.route);
                    setSelectedNotif(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100"
                >
                  Go to Action Page <ArrowRight size={14} />
                </button>
              )}

              {!selectedNotif.read && selectedNotif.status !== "read" && selectedNotif.type !== "invite" && selectedNotif.type !== "access_request" && (
                <button
                  onClick={(e) => handleMarkAsRead(selectedNotif._id || selectedNotif.id, e)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all border border-slate-200/50"
                >
                  Mark as Read
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
