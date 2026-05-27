import api from "./api";

export const notificationService = {
  async getNotifications() {
    const res = await api.get("/notifications/list");
    return res.data;
  },

  async getPendingInvites() {
    const res = await api.get("/notifications/invites/pending");
    return res.data;
  },

  async markAsRead(notificationId: string) {
    const res = await api.post(`/notifications/mark-read`, { notificationId });
    return res.data;
  },

  async markAllAsRead(receiverId?: string) {
    let rId = receiverId;
    if (!rId) {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          rId = user._id || user.id;
        }
      } catch (e) {
        console.error("Failed to get user for markAllAsRead", e);
      }
    }
    const res = await api.post(`/notifications/mark-all-read`, { receiverId: rId });
    return res.data;
  },

  async getNotificationById(id: string) {
    const res = await api.get(`/notifications/${id}`);
    return res.data;
  },

  async sendInvite(email: string, permissions?: Record<string, {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  }>) {
    const res = await api.post("/notifications/invite", { email, permissions });
    return res.data;
  },

  async respondToInvite(notificationId: string, response: "accepted" | "rejected") {
    const res = await api.post("/notifications/invite/respond", {
      notificationId,
      response,
    });
    return res.data;
  },
};
