import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { useDebounceButton } from '../../../hooks/useDebounceButton';
import useCartStore from '../hooks/useCartStore';
import { checkoutService } from '../../checkout/services/checkoutService';

export default function CartSummary({ subtotal, totalItems }) {
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const cartItems = useCartStore(s => s.items);
    const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
    const [eligibilityMessage, setEligibilityMessage] = useState('');
    const [guestQuote, setGuestQuote] = useState(null);

    const fallbackShipping = useMemo(
        () => cartItems.reduce((sum, item) => sum + (item.shippingPrice ?? 0), 0),
        [cartItems]
    );

    useEffect(() => {
        if (isAuthenticated || cartItems.length === 0) {
            setGuestQuote(null);
            return;
        }

        let isMounted = true;

        const fetchGuestQuote = async () => {
            try {
                const response = await checkoutService.evaluateGuestEligibility({
                    items: cartItems.map(item => ({
                        productId: item.id,
                        quantity: item.quantity
                    }))
                });

                if (!isMounted) return;

                if (response.success && response.data) {
                    setGuestQuote(response.data);
                } else {
                    setGuestQuote(null);
                }
            } catch {
                if (isMounted) {
                    setGuestQuote(null);
                }
            }
        };

        fetchGuestQuote();

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, cartItems]);

    const hasGuestCanonicalQuote = !isAuthenticated && !!guestQuote;
    const displaySubtotal = hasGuestCanonicalQuote ? guestQuote.subtotal : subtotal;
    const displayShipping = hasGuestCanonicalQuote
        ? guestQuote.shippingFee
        : fallbackShipping;
    const displayTotal = hasGuestCanonicalQuote
        ? guestQuote.totalAmount
        : subtotal + fallbackShipping;
    const shouldShowCalculatedSubtotal = !isAuthenticated && !guestQuote;
    const shouldShowCalculatedShipping = !isAuthenticated && !guestQuote;
    const shouldShowCalculatedTotal = !isAuthenticated && !guestQuote;

    // Anti-spam: block rapid repeated clicks on checkout
    const { trigger: handleCheckout, isBlocked } = useDebounceButton(
        async () => {
            if (isAuthenticated) {
                navigate('/checkout');
                return;
            }

            setIsCheckingEligibility(true);
            setEligibilityMessage('');

            try {
                const response = await checkoutService.evaluateGuestEligibility({
                    items: cartItems.map(item => ({
                        productId: item.id,
                        quantity: item.quantity
                    }))
                });

                if (response.success && response.data?.eligible) {
                    navigate('/checkout');
                    return;
                }

                setEligibilityMessage(
                    response.data?.reasons?.[0]
                    || response.message
                    || 'Some items in your cart are not eligible for guest checkout.'
                );
            } catch (err) {
                setEligibilityMessage(
                    err.response?.data?.message
                    || 'We could not verify guest checkout eligibility right now. Please try again.'
                );
            } finally {
                setIsCheckingEligibility(false);
            }
        },
        { threshold: 2, windowMs: 600, blockDurationMs: 2000, warningMsg: 'Vui lÃ²ng khÃ´ng nháº¥n quÃ¡ nhanh!' }
    );

    return (
        <div className="bg-[#f2f2f2]/40 border border-gray-200 p-8 rounded-[16px] shadow-sm">
            <h2 className="text-[24px] font-bold mb-8 text-gray-900 leading-tight">Order summary</h2>

            <div className="space-y-6 mb-10">
                <div className="flex justify-between text-[15px] text-gray-900">
                    <span>Items ({totalItems})</span>
                    <span>
                        {shouldShowCalculatedSubtotal
                            ? 'Calculated at checkout'
                            : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(displaySubtotal)}
                    </span>
                </div>
                <div className="flex justify-between text-[15px] text-gray-900">
                    <div className="flex items-center gap-1">
                        <span>Shipping</span>
                        <Info size={16} className="text-gray-400 cursor-pointer" />
                    </div>
                    <span>
                        {shouldShowCalculatedShipping
                            ? 'Calculated at checkout'
                            : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(displayShipping)}
                    </span>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mb-8 flex justify-between items-center">
                <span className="text-[18px] font-bold text-gray-900">Order total</span>
                <span className="text-[18px] font-bold text-gray-900">
                    {shouldShowCalculatedTotal
                        ? 'Calculated at checkout'
                        : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(displayTotal)}
                </span>
            </div>

            <button
                onClick={handleCheckout}
                disabled={isBlocked || isCheckingEligibility}
                className="block w-full text-center py-3.5 bg-[#3665f3] text-white font-bold rounded-full hover:bg-blue-700 transition text-[16px] shadow-md shadow-blue-500/10 mb-8 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isCheckingEligibility ? 'Checking guest eligibility...' : !isAuthenticated ? 'Go to guest checkout' : 'Go to checkout'}
            </button>

            {!isAuthenticated && (
                <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    Guest checkout is available for eligible fixed-price items only. Auction items, PayPal, and coupons are not supported in guest checkout during Phase 1.
                </div>
            )}

            {eligibilityMessage && (
                <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    {eligibilityMessage}
                </div>
            )}

            <div className="flex items-start gap-2 pt-2 border-t border-gray-100 mt-4">
                <ShieldCheck size={20} className="text-[#3665f3] flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-gray-600 leading-relaxed">
                    Purchase protected by <a href="#" className="text-[#3665f3] underline">eBay Money Back Guarantee</a>
                </p>
            </div>
        </div>
    );
}
