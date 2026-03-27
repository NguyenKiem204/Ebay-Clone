import api from '../../../lib/axios';

const endpointByKind = {
    return: (id) => `/api/cases/returns/${id}/evidence`,
    dispute: (id) => `/api/cases/disputes/${id}/evidence`,
};

const caseEvidenceService = {
    async uploadEvidence(caseKind, caseId, payload) {
        const normalizedKind = caseKind?.toLowerCase();
        const endpointFactory = endpointByKind[normalizedKind];

        if (!endpointFactory) {
            throw new Error('Unsupported case type.');
        }

        const formData = new FormData();
        formData.append('file', payload.file);

        if (payload.label?.trim()) {
            formData.append('label', payload.label.trim());
        }

        if (payload.evidenceType?.trim()) {
            formData.append('evidenceType', payload.evidenceType.trim());
        }

        const response = await api.post(endpointFactory(caseId), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data?.data;
    },
};

export default caseEvidenceService;
