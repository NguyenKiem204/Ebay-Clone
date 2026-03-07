import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
});

export const checkoutService = {
    getShippingAddresses: async () => {
        const response = await api.get('/user/addresses');
        return response.data;
    },

    placeOrder: async (orderData) => {
        const response = await api.post('/orders', orderData);
        return response.data;
    },

    applyCoupon: async (code) => {
        const response = await api.post('/promo/apply', { code });
        return response.data;
    }
};
