import api from '../../../lib/axios';

const reviewService = {
    getOrderEligibility: async (orderId) => {
        const response = await api.get(`/api/Reviews/order/${orderId}/eligibility`);
        return response.data.data;
    },

    getProductReviews: async (productId, params = {}) => {
        const response = await api.get(`/api/Reviews/product/${productId}`, { params });
        return response.data.data;
    },

    getDashboard: async () => {
        const response = await api.get('/api/Reviews/me/dashboard');
        return response.data.data;
    },

    createProductReview: async (payload) => {
        const response = await api.post('/api/Reviews', payload);
        return response.data.data;
    },

    updateProductReview: async (id, payload) => {
        const response = await api.put(`/api/Reviews/${id}`, payload);
        return response.data.data;
    },

    uploadReviewMedia: async (id, files) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        const response = await api.post(`/api/Reviews/${id}/media`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.data;
    },

    removeReviewMedia: async (id, mediaUrl) => {
        const response = await api.delete(`/api/Reviews/${id}/media`, {
            params: { mediaUrl }
        });
        return response.data.data;
    },

    markHelpful: async (id) => {
        const response = await api.post(`/api/Reviews/${id}/helpful`);
        return response.data.data;
    },

    unmarkHelpful: async (id) => {
        const response = await api.delete(`/api/Reviews/${id}/helpful`);
        return response.data.data;
    },

    reportReview: async (id, payload) => {
        const response = await api.post(`/api/Reviews/${id}/report`, payload);
        return response.data;
    },

    getSellerReceivedReviews: async () => {
        const response = await api.get('/api/Reviews/seller/received');
        return response.data.data;
    },

    replyToReview: async (id, payload) => {
        const response = await api.post(`/api/Reviews/${id}/seller-reply`, payload);
        return response.data.data;
    },

    createSellerFeedback: async (payload) => {
        const response = await api.post('/api/Feedback', payload);
        return response.data.data;
    },

    updateSellerFeedback: async (id, payload) => {
        const response = await api.put(`/api/Feedback/${id}`, payload);
        return response.data.data;
    }
};

export default reviewService;
