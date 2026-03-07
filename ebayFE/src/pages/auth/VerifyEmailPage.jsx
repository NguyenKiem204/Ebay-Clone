import { Link } from 'react-router-dom';
import VerifyEmail from '../../features/auth/components/VerifyEmail';

export default function VerifyEmailPage() {
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
                </div>

                <VerifyEmail />
            </div>
        </div>
    );
}
