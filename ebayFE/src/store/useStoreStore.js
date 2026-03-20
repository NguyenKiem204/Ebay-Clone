import { create } from 'zustand';
import api from '../lib/axios';

const useStoreStore = create((set, get) => ({
    store: null,
    loading: false,
    error: null,

    fetchMyStore: async () => {
        set({ loading: true, error: null, validationErrors: null });
        try {
            const response = await api.get('/api/Store/me');
            const data = response.data.data;
            set({ store: data, loading: false });
            return { success: true, data };
        } catch (error) {
            if (error.response?.status === 404) {
                set({ store: null, loading: false });
                return { success: true, data: null };
            }
            const apiRes = error.response?.data;
            const errorMsg = apiRes?.message || 'Failed to fetch store info';
            set({ error: errorMsg, loading: false });
            return { success: false, error: errorMsg };
        }
    },

    fetchStoreByUserId: async (userId) => {
        if (!userId) return { success: false, error: 'User ID is required' };
        set({ loading: true, error: null });
        try {
            const response = await api.get(`/api/Store/user/${userId}`);
            const data = response.data.data;
            set({ store: data, loading: false });
            return { success: true, data };
        } catch (error) {
            if (error.response?.status === 404) {
                set({ store: null, loading: false });
                return { success: true, data: null };
            }
            const errorMsg = error.response?.data?.message || 'Failed to fetch store by user ID';
            set({ error: errorMsg, loading: false });
            return { success: false, error: errorMsg };
        }
    },

    createStore: async (storeData) => {
        set({ loading: true, error: null, validationErrors: null });
        try {
            const response = await api.post('/api/Store', storeData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const { data, message } = response.data;
            set({ store: data, loading: false });
            return { success: true, message };
        } catch (error) {
            const apiRes = error.response?.data;
            const errorMsg = apiRes?.message || 'Failed to create store';
            set({ error: errorMsg, validationErrors: apiRes?.errors || null, loading: false });
            return { success: false, error: errorMsg, errors: apiRes?.errors };
        }
    },

    updateStore: async (storeData) => {
        set({ loading: true, error: null, validationErrors: null });
        try {
            const response = await api.put('/api/Store/me', storeData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const { data, message } = response.data;
            set({ store: data, loading: false });
            return { success: true, message };
        } catch (error) {
            const apiRes = error.response?.data;
            const errorMsg = apiRes?.message || 'Failed to update store';
            set({ error: errorMsg, validationErrors: apiRes?.errors || null, loading: false });
            return { success: false, error: errorMsg, errors: apiRes?.errors };
        }
    },

    deactivateStore: async () => {
        set({ loading: true, error: null });
        try {
            await api.delete('/api/Store/me');
            set({ store: null, loading: false });
            return { success: true, message: 'Store deactivated' };
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to deactivate store';
            set({ error: errorMsg, loading: false });
            return { success: false, error: errorMsg };
        }
    }
}));

export default useStoreStore;
