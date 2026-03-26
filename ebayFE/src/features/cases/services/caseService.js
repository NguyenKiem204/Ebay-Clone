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
    }
};

export default caseService;
