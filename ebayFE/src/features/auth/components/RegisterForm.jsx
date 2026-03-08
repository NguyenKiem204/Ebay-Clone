import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import api from '../../../lib/axios';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const schema = yup.object({
    username: yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    email: yup.string().email('Invalid email address').required('Email is required'),
    password: yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[0-9]/, 'Password must contain at least one number')
        .matches(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)')
        .max(128, 'Password must not exceed 128 characters'),
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
            await api.post('/api/Auth/register', data);
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

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        placeholder="First name"
                        error={errors.firstName?.message}
                        {...register("firstName")}
                    />
                    <Input
                        label="Last Name"
                        placeholder="Last name"
                        error={errors.lastName?.message}
                        {...register("lastName")}
                    />
                </div>

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
