import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

// Response interceptor for automatic refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

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
        }
        return Promise.reject(error);
    }
);

export default api;
