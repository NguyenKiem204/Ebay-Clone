import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

const CAPTCHA_SESSION_TTL_MS = 30 * 60 * 1000;

function hasFreshCaptchaVerification() {
    const verified = sessionStorage.getItem("verified") === "true";
    const verifiedAt = Number(sessionStorage.getItem("verifiedAt") || 0);

    if (!verified || !verifiedAt || Date.now() - verifiedAt > CAPTCHA_SESSION_TTL_MS) {
        sessionStorage.removeItem("verified");
        sessionStorage.removeItem("verifiedAt");
        return false;
    }

    return true;
}

export const useRequireAuth = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuthStore();

    const handleSecureAction = (callback, customRedirect) => {
        if (isAuthenticated) {
            callback();
        } else {
            const redirectStr = encodeURIComponent(customRedirect || (location.pathname + location.search));
            if (hasFreshCaptchaVerification()) {
                navigate(`/login?redirect=${redirectStr}`);
            } else {
                navigate(`/verify?redirect=${redirectStr}`);
            }
        }
    };

    return { handleSecureAction };
};
