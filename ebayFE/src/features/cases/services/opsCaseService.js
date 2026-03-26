import api from '../../../lib/axios';

const detailPathByKind = {
    return: (id) => `/api/internal/cases/returns/${id}`,
    dispute: (id) => `/api/internal/cases/disputes/${id}`,
};

const unwrap = (response) => response.data?.data;

const opsCaseService = {
    async getQueueCases() {
        const response = await api.get('/api/internal/cases');
        return unwrap(response) || [];
    },

    async getCaseDetail(caseKind, caseId) {
        const normalizedKind = caseKind?.toLowerCase();
        const detailPathFactory = detailPathByKind[normalizedKind];

        if (!detailPathFactory) {
            throw new Error('Unsupported case type.');
        }

        const response = await api.get(detailPathFactory(caseId));
        return unwrap(response);
    },

    async approveReturn(returnRequestId, payload) {
        const response = await api.post(`/api/returns/${returnRequestId}/approve`, payload);
        return unwrap(response);
    },

    async rejectReturn(returnRequestId, payload) {
        const response = await api.post(`/api/returns/${returnRequestId}/reject`, payload);
        return unwrap(response);
    },

    async completeReturn(returnRequestId, payload) {
        const response = await api.post(`/api/returns/${returnRequestId}/complete`, payload);
        return unwrap(response);
    },

    async acknowledgeDispute(disputeId) {
        const response = await api.post(`/api/disputes/${disputeId}/acknowledge`, {});
        return unwrap(response);
    },

    async resolveDispute(disputeId, payload) {
        const response = await api.post(`/api/disputes/${disputeId}/resolve`, payload);
        return unwrap(response);
    },

    async closeDispute(disputeId, payload) {
        const response = await api.post(`/api/disputes/${disputeId}/close`, payload);
        return unwrap(response);
    }
};

export default opsCaseService;
