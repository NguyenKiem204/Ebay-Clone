import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "../../lib/axios";
import useAuthStore from "../../store/useAuthStore";

export default function SecurityMeasurePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleVerify = async (token) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post("/api/Auth/verify-captcha", { token });

            if (response.data.success) {
                sessionStorage.setItem("verified", "true");
                sessionStorage.setItem("verifiedAt", String(Date.now()));

                const redirect = new URLSearchParams(location.search).get("redirect") || "/";
                navigate(
                    isAuthenticated
                        ? redirect
                        : `/login?redirect=${encodeURIComponent(redirect)}`
                );
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto mt-6 w-full max-w-[800px] px-4 py-10">
            <h1 className="mb-8 text-[22px] font-normal text-[#333]">
                Please verify yourself to continue
            </h1>
            <p className="mb-6 text-sm font-normal text-[#333]">
                To keep eBay a safe place to buy and sell, we occasionally ask you to verify yourself. This helps block unauthorized access and automated abuse.
            </p>

            <p className="mb-4 text-[15px] font-bold text-[#333]">Complete hCaptcha</p>

            {error && (
                <div className="mb-4 max-w-[304px] rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="relative inline-block rounded border border-gray-200 bg-white p-4">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#3665f3]"></div>
                    </div>
                )}
                <HCaptcha
                    sitekey="1010d590-923a-407c-9220-704240ee73ee"
                    onVerify={handleVerify}
                />
            </div>

            <p className="mt-8 max-w-[700px] text-[13px] leading-relaxed text-[#e53238]">
                View <a href="#" className="cursor-pointer underline text-[#0064d2]">accessibility options</a> for this verification page. If images do not render correctly, try the latest version of your browser or an alternate browser listed on the <a href="#" className="cursor-pointer underline text-[#0064d2]">customer service page</a>.
            </p>
        </div>
    );
}
