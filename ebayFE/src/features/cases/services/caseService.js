import api from '../../../lib/axios';

const detailPathByKind = {
    return: (id) => `/api/cases/returns/${id}`,
    dispute: (id) => `/api/cases/disputes/${id}`,
};

const caseService = {
    async getCases() {
        const response = await api.get('/api/cases');
        return response.data?.data || [];
    },

    async getCaseDetail(caseKind, caseId) {
        const normalizedKind = caseKind?.toLowerCase();
        const detailPathFactory = detailPathByKind[normalizedKind];

        if (!detailPathFactory) {
            throw new Error('Unsupported case type.');
        }

        const response = await api.get(detailPathFactory(caseId));
        return response.data?.data;
    },

    async escalateReturnRequest(returnRequestId, description) {
        const response = await api.post(`/api/disputes/escalate/returns/${returnRequestId}`, {
            description
        });

        return response.data?.data;
    },

    async cancelReturnRequest(returnRequestId, note = '') {
        const response = await api.post(`/api/cases/returns/${returnRequestId}/cancel`, { note });
        return response.data?.data;
    },

    async submitReturnTracking(returnRequestId, payload) {
        const response = await api.post(`/api/cases/returns/${returnRequestId}/tracking`, payload);
        return response.data?.data;
    },

    async cancelInrClaim(disputeId, note = '') {
        const response = await api.post(`/api/cases/disputes/${disputeId}/cancel`, { note });
        return response.data?.data;
    },

    async escalateInrClaim(disputeId, description) {
        const response = await api.post(`/api/cases/disputes/${disputeId}/escalate`, { description });
        return response.data?.data;
    }
};

export default caseService;
