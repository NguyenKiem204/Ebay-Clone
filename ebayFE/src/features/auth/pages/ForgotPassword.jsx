import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Mail, Lock, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';

const emailSchema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
}).required();

const otpSchema = yup.object({
    otp: yup.string().length(6, 'OTP must be 6 digits').required('OTP is required'),
}).required();

const resetSchema = yup.object({
    newPassword: yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
    confirmPassword: yup.string()
        .oneOf([yup.ref('newPassword'), null], 'Passwords do not match')
        .required('Confirm password is required'),
}).required();

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const forgotPassword = useAuthStore(state => state.forgotPassword);
    const verifyResetOtp = useAuthStore(state => state.verifyResetOtp);
    const resetPassword = useAuthStore(state => state.resetPassword);

    const emailForm = useForm({
        resolver: yupResolver(emailSchema)
    });

    const otpForm = useForm({
        resolver: yupResolver(otpSchema)
    });

    const resetForm = useForm({
        resolver: yupResolver(resetSchema)
    });

    const handleEmailSubmit = async (data) => {
        setIsLoading(true);
        setError(null);
        const result = await forgotPassword(data.email);
        if (result.success) {
            setEmail(data.email);
            setStep(2);
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    const handleOtpVerify = async (data) => {
        setIsLoading(true);
        setError(null);
        const result = await verifyResetOtp(email, data.otp);
        if (result.success) {
            setOtp(data.otp);
            setStep(3);
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    const handleResetSubmit = async (data) => {
        setIsLoading(true);
        setError(null);
        const result = await resetPassword({
            email,
            otp,
            newPassword: data.newPassword
        });
        if (result.success) {
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    if (isSuccess) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset successful!</h2>
                    <p className="text-gray-600 mb-8">
                        Your password has been updated. You will be redirected to the login page in a few seconds.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-3.5 bg-[#3665F3] text-white font-medium rounded-full hover:bg-[#382aef] transition-colors"
                    >
                        Login now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-50 text-[#3665F3] rounded-full flex items-center justify-center mx-auto mb-4">
                        {step === 1 ? <KeyRound size={32} /> : step === 2 ? <Mail size={32} /> : <Lock size={32} />}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {step === 1 ? 'Forgot password?' : step === 2 ? 'Verify OTP' : 'New password'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {step === 1 
                            ? 'Enter your email to receive an OTP code to reset your password.'
                            : step === 2
                            ? `We have sent a verification code to ${email}`
                            : 'Enter a new password for your account'
                        }
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-shake">
                        <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none transition-all ${
                                        emailForm.formState.errors.email 
                                        ? 'border-red-500 ring-2 ring-red-100' 
                                        : 'border-gray-300 focus:border-[#3665F3] focus:ring-2 focus:ring-[#3665F3]/10'
                                    }`}
                                    placeholder="your@email.com"
                                    {...emailForm.register('email')}
                                />
                            </div>
                            {emailForm.formState.errors.email && (
                                <p className="mt-1.5 text-xs text-red-600 font-medium">
                                    {emailForm.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-[#3665F3] text-white font-bold rounded-xl hover:bg-[#382aef] transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Send verification code'
                            )}
                        </button>

                        <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#3665F3] transition-colors font-medium">
                            <ArrowLeft size={16} />
                            Back to login
                        </Link>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={otpForm.handleSubmit(handleOtpVerify)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-center w-full">Enter OTP (6 digits)</label>
                            <input
                                type="text"
                                maxLength={6}
                                className={`w-full px-4 py-3 border rounded-xl text-center text-2xl font-bold tracking-[0.5em] outline-none transition-all ${
                                    otpForm.formState.errors.otp 
                                    ? 'border-red-500 ring-2 ring-red-100' 
                                    : 'border-gray-300 focus:border-[#3665F3] focus:ring-2 focus:ring-[#3665F3]/10'
                                }`}
                                placeholder="000000"
                                {...otpForm.register('otp')}
                            />
                            {otpForm.formState.errors.otp && (
                                <p className="mt-1.5 text-xs text-red-600 font-medium text-center">
                                    {otpForm.formState.errors.otp.message}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-[#3665F3] text-white font-bold rounded-xl hover:bg-[#382aef] transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Verify OTP code'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#3665F3] transition-colors font-medium mt-2"
                        >
                            <ArrowLeft size={16} />
                            Back to Email input
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none transition-all ${
                                        resetForm.formState.errors.newPassword 
                                        ? 'border-red-500 ring-2 ring-red-100' 
                                        : 'border-gray-300 focus:border-[#3665F3] focus:ring-2 focus:ring-[#3665F3]/10'
                                    }`}
                                    placeholder="••••••••"
                                    {...resetForm.register('newPassword')}
                                />
                            </div>
                            {resetForm.formState.errors.newPassword && (
                                <p className="mt-1.5 text-xs text-red-600 font-medium">
                                    {resetForm.formState.errors.newPassword.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <ShieldCheck size={18} />
                                </div>
                                <input
                                    type="password"
                                    className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none transition-all ${
                                        resetForm.formState.errors.confirmPassword 
                                        ? 'border-red-500 ring-2 ring-red-100' 
                                        : 'border-gray-300 focus:border-[#3665F3] focus:ring-2 focus:ring-[#3665F3]/10'
                                    }`}
                                    placeholder="••••••••"
                                    {...resetForm.register('confirmPassword')}
                                />
                            </div>
                            {resetForm.formState.errors.confirmPassword && (
                                <p className="mt-1.5 text-xs text-red-600 font-medium">
                                    {resetForm.formState.errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-[#3665F3] text-white font-bold rounded-xl hover:bg-[#382aef] transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Reset password'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
