import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import useAuthStore from '../../../store/useAuthStore';
import { authService } from '../services/authService';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const schema = yup.object({
    email: yup.string().required('Email or username is required'),
    password: yup.string().required('Password is required'),
}).required();

export default function LoginForm() {
    const navigate = useNavigate();
    const login = useAuthStore(state => state.login);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

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
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-1">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <Input
                    label="Email address or username"
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
            </div>

            <div className="flex items-center justify-between">
                <Checkbox
                    label="Stay signed in"
                    id="remember-me"
                />
            </div>

            <Button
                type="submit"
                variant="secondary"
                isLoading={isLoading}
                className="w-full"
            >
                Sign in
            </Button>
        </form>
    );
}
