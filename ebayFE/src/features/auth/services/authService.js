import api from '../../../lib/axios';

// Request interceptor to add Access Token
api.interceptors.request.use((config) => {
    // We'll get this from Zustand in the actual usage or via a trick
    // For now, it's a placeholder for the pattern
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const authService = {
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    verifyEmail: async (token) => {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        return response.data;
    },

    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    }
};

export default api;
