import { create } from 'zustand';
import api from '../lib/axios';
import useCartStore from '../features/cart/hooks/useCartStore';

const useAuthStore = create((set) => ({
    user: null,
    refreshToken: null, // In-memory only
    isAuthenticated: false,
    loading: true,

    login: async (email, password) => {
        try {
            const response = await api.post('/api/Auth/login', { email, password });
            const { data } = response.data; // ApiResponse<AuthResponseDto>
            set({
                user: {
                    id: data.userId,
                    username: data.username,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    role: data.role
                },
                refreshToken: data.refreshToken,
                isAuthenticated: true
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Login failed' };
        }
    },

    socialLogin: async (socialData) => {
        try {
            const response = await api.post('/api/Auth/social-login', socialData);
            const { data } = response.data;
            set({
                user: {
                    id: data.userId,
                    username: data.username,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    role: data.role
                },
                refreshToken: data.refreshToken,
                isAuthenticated: true
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Social login failed' };
        }
    },

    register: async (registerData) => {
        try {
            await api.post('/api/Auth/register', registerData);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Registration failed' };
        }
    },

    verifyOtp: async (email, otp) => {
        try {
            await api.post('/api/Auth/verify-otp', { email, otp });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'OTP verification failed' };
        }
    },

    resendOtp: async (email) => {
        try {
            await api.post('/api/Auth/resend-otp', { email });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Failed to resend OTP' };
        }
    },

    forgotPassword: async (email) => {
        try {
            await api.post('/api/Auth/forgot-password', { email });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Failed to send reset code' };
        }
    },

    verifyResetOtp: async (email, otp) => {
        try {
            await api.post('/api/Auth/verify-reset-otp', { email, otp });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Invalid or expired OTP' };
        }
    },

    resetPassword: async (resetData) => {
        try {
            await api.post('/api/Auth/reset-password', resetData);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Failed to reset password' };
        }
    },

    logout: async () => {
        try {
            await api.post('/api/Auth/logout');
        } finally {
            // Clear cart to prevent leaking data to next user on same browser
            useCartStore.getState().clearCart();

            // Clear history store so next user doesn't see this user's viewed items
            const { default: useHistoryStore } = await import('../features/history/useHistoryStore');
            useHistoryStore.getState().clear();

            set({
                user: null,
                refreshToken: null,
                isAuthenticated: false
            });
        }
    },

    checkAuth: async () => {
        set({ loading: true });
        try {
            const response = await api.get('/api/Auth/me');
            const { data } = response.data;
            set({
                user: {
                    id: data.id,
                    username: data.username,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    role: data.role,
                    address: data.address
                },
                isAuthenticated: true
            });
        } catch (error) {
            // Not authenticated — clear any stale cart data
            useCartStore.getState().clearCart();
            set({ user: null, isAuthenticated: false });
        } finally {
            set({ loading: false });
        }
    },

    updateProfile: async (profileData) => {
        try {
            await api.put('/api/Auth/profile', profileData);
            // Refresh user data after update
            const response = await api.get('/api/Auth/me');
            const { data } = response.data;
            set({
                user: {
                    id: data.id,
                    username: data.username,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    role: data.role,
                    address: data.address
                }
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Update failed' };
        }
    },

    setRefreshToken: (token) => set({ refreshToken: token }),
}));

export default useAuthStore;
