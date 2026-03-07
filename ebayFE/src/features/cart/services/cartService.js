import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
});

export const cartService = {
    getCart: async () => {
        const response = await api.get('/cart');
        return response.data;
    },

    addToCart: async (productId, quantity) => {
        const response = await api.post('/cart/add', { productId, quantity });
        return response.data;
    },

    updateCartItem: async (productId, quantity) => {
        const response = await api.put(`/cart/update/${productId}`, { quantity });
        return response.data;
    },

    removeFromCart: async (productId) => {
        const response = await api.delete(`/cart/remove/${productId}`);
        return response.data;
    },

    syncCart: async (items) => {
        const response = await api.post('/cart/sync', { items });
        return response.data;
    },

    clearCart: async () => {
        const response = await api.delete('/cart/clear');
        return response.data;
    }
};
