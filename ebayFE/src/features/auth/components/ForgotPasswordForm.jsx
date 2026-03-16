import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import api from '../../../lib/axios';
import { Mail } from 'lucide-react';

const schema = yup.object({
    email: yup.string().email('Please enter a valid email address').required('Email is required'),
}).required();

export default function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState(null);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.post('/api/Auth/forgot-password', data);
            setIsSent(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <div className="text-center space-y-4 py-4">
                <Mail size={48} className="text-[#3665F3] mx-auto" />
                <h3 className="text-xl font-normal text-gray-900">Check your email</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                    If an account exists for that email, we've sent instructions to reset your password.
                </p>
                <Link
                    to="/login"
                    className="inline-block w-full py-3.5 bg-[#3665F3] text-white font-medium text-base rounded-full hover:bg-[#382aef] transition-colors text-center mt-4"
                >
                    Return to sign in
                </Link>
            </div>
        );
    }

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
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email address
                </label>
                <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    className={`w-full px-4 py-3 border rounded-lg text-base outline-none transition-all ${
                        errors.email
                            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-400 focus:border-[#3665F3] focus:ring-2 focus:ring-[#3665F3]/20 hover:border-gray-600'
                    }`}
                    {...register("email")}
                />
                {errors.email && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#3665F3] text-white font-medium text-base rounded-full hover:bg-[#382aef] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
                {isLoading ? 'Sending...' : 'Send reset link'}
            </button>

            <div className="text-center pt-2">
                <Link to="/login" className="text-sm text-[#3665F3] hover:text-[#382aef] hover:underline font-medium">
                    Back to sign in
                </Link>
            </div>
        </form>
    );
}
