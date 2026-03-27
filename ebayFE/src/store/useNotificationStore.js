import { create } from 'zustand';
import api from '../lib/axios';

const useNotificationStore = create((set, get) => ({
    items: [],
    unreadCount: 0,
    loading: false,

    fetchNotifications: async (limit = 8) => {
        set({ loading: true });
        try {
            const response = await api.get(`/api/Notifications?limit=${limit}`);
            const payload = response.data?.data;

            set({
                items: payload?.items || [],
                unreadCount: payload?.unreadCount || 0,
                loading: false
            });
        } catch {
            set({ items: [], unreadCount: 0, loading: false });
        }
    },

    markAsRead: async (notificationId) => {
        const nextItems = get().items.map((item) => (
            item.id === notificationId ? { ...item, isRead: true } : item
        ));
        const nextUnreadCount = nextItems.filter((item) => !item.isRead).length;
        set({ items: nextItems, unreadCount: nextUnreadCount });

        try {
            await api.post(`/api/Notifications/${notificationId}/read`);
        } catch {
            await get().fetchNotifications();
        }
    },

    markAllAsRead: async () => {
        const nextItems = get().items.map((item) => ({ ...item, isRead: true }));
        set({ items: nextItems, unreadCount: 0 });

        try {
            await api.post('/api/Notifications/mark-all-read');
        } catch {
            await get().fetchNotifications();
        }
    },

    clear: () => set({ items: [], unreadCount: 0, loading: false })
}));

export default useNotificationStore;
