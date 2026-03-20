import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

export const BASE_URL = 'http://localhost:5276';

const api = axios.create({
    baseURL: 'http://localhost:5276',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
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
                        `${api.defaults.baseURL}/api/Auth/refresh-token`,
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
