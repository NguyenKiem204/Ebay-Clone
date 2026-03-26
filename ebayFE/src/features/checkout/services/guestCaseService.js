import api from '../../../lib/axios';
import { checkoutService } from './checkoutService';

const STORAGE_PREFIX = 'guest-after-sales:';

const detailPathByKind = {
    return: (id) => `/api/guest/cases/returns/${id}`,
    dispute: (id) => `/api/guest/cases/disputes/${id}`,
};

const canUseSessionStorage = () => (
    typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
);

const normalizeOrderNumber = (value) => (
    typeof value === 'string' ? value.trim() : ''
);

const normalizeEmail = (value) => (
    typeof value === 'string' ? value.trim().toLowerCase() : ''
);

const isAccessTokenUsable = (expiresAt) => {
    if (!expiresAt) {
        return false;
    }

    const parsed = Date.parse(expiresAt);
    return !Number.isNaN(parsed) && parsed > Date.now();
};

const sanitizeGuestAccess = (context) => {
    const fallbackAccess = context?.order?.afterSalesAccess;
    const orderNumber = normalizeOrderNumber(context?.orderNumber || context?.order?.orderNumber);
    const email = normalizeEmail(context?.email);
    const accessToken = typeof (context?.accessToken || fallbackAccess?.accessToken) === 'string'
        ? (context?.accessToken || fallbackAccess?.accessToken).trim()
        : '';
    const expiresAt = context?.expiresAt || fallbackAccess?.expiresAt || null;
    const proofMethod = context?.proofMethod || fallbackAccess?.proofMethod || '';

    if (!orderNumber || !email) {
        return null;
    }

    return {
        orderNumber,
        email,
        accessToken,
        expiresAt,
        proofMethod
    };
};

const getStorageKey = (orderNumber) => `${STORAGE_PREFIX}${normalizeOrderNumber(orderNumber)}`;

const persistAccessFromResponse = (context, afterSalesAccess) => {
    if (!afterSalesAccess) {
        return sanitizeGuestAccess(context);
    }

    return guestCaseService.storeGuestAfterSalesAccess({
        ...context,
        accessToken: afterSalesAccess.accessToken,
        expiresAt: afterSalesAccess.expiresAt,
        proofMethod: afterSalesAccess.proofMethod
    });
};

const guestCaseService = {
    buildAccessProof(context) {
        const sanitized = sanitizeGuestAccess(context);

        if (!sanitized) {
            return {
                orderNumber: '',
                email: ''
            };
        }

        const payload = {
            orderNumber: sanitized.orderNumber,
            email: sanitized.email
        };

        if (sanitized.accessToken && isAccessTokenUsable(sanitized.expiresAt)) {
            payload.accessToken = sanitized.accessToken;
        }

        return payload;
    },

    storeGuestAfterSalesAccess(context) {
        const sanitized = sanitizeGuestAccess(context);

        if (!sanitized) {
            return null;
        }

        if (!canUseSessionStorage()) {
            return sanitized;
        }

        window.sessionStorage.setItem(getStorageKey(sanitized.orderNumber), JSON.stringify(sanitized));
        return sanitized;
    },

    getStoredGuestAfterSalesAccess(orderNumber) {
        const normalizedOrderNumber = normalizeOrderNumber(orderNumber);
        if (!normalizedOrderNumber || !canUseSessionStorage()) {
            return null;
        }

        const rawValue = window.sessionStorage.getItem(getStorageKey(normalizedOrderNumber));
        if (!rawValue) {
            return null;
        }

        try {
            const parsed = JSON.parse(rawValue);
            const sanitized = sanitizeGuestAccess(parsed);

            if (!sanitized || sanitized.orderNumber !== normalizedOrderNumber) {
                window.sessionStorage.removeItem(getStorageKey(normalizedOrderNumber));
                return null;
            }

            if (!isAccessTokenUsable(sanitized.expiresAt)) {
                return {
                    ...sanitized,
                    accessToken: '',
                    expiresAt: null
                };
            }

            return sanitized;
        } catch {
            window.sessionStorage.removeItem(getStorageKey(normalizedOrderNumber));
            return null;
        }
    },

    async reloadGuestOrder(context) {
        const payload = this.buildAccessProof(context);
        const response = await checkoutService.lookupGuestOrder(payload);
        const order = response?.data;

        if (response?.success && order?.found) {
            const guestAccess = this.storeGuestAfterSalesAccess({
                orderNumber: order.orderNumber,
                email: payload.email,
                accessToken: order.afterSalesAccess?.accessToken,
                expiresAt: order.afterSalesAccess?.expiresAt,
                proofMethod: order.afterSalesAccess?.proofMethod
            });

            return {
                order,
                guestAccess
            };
        }

        return {
            order: null,
            guestAccess: this.getStoredGuestAfterSalesAccess(payload.orderNumber)
        };
    },

    async getGuestCases(context) {
        const accessProof = this.buildAccessProof(context);
        const response = await api.post('/api/guest/cases', accessProof);
        const payload = response.data?.data || {};

        const guestAccess = persistAccessFromResponse(
            {
                ...context,
                orderNumber: accessProof.orderNumber,
                email: accessProof.email
            },
            payload.afterSalesAccess
        );

        return {
            cases: payload.cases || [],
            guestAccess
        };
    },

    async createGuestReturnRequest(context, payload) {
        const response = await api.post('/api/guest/returns', {
            ...this.buildAccessProof(context),
            ...payload
        });

        return response.data?.data;
    },

    async createGuestInrClaim(context, payload) {
        const response = await api.post('/api/guest/disputes/inr', {
            ...this.buildAccessProof(context),
            ...payload
        });

        return response.data?.data;
    },

    async createGuestQualityIssueClaim(context, payload) {
        const response = await api.post('/api/guest/disputes/quality-issue', {
            ...this.buildAccessProof(context),
            ...payload
        });

        return response.data?.data;
    },

    async getGuestCaseDetail(caseKind, caseId, context) {
        const normalizedKind = caseKind?.toLowerCase();
        const detailPathFactory = detailPathByKind[normalizedKind];

        if (!detailPathFactory) {
            throw new Error('Unsupported guest case type.');
        }

        const accessProof = this.buildAccessProof(context);
        const response = await api.post(detailPathFactory(caseId), accessProof);
        const payload = response.data?.data || {};

        const guestAccess = persistAccessFromResponse(
            {
                ...context,
                orderNumber: accessProof.orderNumber,
                email: accessProof.email
            },
            payload.afterSalesAccess
        );

        return {
            caseData: payload.case || null,
            guestAccess
        };
    }
};

export default guestCaseService;
