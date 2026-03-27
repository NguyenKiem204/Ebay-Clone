import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

function normalizeBaseUrl(rawUrl) {
    const fallback = 'http://localhost:5000';
    const candidate = String(rawUrl || fallback).trim();

    return candidate
        .replace(/\/+$/, '')
        .replace(/(\/api)+$/i, '');
}

function normalizeRequestUrl(url) {
    if (typeof url !== 'string') {
        return url;
    }

    return url.replace(/^\/api\/api\//i, '/api/');
}

export const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    config.url = normalizeRequestUrl(config.url);
    return config;
});

// Response interceptor for automatic refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const currentPath = typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : '/';

        if (error.response?.status === 429 && error.response?.data?.captchaRequired) {
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/verify')) {
                const redirect = encodeURIComponent(currentPath);
                window.location.assign(`/verify?redirect=${redirect}`);
            }
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = useAuthStore.getState().refreshToken;

            if (refreshToken) {
                try {
                    const response = await axios.post(
                        `${BASE_URL}/api/Auth/refresh-token`,
                        { refreshToken },
                        { withCredentials: true }
                    );

                    const { data } = response.data;
                    useAuthStore.getState().setRefreshToken(data.refreshToken);

                    return api(originalRequest);
                } catch (refreshError) {
                    useAuthStore.getState().logout();
                    return Promise.reject(refreshError);
                }
            }

            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default api;
