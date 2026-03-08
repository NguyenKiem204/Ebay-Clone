import { create } from 'zustand';
import api from '../lib/axios';

const useProductStore = create((set) => ({
    latestProducts: [],
    bestDeals: [],
    trendingProducts: [],
    banners: [],
    searchResults: [],
    totalItems: 0,
    currentProduct: null,
    loading: false,
    error: null,

    fetchLandingPage: async () => {
        set({ loading: true });
        try {
            const response = await api.get('/api/Product/landing');
            const { data } = response.data;
            set({
                banners: data.banners || [],
                latestProducts: data.latestProducts,
                bestDeals: data.bestDeals,
                trendingProducts: data.trendingProducts,
                loading: false
            });
        } catch (error) {
            set({ error: 'Failed to fetch landing page products', loading: false });
        }
    },

    searchProducts: async (params) => {
        set({ loading: true });
        try {
            const response = await api.get('/api/Product', { params });
            const { data } = response.data;
            set({
                searchResults: data.items,
                totalItems: data.totalItems,
                loading: false
            });
        } catch (error) {
            set({ error: 'Search failed', loading: false });
        }
    },

    fetchProductById: async (id) => {
        set({ loading: true, currentProduct: null });
        try {
            const response = await api.get(`/api/Product/${id}`);
            const { data } = response.data;
            set({ currentProduct: data, loading: false });
        } catch (error) {
            set({ error: 'Failed to fetch product details', loading: false });
        }
    },

    fetchProductBySlug: async (slug) => {
        set({ loading: true, currentProduct: null });
        try {
            const response = await api.get(`/api/Product/slug/${slug}`);
            const { data } = response.data;
            set({ currentProduct: data, loading: false });
        } catch (error) {
            set({ error: 'Failed to fetch product details', loading: false });
        }
    }
}));

export default useProductStore;
