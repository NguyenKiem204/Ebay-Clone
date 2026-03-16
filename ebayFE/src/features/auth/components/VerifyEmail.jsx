import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

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
        <div className="text-center space-y-6 py-8">
            {status === 'verifying' && (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="text-[#3665F3] animate-spin" />
                    <p className="text-gray-600 text-lg">Verifying your email...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="space-y-4">
                    <CheckCircle size={56} className="text-green-500 mx-auto" />
                    <h2 className="text-2xl font-normal text-gray-900">Email Verified!</h2>
                    <p className="text-gray-600">{message}</p>
                    <Link
                        to="/login"
                        className="inline-block w-full py-3.5 bg-[#3665F3] text-white font-medium text-base rounded-full hover:bg-[#382aef] transition-colors text-center mt-4"
                    >
                        Sign in now
                    </Link>
                </div>
            )}

            {status === 'error' && (
                <div className="space-y-4">
                    <XCircle size={56} className="text-red-500 mx-auto" />
                    <h2 className="text-2xl font-normal text-gray-900">Verification Failed</h2>
                    <p className="text-gray-600">{message}</p>
                    <div className="flex flex-col gap-3 pt-4">
                        <Link to="/register" className="text-[#3665F3] hover:underline font-medium">
                            Try registering again
                        </Link>
                        <Link to="/login" className="text-gray-500 hover:underline">
                            Back to sign in
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
