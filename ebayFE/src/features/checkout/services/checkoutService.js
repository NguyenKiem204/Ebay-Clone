import api from '../../../lib/axios';

const inFlightGuestEligibilityRequests = new Map();

export const checkoutService = {
    getShippingAddresses: async () => {
        const response = await api.get('/api/Address');
        return response.data; // ApiResponse<List<AddressResponseDto>>
    },

    createShippingAddress: async (addressData) => {
        const response = await api.post('/api/Address', addressData);
        return response.data; // ApiResponse<AddressResponseDto>
    },

    evaluateGuestEligibility: async (eligibilityData) => {
        const key = JSON.stringify(eligibilityData || {});
        if (inFlightGuestEligibilityRequests.has(key)) {
            return inFlightGuestEligibilityRequests.get(key);
        }

        const requestPromise = api
            .post('/api/checkout/guest/eligibility', eligibilityData)
            .then((response) => response.data)
            .finally(() => {
                inFlightGuestEligibilityRequests.delete(key);
            });

        inFlightGuestEligibilityRequests.set(key, requestPromise);
        return requestPromise; // ApiResponse<GuestCheckoutEligibilityResponseDto>
    },

    placeGuestOrder: async (orderData) => {
        const response = await api.post('/api/checkout/guest/orders', orderData);
        return response.data; // ApiResponse<CreateGuestOrderResponseDto>
    },

    lookupGuestOrder: async (lookupData) => {
        const response = await api.post('/api/checkout/guest/orders/lookup', lookupData);
        return response.data; // ApiResponse<GuestOrderLookupResponseDto>
    },

    resendGuestOrderConfirmation: async (lookupData) => {
        const response = await api.post('/api/checkout/guest/orders/resend-confirmation', lookupData);
        return response.data; // ApiResponse<string>
    },

    placeOrder: async (orderData) => {
        const response = await api.post('/api/Order', orderData);
        return response.data; // ApiResponse<OrderResponseDto>
    },

    reviewMemberCheckout: async (orderData) => {
        const response = await api.post('/api/Order/review', orderData);
        return response.data; // ApiResponse<MemberCheckoutReviewResponseDto>
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
    },

    failPaypalOrder: async (paypalOrderId) => {
        const response = await api.post(`/api/Paypal/fail-order/${paypalOrderId}`);
        return response.data;
    }
};
