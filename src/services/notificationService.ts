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

  async markAllAsRead() {
    const res = await api.post(`/notifications/mark-all-read`);
    return res.data;
  },
  async getNotificationById(id: string) {
    const res = await api.get(`/notifications/${id}`);
    return res.data;
  },

  async sendInvite(email: string) {
    const res = await api.post("/notifications/invite", { email });
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
