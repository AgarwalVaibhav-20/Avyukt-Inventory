import api from "./api";

export const notificationService = {
  async getNotifications() {
    const res = await api.get("/notifications/list");
    return res.data;
  },

  async markAsRead(notificationId: string) {
    const res = await api.post(`/notifications/mark-read`, { id: notificationId });
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
};
