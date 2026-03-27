import { create } from 'zustand';
import api from '../lib/axios';

const useCategoryStore = create((set) => ({
    categories: [],
    navGroups: [], // new state
    loading: false,
    error: null,

    fetchCategories: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/api/Category');
            const { data } = response.data;
            set({ categories: data, error: null, loading: false });
        } catch (error) {
            set({ error: 'Failed to fetch categories', loading: false });
        }
    },

    fetchNavGroups: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/api/Category/nav');
            const { data } = response.data;
            set({ navGroups: data, error: null, loading: false });
        } catch (error) {
            set({ error: 'Failed to fetch nav groups', loading: false });
        }
    }
}));

export default useCategoryStore;
