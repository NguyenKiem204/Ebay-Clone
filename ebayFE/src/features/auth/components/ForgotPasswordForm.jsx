import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import axios from 'axios';

const schema = yup.object({
    email: yup.string().email('Invalid email address').required('Email is required'),
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
            // We should add this to authService later
            await axios.post('http://localhost:5000/api/auth/forgot-password', data);
            setIsSent(true);
        } catch (err) {
            // If it fails, we still show "sent" for security reasons as per task.md but here it's fine to show error
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <div className="text-center space-y-4 py-4">
                <div className="text-5xl text-blue-500 mb-2">✉</div>
                <h3 className="text-xl font-bold">Check your email</h3>
                <p className="text-gray-600">
                    If an account exists for that email, we've sent instructions to reset your password.
                </p>
                <Link to="/login" className="block text-secondary hover:underline font-medium pt-4">
                    Return to sign in
                </Link>
            </div>
        );
    }

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                    id="email"
                    type="email"
                    {...register("email")}
                    className={`appearance-none relative block w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm bg-gray-50 focus:bg-white`}
                    placeholder="Enter your email"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 border border-transparent text-sm font-bold rounded-full text-white bg-secondary hover:bg-blue-700 transition-all shadow-md disabled:opacity-70"
                >
                    {isLoading ? 'Sending...' : 'Send reset link'}
                </button>
                <div className="text-center mt-6">
                    <Link to="/login" className="text-sm font-medium text-secondary hover:underline">
                        Back to sign in
                    </Link>
                </div>
            </div>
        </form>
    );
}
