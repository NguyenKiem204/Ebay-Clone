import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import { authService } from '../services/authService';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const schema = yup.object({
    username: yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
    email: yup.string().email('Invalid email address').required('Email is required'),
    password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
    confirmPassword: yup.string()
        .oneOf([yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required'),
}).required();

export default function RegisterForm() {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError(null);
        try {
            await authService.register(data);
            navigate('/login?registered=true');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-1">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <Input
                    label="Username"
                    placeholder="Username"
                    error={errors.username?.message}
                    {...register("username")}
                />

                <Input
                    label="Email address"
                    type="email"
                    placeholder="Email address"
                    error={errors.email?.message}
                    {...register("email")}
                />

                <Input
                    label="Password"
                    type="password"
                    placeholder="Password"
                    error={errors.password?.message}
                    {...register("password")}
                />

                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm password"
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword")}
                />
            </div>

            <Button
                type="submit"
                variant="secondary"
                isLoading={isLoading}
                className="w-full"
            >
                Create account
            </Button>
        </form>
    );
}
