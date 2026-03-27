import { create } from 'zustand';
import api from '../lib/axios';

const useOrderStore = create((set) => ({
    orders: [],
    selectedOrder: null,
    loading: false,
    error: null,

    fetchOrders: async (status = null, options = {}) => {
        const { silent = false } = options;
        if (!silent) {
            set({ loading: true, error: null });
        }
        try {
            const url = status ? `/api/Order?status=${status}` : '/api/Order';
            const response = await api.get(url);
            set({ orders: response.data.data, loading: false });
        } catch (error) {
            set({
                orders: [],
                error: error.response?.data?.message || 'Failed to fetch orders',
                loading: false
            });
        }
    },

    fetchOrderById: async (orderId, options = {}) => {
        const { silent = false } = options;
        if (!silent) {
            set({ loading: true, error: null, selectedOrder: null });
        } else {
            set({ error: null });
        }
        try {
            const response = await api.get(`/api/Order/${orderId}`);
            set({ selectedOrder: response.data.data, loading: false });
            return { success: true, data: response.data.data };
        } catch (error) {
            set({
                selectedOrder: silent ? null : null,
                error: error.response?.data?.message || 'Failed to fetch order details',
                loading: false
            });
            return { success: false, error: error.response?.data?.message };
        }
    },

    clearSelectedOrder: () => set({ selectedOrder: null, error: null }),
    clear: () => set({ orders: [], selectedOrder: null, error: null, loading: false }),

    requestCancellation: async (orderId, reason = null) => {
        set({ loading: true, error: null });
        try {
            await api.post(`/api/Order/${orderId}/cancel-request`, {
                reason
            });

            const response = await api.get('/api/Order');
            set({ orders: response.data.data, loading: false });
            return { success: true };
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Failed to request cancellation',
                loading: false
            });
            return { success: false, error: error.response?.data?.message };
        }
    },

    cancelOrder: async (orderId) => {
        return useOrderStore.getState().requestCancellation(orderId, null);
    }
}));

export default useOrderStore;

