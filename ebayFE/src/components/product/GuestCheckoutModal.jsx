import { X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function GuestCheckoutModal({ isOpen, onClose, product, quantity }) {
    const navigate = useNavigate();
    const location = useLocation();

    if (!isOpen || !product) return null;

    const checkoutUrl = `/checkout?buyItNow=1&productId=${product.id}&quantity=${quantity}`;

    const handleSignIn = () => {
        const redirectStr = encodeURIComponent(checkoutUrl);
        navigate(`/login?redirect=${redirectStr}`);
    };

    const handleGuestCheckout = () => {
        navigate(checkoutUrl);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded w-full max-w-[420px] shadow-xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 z-10 p-1"
                >
                    <X size={24} />
                </button>

                <div className="p-6 pt-10">
                    <div className="flex gap-4 mb-6">
                        <div className="w-[120px] h-[120px] bg-white flex-shrink-0 flex items-center justify-center border border-gray-100 p-2">
                            <img 
                                src={product.thumbnail || product.imageUrl || product.images?.[0]} 
                                alt={product.title}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[14px] text-gray-900 leading-tight line-clamp-4 mt-2">
                                {product.title}
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={handleSignIn}
                            className="w-full bg-[#3665f3] hover:bg-blue-700 text-white font-bold h-12 rounded-full transition-colors flex items-center justify-center text-[15px]"
                        >
                            Sign in to check out
                        </button>
                        <button 
                            onClick={handleGuestCheckout}
                            className="w-full bg-white border border-[#3665f3] text-[#3665f3] hover:bg-blue-50 font-bold h-12 rounded-full transition-colors flex items-center justify-center text-[15px]"
                        >
                            Check out as guest
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
