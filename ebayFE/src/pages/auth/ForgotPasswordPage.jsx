import { Link } from 'react-router-dom';
import ForgotPasswordForm from '../../features/auth/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-[calc(100vh-theme(spacing.16))] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <Link to="/" className="text-4xl font-bold tracking-tighter inline-block mb-6">
                        <span className="text-primary">e</span>
                        <span className="text-secondary">b</span>
                        <span className="text-yellow-500">a</span>
                        <span className="text-green-600">y</span>
                    </Link>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Reset your password</h2>
                    <p className="text-sm text-gray-600 px-4">
                        Tell us your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <ForgotPasswordForm />
            </div>
        </div>
    );
}
