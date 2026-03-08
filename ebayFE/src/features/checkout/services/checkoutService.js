import api from '../../../lib/axios';

export const checkoutService = {
    getShippingAddresses: async () => {
        const response = await api.get('/api/Address');
        return response.data; // ApiResponse<List<AddressResponseDto>>
    },

    placeOrder: async (orderData) => {
        const response = await api.post('/api/Order', orderData);
        return response.data; // ApiResponse<OrderResponseDto>
    },

    validateCoupon: async (code, orderAmount) => {
        const response = await api.post('/api/Coupon/validate', { code, orderAmount });
        return response.data;
    },

    createPaypalOrder: async (orderId) => {
        const response = await api.post(`/api/Paypal/create-order/${orderId}`);
        return response.data;
    },

    capturePaypalOrder: async (paypalOrderId) => {
        const response = await api.post(`/api/Paypal/capture-order/${paypalOrderId}`);
        return response.data;
    }
};
