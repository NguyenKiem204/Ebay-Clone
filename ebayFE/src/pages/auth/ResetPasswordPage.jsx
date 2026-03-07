import { Link } from 'react-router-dom';
import ResetPasswordForm from '../../features/auth/components/ResetPasswordForm';

export default function ResetPasswordPage() {
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
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Create new password</h2>
                    <p className="text-sm text-gray-600">
                        Please enter a new password for your account.
                    </p>
                </div>

                <ResetPasswordForm />
            </div>
        </div>
    );
}
