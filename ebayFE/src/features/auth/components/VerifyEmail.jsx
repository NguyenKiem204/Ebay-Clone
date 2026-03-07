import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Verification token is missing.');
                return;
            }

            try {
                await authService.verifyEmail(token);
                setStatus('success');
                setMessage('Your email has been successfully verified! You can now sign in.');
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. The link may be expired or invalid.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="text-center space-y-6">
            {status === 'verifying' && (
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-600">Verifying your email...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="space-y-4">
                    <div className="text-5xl text-green-500">✓</div>
                    <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
                    <p className="text-gray-600">{message}</p>
                    <Link
                        to="/login"
                        className="inline-block px-8 py-3 bg-secondary text-white font-bold rounded-full hover:bg-blue-700 transition-colors shadow-md"
                    >
                        Sign in now
                    </Link>
                </div>
            )}

            {status === 'error' && (
                <div className="space-y-4">
                    <div className="text-5xl text-red-500">✕</div>
                    <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
                    <p className="text-gray-600 font-medium">{message}</p>
                    <div className="flex flex-col gap-3 pt-4">
                        <Link to="/register" className="text-secondary hover:underline font-medium">Try registering again</Link>
                        <Link to="/login" className="text-gray-500 hover:underline">Back to sign in</Link>
                    </div>
                </div>
            )}
        </div>
    );
}
