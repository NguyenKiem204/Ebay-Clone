import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../lib/axios';
import { Eye, EyeOff } from 'lucide-react';

const schema = yup.object({
    newPassword: yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters'),
    confirmPassword: yup.string()
        .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
        .required('Confirm password is required'),
}).required();

export default function ResetPasswordForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data) => {
        if (!token) {
            setError('Invalid or missing reset token.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await api.post('/api/Auth/reset-password', {
                token,
                newPassword: data.newPassword
            });
            navigate('/login?reset=true');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may be expired.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputBase = (hasError) => `w-full px-4 py-3 border rounded-lg text-base outline-none transition-all ${hasError
            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-400 focus:border-[#3665F3] focus:ring-2 focus:ring-[#3665F3]/20 hover:border-gray-600'
        }`;

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

            <div>
                <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    New password
                </label>
                <div className="relative">
                    <input
                        id="reset-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className={`${inputBase(errors.newPassword)} pr-12`}
                        {...register("newPassword")}
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
                {errors.newPassword && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.newPassword.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm new password
                </label>
                <div className="relative">
                    <input
                        id="reset-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className={`${inputBase(errors.confirmPassword)} pr-12`}
                        {...register("confirmPassword")}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                        tabIndex={-1}
                    >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                {errors.confirmPassword && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#3665F3] text-white font-medium text-base rounded-full hover:bg-[#382aef] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
                {isLoading ? 'Resetting...' : 'Reset password'}
            </button>
        </form>
    );
}
