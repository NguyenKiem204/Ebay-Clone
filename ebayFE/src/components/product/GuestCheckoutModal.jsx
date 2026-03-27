import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { checkoutService } from '../../features/checkout/services/checkoutService';

export default function GuestCheckoutModal({ isOpen, onClose, product, quantity }) {
    const navigate = useNavigate();
    const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
    const [eligibilityMessage, setEligibilityMessage] = useState('');
    const isAuction = Boolean(product?.isAuction);

    if (!isOpen || !product) return null;

    const checkoutUrl = `/checkout?buyItNow=1&productId=${product.id}&quantity=${quantity}`;

    const handleSignIn = () => {
        const redirectStr = encodeURIComponent(checkoutUrl);
        navigate(`/login?redirect=${redirectStr}`);
    };

    const handleGuestCheckout = async () => {
        if (isAuction) return;

        setIsCheckingEligibility(true);
        setEligibilityMessage('');

        try {
            const response = await checkoutService.evaluateGuestEligibility({
                items: [
                    {
                        productId: product.id,
                        quantity
                    }
                ]
            });

            if (response.success && response.data?.eligible) {
                navigate(checkoutUrl);
                return;
            }

            setEligibilityMessage(
                response.data?.reasons?.[0]
                || response.message
                || 'This item is not eligible for guest checkout right now.'
            );
        } catch (err) {
            setEligibilityMessage(
                err.response?.data?.message
                || 'We could not verify guest checkout eligibility right now. Please try again.'
            );
        } finally {
            setIsCheckingEligibility(false);
        }
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

                    <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        {isAuction ? (
                            <p>
                                Guest checkout is not available for auction items. Sign in to continue with bidding or auction checkout flows.
                            </p>
                        ) : (
                            <p>
                                Guest checkout is available for eligible fixed-price items only. Phase 1 supports Cash on Delivery (COD) only. PayPal and coupons are not available in guest checkout.
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={handleSignIn}
                            className="w-full bg-[#3665f3] hover:bg-blue-700 text-white font-bold h-12 rounded-full transition-colors flex items-center justify-center text-[15px]"
                        >
                            {isAuction ? 'Sign in to bid or check out' : 'Sign in to check out'}
                        </button>
                        {!isAuction && (
                            <button 
                                onClick={handleGuestCheckout}
                                disabled={isCheckingEligibility}
                                className="w-full bg-white border border-[#3665f3] text-[#3665f3] hover:bg-blue-50 font-bold h-12 rounded-full transition-colors flex items-center justify-center text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isCheckingEligibility ? 'Checking guest eligibility...' : 'Check out as guest'}
                            </button>
                        )}
                    </div>

                    {eligibilityMessage && (
                        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                            {eligibilityMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
