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
    relatedProducts: [],
    loading: false,
    error: null,

    // Seller-specific state
    sellerProducts: [],
    sellerTotalItems: 0,
    sellerTotalPages: 0,
    sellerLoading: false,

    fetchRelatedProducts: async (id) => {
        try {
            const response = await api.get(`/api/Product/${id}/related`);
            const { data } = response.data;
            set({ relatedProducts: data || [] });
        } catch (error) {
            console.error('Failed to fetch related products', error);
        }
    },

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
            return { success: true, data };
        } catch (error) {
            set({ error: 'Failed to fetch product details', loading: false });
            return { success: false, error: error.response?.data?.message || 'Failed to fetch product' };
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
    },

    // ========== SELLER PRODUCT MANAGEMENT ==========

    fetchSellerProducts: async (params = {}) => {
        set({ sellerLoading: true });
        try {
            const response = await api.get('/api/Product/seller/me', { params });
            const { data } = response.data;
            set({
                sellerProducts: data.items || [],
                sellerTotalItems: data.totalItems || 0,
                sellerTotalPages: data.totalPages || 0,
                sellerLoading: false
            });
            return { success: true, data };
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to fetch seller products';
            set({ sellerLoading: false });
            return { success: false, error: errorMsg };
        }
    },

    createProduct: async (formData) => {
        set({ sellerLoading: true });
        try {
            const response = await api.post('/api/Product', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const { data, message } = response.data;
            set({ sellerLoading: false });
            return { success: true, data, message };
        } catch (error) {
            const apiRes = error.response?.data;
            const errorMsg = apiRes?.message || 'Failed to create product';
            set({ sellerLoading: false });
            return { success: false, error: errorMsg, errors: apiRes?.errors };
        }
    },

    updateProduct: async (id, formData) => {
        set({ sellerLoading: true });
        try {
            const response = await api.put(`/api/Product/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const { data, message } = response.data;
            set({ sellerLoading: false });
            return { success: true, data, message };
        } catch (error) {
            const apiRes = error.response?.data;
            const errorMsg = apiRes?.message || 'Failed to update product';
            set({ sellerLoading: false });
            return { success: false, error: errorMsg, errors: apiRes?.errors };
        }
    },

    toggleProductVisibility: async (id) => {
        try {
            const response = await api.patch(`/api/Product/${id}/toggle-visibility`);
            const { data, message } = response.data;
            // Update the product in the local list
            set((state) => ({
                sellerProducts: state.sellerProducts.map(p =>
                    p.id === id ? { ...p, isActive: data.isActive } : p
                )
            }));
            return { success: true, data, message };
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to toggle visibility';
            return { success: false, error: errorMsg };
        }
    },

    deleteProduct: async (id) => {
        try {
            const response = await api.delete(`/api/Product/${id}`);
            const { message } = response.data;
            // Remove from local list
            set((state) => ({
                sellerProducts: state.sellerProducts.filter(p => p.id !== id),
                sellerTotalItems: state.sellerTotalItems - 1
            }));
            return { success: true, message };
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to delete product';
            return { success: false, error: errorMsg };
        }
    }
}));

export default useProductStore;
