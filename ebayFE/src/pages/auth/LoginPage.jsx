import { Link, useSearchParams } from 'react-router-dom';
import LoginForm from '../../features/auth/components/LoginForm';

export default function LoginPage() {
    const [searchParams] = useSearchParams();
    const isRegistered = searchParams.get('registered') === 'true';

    return (
        <div className="w-full max-w-[440px] mx-auto px-4 py-10">
            {/* Title */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-normal text-gray-900 mb-2">
                    Sign in to your account
                </h1>

                {isRegistered && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                        Registration successful! Please sign in with your credentials.
                    </div>
                )}
            </div>

            {/* Login Form */}
            <LoginForm />

            {/* Create account link */}
            <div className="text-center mt-8">
                <p className="text-sm text-gray-600">
                    New to eBay?{' '}
                    <Link to="/register" className="text-[#3665F3] hover:text-[#382aef] hover:underline font-medium">
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
}
