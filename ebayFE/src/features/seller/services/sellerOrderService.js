import api from '../../../lib/axios';

const sellerOrderService = {
    async getMyOrders() {
        const response = await api.get('/api/seller/orders');
        return response.data?.data || [];
    },

    async getOrderById(orderId) {
        const response = await api.get(`/api/seller/orders/${orderId}`);
        return response.data?.data;
    },

    async upsertTracking(orderId, payload) {
        const response = await api.put(`/api/seller/orders/${orderId}/tracking`, payload);
        return response.data?.data;
    },

    async updateShipmentStatus(orderId, status) {
        const response = await api.put(`/api/seller/orders/${orderId}/shipment-status`, { status });
        return response.data?.data;
    },

    async approveCancellationRequest(requestId, sellerResponse = null) {
        const response = await api.put(`/api/seller/orders/cancellation-requests/${requestId}/approve`, {
            sellerResponse
        });

        return response.data?.data;
    },

    async rejectCancellationRequest(requestId, sellerResponse = null) {
        const response = await api.put(`/api/seller/orders/cancellation-requests/${requestId}/reject`, {
            sellerResponse
        });

        return response.data?.data;
    }
};

export default sellerOrderService;
