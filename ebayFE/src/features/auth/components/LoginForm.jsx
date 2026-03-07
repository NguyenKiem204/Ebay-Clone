import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import useAuthStore from '../../../store/useAuthStore';
import { Eye, EyeOff } from 'lucide-react';

const schema = yup.object({
    email: yup.string().required('Email or username is required'),
    password: yup.string().required('Password is required'),
}).required();

export default function LoginForm() {
    const navigate = useNavigate();
    const login = useAuthStore(state => state.login);
    const socialLogin = useAuthStore(state => state.socialLogin);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const googleLoginTrigger = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            setError(null);
            try {
                const userInfo = await axios.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
                );

                const socialData = {
                    email: userInfo.data.email,
                    firstName: userInfo.data.given_name || 'Social',
                    lastName: userInfo.data.family_name || 'User',
                    provider: 'Google',
                    providerId: userInfo.data.sub,
                    avatarUrl: userInfo.data.picture,
                    accessToken: tokenResponse.access_token
                };

                await socialLogin(socialData);
                navigate('/');
            } catch (err) {
                console.error('Google Auth Error:', err);
                setError('Xác thực với Google thất bại. Vui lòng thử lại.');
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => setError('Đăng nhập Google thất bại')
    });

    const handleSocialLogin = async (provider) => {
        if (provider.toLowerCase() === 'google') {
            googleLoginTrigger();
            return;
        }

        setIsLoading(true);
        setError(null);

        const mockData = {
            email: `user_${provider.toLowerCase()}@example.com`,
            firstName: provider.charAt(0).toUpperCase() + provider.slice(1),
            lastName: 'User',
            provider: provider,
            providerId: `mock_${provider}_id_${Math.random().toString(36).slice(2, 9)}`,
            avatarUrl: `https://avatar.iran.liara.run/username?username=${provider}`
        };

        try {
            await socialLogin(mockData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập bằng ' + provider);
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError(null);
        const result = await login(data.email, data.password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
            setIsLoading(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                    <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Email field */}
            <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email or username
                </label>
                <input
                    id="login-email"
                    type="text"
                    autoComplete="email"
                    className={`w-full px-4 py-3 border rounded-lg text-base outline-none transition-all ${errors.email
                            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-400 focus:border-[#3665F3] focus:ring-2 focus:ring-[#3665F3]/20 hover:border-gray-600'
                        }`}
                    placeholder=""
                    {...register("email")}
                />
                {errors.email && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
                )}
            </div>

            {/* Password field */}
            <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                </label>
                <div className="relative">
                    <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        className={`w-full px-4 py-3 pr-12 border rounded-lg text-base outline-none transition-all ${errors.password
                                ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                                : 'border-gray-400 focus:border-[#3665F3] focus:ring-2 focus:ring-[#3665F3]/20 hover:border-gray-600'
                            }`}
                        placeholder=""
                        {...register("password")}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                {errors.password && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
                )}
            </div>

            {/* Stay signed in + Forgot password */}
            <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input type="checkbox" className="peer sr-only" defaultChecked />
                        <div className="w-5 h-5 border-2 border-gray-400 rounded bg-white transition-all peer-checked:bg-[#3665F3] peer-checked:border-[#3665F3] group-hover:border-[#3665F3]" />
                        <svg
                            className="absolute inset-0 w-3.5 h-3.5 m-auto text-white opacity-0 transition-opacity peer-checked:opacity-100 pointer-events-none"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <span className="text-sm text-gray-700 select-none">Stay signed in</span>
                </label>

                <Link to="/forgot-password" className="text-sm text-[#3665F3] hover:text-[#382aef] hover:underline">
                    Forgot password?
                </Link>
            </div>

            {/* Sign in button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#3665F3] text-white font-medium text-base rounded-full hover:bg-[#382aef] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-2"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                    </div>
                ) : 'Sign in'}
            </button>

            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-gray-500 uppercase tracking-wider">or</span>
                </div>
            </div>

            {/* Social buttons - vertical list for login page usually */}
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-400 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <button
                    type="button"
                    onClick={() => handleSocialLogin('facebook')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-400 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                    Continue with Facebook
                </button>

                <button
                    type="button"
                    onClick={() => handleSocialLogin('apple')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-400 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Continue with Apple
                </button>
            </div>
        </form>
    );
}
