import { create } from 'zustand';
import api from '../lib/axios';

const useCategoryStore = create((set) => ({
    categories: [],
    loading: false,
    error: null,

    fetchCategories: async () => {
        set({ loading: true });
        try {
            const response = await api.get('/api/Product/categories');
            const { data } = response.data;
            set({ categories: data, loading: false });
        } catch (error) {
            set({ error: 'Failed to fetch categories', loading: false });
        }
    }
}));

export default useCategoryStore;
