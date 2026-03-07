import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import useAuthStore from '../../../store/useAuthStore';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import OtpVerification from './OtpVerification';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';

const personalSchema = yup.object({
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    email: yup.string().email('Please enter a valid email address').required('Email is required'),
    password: yup.string()
        .required('Password is required')
        .min(8, 'At least 8 characters')
        .max(128, 'Password must not exceed 128 characters')
        .matches(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
        .matches(/[a-z]/, 'Password must contain at least 1 lowercase letter')
        .matches(/[0-9]/, 'Password must contain at least 1 number')
        .matches(/[@$!%*?&]/, 'Password must contain at least 1 special character (@$!%*?&)'),
}).required();

const businessSchema = yup.object({
    businessName: yup.string().required('Business name is required'),
    email: yup.string().email('Please enter a valid email address').required('Business email is required'),
    password: yup.string()
        .required('Password is required')
        .min(8, 'At least 8 characters')
        .max(128, 'Password must not exceed 128 characters')
        .matches(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
        .matches(/[a-z]/, 'Password must contain at least 1 lowercase letter')
        .matches(/[0-9]/, 'Password must contain at least 1 number')
        .matches(/[@$!%*?&]/, 'Password must contain at least 1 special character (@$!%*?&)'),
}).required();

export default function RegisterForm({ accountType, onAccountTypeChange }) {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const { socialLogin, register: authRegister } = useAuthStore(); // Renamed register to authRegister to avoid conflict
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [businessCountry, setBusinessCountry] = useState('');
    const [buyingOnly, setBuyingOnly] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const currentSchema = accountType === 'personal' ? personalSchema : businessSchema;

    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: yupResolver(currentSchema)
    });

    const googleLoginTrigger = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch user info from Google using the access token
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

    const switchTab = (type) => {
        onAccountTypeChange(type);
        setError(null);
        reset();
    };

    const handleSocialLogin = async (provider) => {
        if (provider.toLowerCase() === 'google') {
            googleLoginTrigger();
            return;
        }

        setIsLoading(true);
        setError(null);

        // Mock data for Facebook/Apple for now
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
        try {
            const cleanEmailPart = data.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
            const username = cleanEmailPart + '_' + Math.random().toString(36).slice(2, 6);
            const payload = {
                username,
                email: data.email,
                password: data.password,
                confirmPassword: data.password,
                firstName: accountType === 'personal' ? data.firstName : data.businessName,
                lastName: accountType === 'personal' ? data.lastName : '.', // Backend requires lastName, added dot for business
            };
            const result = await authRegister(payload);

            if (result.success) {
                setRegisteredEmail(payload.email);
                setShowOtp(true);
                toast.success('Registration successful! Please check your email for the OTP code.');
            } else {
                // Try to extract detailed error messages from the backend validation
                if (result.error?.errors) {
                    const errorMessages = Object.values(result.error.errors).flat().join('. ');
                    setError(errorMessages);
                } else {
                    setError(result.error || 'Registration failed');
                }
                toast.error('Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            const backendError = err.response?.data?.errors;
            if (backendError) {
                const message = Object.values(backendError).flat().join('. ');
                setError(message);
            } else {
                setError(err.response?.data?.message || 'Registration failed. Please try again.');
            }
            toast.error('An error occurred during registration');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = (hasError) =>
        `w-full px-4 py-3.5 border rounded-lg text-base outline-none transition-all placeholder-gray-500 ${hasError
            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-400 focus:border-black focus:ring-1 focus:ring-black/20 hover:border-gray-600'
        }`;

    if (showOtp) {
        return (
            <OtpVerification
                email={registeredEmail}
                onVerified={() => navigate('/login')}
                onCancel={() => setShowOtp(false)}
            />
        );
    }

    return (
        <div className="max-w-[400px] mx-auto pt-4">
            {/* Personal / Business Toggle */}
            <div className="flex mb-6 border border-gray-300 rounded-full overflow-hidden">
                <button
                    type="button"
                    onClick={() => switchTab('personal')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${accountType === 'personal'
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    Personal
                </button>
                <button
                    type="button"
                    onClick={() => switchTab('business')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${accountType === 'business'
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    Business
                </button>
            </div>

            {/* Business description text */}
            {accountType === 'business' && (
                <p className="text-sm text-gray-700 mb-5 leading-relaxed">
                    Continue to register as a <strong>business or nonprofit</strong>, or if you plan to sell a large number of goods.
                </p>
            )}

            <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} key={accountType}>
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                        <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {accountType === 'personal' ? (
                    <>
                        {/* First + Last Name */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <input
                                    type="text"
                                    autoComplete="given-name"
                                    placeholder="First name"
                                    className={inputClass(errors.firstName)}
                                    {...register("firstName")}
                                />
                                {errors.firstName && (
                                    <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
                                )}
                            </div>
                            <div>
                                <input
                                    type="text"
                                    autoComplete="family-name"
                                    placeholder="Last name"
                                    className={inputClass(errors.lastName)}
                                    {...register("lastName")}
                                />
                                {errors.lastName && (
                                    <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <input
                                type="email"
                                autoComplete="email"
                                placeholder="Email"
                                className={inputClass(errors.email)}
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Password"
                                    className={`${inputClass(errors.password)} pr-12`}
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
                                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Business Name */}
                        <div>
                            <input
                                type="text"
                                placeholder="Business name"
                                className={inputClass(errors.businessName)}
                                {...register("businessName")}
                            />
                            {errors.businessName && (
                                <p className="mt-1 text-xs text-red-600">{errors.businessName.message}</p>
                            )}
                        </div>

                        {/* Business Email */}
                        <div>
                            <input
                                type="email"
                                autoComplete="email"
                                placeholder="Business email"
                                className={inputClass(errors.email)}
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Password"
                                    className={`${inputClass(errors.password)} pr-12`}
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
                                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Country Dropdown */}
                        <div className="relative">
                            <select
                                value={businessCountry}
                                onChange={(e) => setBusinessCountry(e.target.value)}
                                className="w-full px-4 py-3.5 border border-gray-400 rounded-lg text-base outline-none transition-all appearance-none bg-white text-gray-500 focus:border-black focus:ring-1 focus:ring-black/20 hover:border-gray-600 cursor-pointer"
                            >
                                <option value="" disabled>Where is your business registered?</option>
                                <option value="VN">Vietnam</option>
                                <option value="US">United States</option>
                                <option value="UK">United Kingdom</option>
                                <option value="JP">Japan</option>
                                <option value="KR">South Korea</option>
                                <option value="SG">Singapore</option>
                                <option value="AU">Australia</option>
                                <option value="DE">Germany</option>
                                <option value="FR">France</option>
                                <option value="CA">Canada</option>
                            </select>
                            <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <p className="mt-1 text-xs text-gray-500 italic">
                                If your business isn't registered, select your country of residence.
                            </p>
                        </div>

                        {/* Buying only checkbox */}
                        <label className="flex items-start gap-3 cursor-pointer group pt-2">
                            <div className="relative flex items-center mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={buyingOnly}
                                    onChange={(e) => setBuyingOnly(e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="w-5 h-5 border-2 border-gray-400 rounded bg-white transition-all peer-checked:bg-black peer-checked:border-black group-hover:border-gray-600" />
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
                            <span className="text-sm text-gray-700 select-none">
                                I'm only interested in buying on eBay for now
                            </span>
                        </label>
                    </>
                )}

                {/* Legal text */}
                <p className="text-xs text-gray-500 leading-relaxed pt-1">
                    By selecting <span className="font-medium">Create {accountType} account</span>, you agree to our{' '}
                    <a href="https://www.ebay.com/help/policies/member-behaviour-policies/user-agreement?id=4259" target="_blank" rel="noopener noreferrer" className="text-[#3665F3] hover:underline">User Agreement</a> and acknowledge reading our{' '}
                    <a href="https://www.ebay.com/help/policies/member-behaviour-policies/user-privacy-notice-privacy-policy?id=4260" target="_blank" rel="noopener noreferrer" className="text-[#3665F3] hover:underline">User Privacy Notice</a>.
                </p>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-[#3665F3] text-white font-medium text-base rounded-full hover:bg-[#382aef] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating...
                        </div>
                    ) : `Create ${accountType} account`}
                </button>
            </form>

            {/* Divider + Social buttons - only for Personal */}
            {accountType === 'personal' && (
                <>
                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-white text-gray-500">or continue with</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleSocialLogin('google')}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-400 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>

                        <button
                            onClick={() => handleSocialLogin('apple')}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-400 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            Apple
                        </button>

                        <button
                            onClick={() => handleSocialLogin('facebook')}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-400 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                            </svg>
                            Facebook
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
