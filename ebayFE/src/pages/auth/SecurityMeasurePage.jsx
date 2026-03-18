import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import axios from "../../lib/axios";

export default function SecurityMeasurePage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleVerify = async (token) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post("/api/Auth/verify-captcha", { token });
            if (response.data.success) {
                sessionStorage.setItem("verified", "true");
                const redirect = new URLSearchParams(location.search).get("redirect") || "/";
                navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Xác thực thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[800px] mx-auto px-4 py-10 mt-6">
            <h1 className="text-[22px] font-normal text-[#333] mb-8">
                Please verify yourself to continue
            </h1>
            <p className="text-sm text-[#333] mb-6 font-normal">
                To keep eBay a safe place to buy and sell, we will occasionally ask you to verify yourself. This helps us to block unauthorized users from entering our site.
            </p>
            
            <p className="font-bold mb-4 text-[#333] text-[15px]">Please verify yourself</p>
            
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm max-w-[304px]">
                    {error}
                </div>
            )}
            
            <div className="inline-block p-4 bg-white relative rounded border border-gray-200">
                {loading && (
                    <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3665f3]"></div>
                    </div>
                )}
                <HCaptcha
                    sitekey="1010d590-923a-407c-9220-704240ee73ee"
                    onVerify={handleVerify}
                />
            </div>
            
            <p className="text-[13px] text-[#e53238] mt-8 max-w-[700px] leading-relaxed">
                View <a href="#" className="underline text-[#0064d2] cursor-pointer">accessibility options</a> for this verification page. If you are having difficulties with rendering of images on the above verification page, eBay suggests using the latest version of your browser, or an alternate browser listed on the <a href="#" className="underline text-[#0064d2] cursor-pointer">customer service page</a>.
            </p>
        </div>
    );
}
