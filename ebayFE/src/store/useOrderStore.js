import { create } from 'zustand';
import api from '../lib/axios';

const useOrderStore = create((set) => ({
    orders: [],
    loading: false,
    error: null,

    fetchOrders: async (status = null) => {
        set({ loading: true, error: null });
        try {
            const url = status ? `/api/Order?status=${status}` : '/api/Order';
            const response = await api.get(url);
            set({ orders: response.data.data, loading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Failed to fetch orders',
                loading: false
            });
        }
    },

    cancelOrder: async (orderId) => {
        set({ loading: true, error: null });
        try {
            await api.put(`/api/Order/${orderId}/cancel`);
            // Refresh orders after cancellation
            const response = await api.get('/api/Order');
            set({ orders: response.data.data, loading: false });
            return { success: true };
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Failed to cancel order',
                loading: false
            });
            return { success: false, error: error.response?.data?.message };
        }
    }
}));

export default useOrderStore;
