import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const CAPTCHA_SESSION_TTL_MS = 30 * 60 * 1000;

function hasFreshCaptchaVerification() {
    const verified = sessionStorage.getItem('verified') === 'true';
    const verifiedAt = Number(sessionStorage.getItem('verifiedAt') || 0);

    if (!verified || !verifiedAt || Date.now() - verifiedAt > CAPTCHA_SESSION_TTL_MS) {
        sessionStorage.removeItem('verified');
        sessionStorage.removeItem('verifiedAt');
        return false;
    }

    return true;
}

export default function RequireVerifiedAuth({ children }) {
    const location = useLocation();
    const { isAuthenticated, loading } = useAuthStore();

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return children;
    }

    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    const target = hasFreshCaptchaVerification()
        ? `/login?redirect=${redirect}`
        : `/verify?redirect=${redirect}`;

    return <Navigate to={target} replace />;
}
