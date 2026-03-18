import { Link } from 'react-router-dom';
import VerifyEmail from '../../features/auth/components/VerifyEmail';

export default function VerifyEmailPage() {
    return (
        <div className="w-full max-w-[440px] mx-auto px-4 py-10">
            <VerifyEmail />
        </div>
    );
}
