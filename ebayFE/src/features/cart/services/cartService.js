import api from '../../../lib/axios';

export const cartService = {
    getCart: async () => {
        const response = await api.get('/api/Cart');
        return response.data; // ApiResponse<CartResponseDto>
    },

    addToCart: async (productId, quantity) => {
        const response = await api.post('/api/Cart/items', { productId, quantity });
        return response.data;
    },

    updateCartItem: async (productId, quantity) => {
        const response = await api.put(`/api/Cart/items/${productId}`, { quantity });
        return response.data;
    },

    removeFromCart: async (productId) => {
        const response = await api.delete(`/api/Cart/items/${productId}`);
        return response.data;
    },

    mergeCart: async (guestItems) => {
        // guestItems should be List<AddToCartRequestDto>
        const response = await api.post('/api/Cart/merge', guestItems);
        return response.data;
    },

    clearCart: async () => {
        const response = await api.delete('/api/Cart');
        return response.data;
    }
};
