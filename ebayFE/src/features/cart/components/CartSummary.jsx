import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { useDebounceButton } from '../../../hooks/useDebounceButton';
import useCartStore from '../hooks/useCartStore';
import useCurrencyStore from '../../../store/useCurrencyStore';
import { checkoutService } from '../../checkout/services/checkoutService';

export default function CartSummary({ subtotal, totalItems }) {
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const cartItems = useCartStore(s => s.items);
    const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
    const [eligibilityMessage, setEligibilityMessage] = useState('');
    const [guestQuote, setGuestQuote] = useState(null);
    const { isVietnamese, formatVnd } = useCurrencyStore();

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
        { threshold: 2, windowMs: 600, blockDurationMs: 2000, warningMsg: 'Please do not click too fast!' }
    );

    const formatPrice = (amount) => {
        if (isVietnamese) return formatVnd(amount);
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="bg-[#f7f7f7] border border-gray-200 p-6 rounded-[8px] shadow-sm">
            <h2 className="text-[24px] font-bold mb-6 text-[#191919]">Order summary</h2>

            <div className="space-y-4 mb-6">
                <div className="flex justify-between text-[15px] text-[#191919]">
                    <span className="font-normal text-gray-600">Items ({totalItems})</span>
                    <span className="font-normal">
                        {shouldShowCalculatedSubtotal ? 'Calculated at checkout' : formatPrice(displaySubtotal)}
                    </span>
                </div>
                <div className="flex justify-between text-[15px] text-[#191919]">
                    <span className="font-normal text-gray-600">Shipping</span>
                    <span className="font-normal">
                        {shouldShowCalculatedShipping ? 'Calculated at checkout' : formatPrice(displayShipping)}
                    </span>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-5 mb-6 flex justify-between items-baseline">
                <span className="text-[18px] font-bold text-[#191919]">Order total</span>
                <div className="text-right">
                    <span className="text-[18px] font-bold text-[#191919] block">
                        {shouldShowCalculatedTotal ? 'Calculated at checkout' : formatPrice(displayTotal)}
                    </span>
                    {!shouldShowCalculatedTotal && isVietnamese && (
                        <span className="text-[13px] text-gray-500 font-normal">
                            (Approximately {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(displayTotal)})
                        </span>
                    )}
                </div>
            </div>

            <button
                onClick={handleCheckout}
                disabled={isBlocked || isCheckingEligibility}
                className="block w-full text-center py-3 bg-[#3665f3] text-white font-bold rounded-full hover:bg-blue-700 transition text-[16px] mb-6 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-500/10"
            >
                {isCheckingEligibility ? 'Checking guest eligibility...' : !isAuthenticated ? 'Go to guest checkout' : 'Go to checkout'}
            </button>

            {eligibilityMessage && (
                <div className="mb-6 rounded-md border border-red-100 bg-red-50/30 px-4 py-3 text-[13px] text-red-600">
                    {eligibilityMessage}
                </div>
            )}

            <div className="flex items-start gap-2 pt-4 border-t border-gray-200">
                <ShieldCheck size={18} className="text-[#3665f3] flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-gray-600 leading-tight">
                    Purchase protected by <a href="#" className="text-[#3665f3] hover:underline">eBay Money Back Guarantee</a>
                </p>
            </div>
        </div>
    );
}
