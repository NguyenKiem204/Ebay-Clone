import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

export const useRequireAuth = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuthStore();

    const handleSecureAction = (callback) => {
        if (isAuthenticated) {
            callback();
        } else {
            const redirectStr = encodeURIComponent(location.pathname + location.search);
            if (sessionStorage.getItem("verified") === "true") {
                navigate(`/login?redirect=${redirectStr}`);
            } else {
                navigate(`/verify?redirect=${redirectStr}`);
            }
        }
    };

    return { handleSecureAction };
};
