import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { checkoutService } from '../features/checkout/services/checkoutService';
import guestCaseService from '../features/checkout/services/guestCaseService';

export default function GuestOrderLookupPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialOrderNumber = searchParams.get('orderNumber') || '';
    const initialEmail = searchParams.get('email') || '';
    const storedGuestAccess = initialOrderNumber
        ? guestCaseService.getStoredGuestAfterSalesAccess(initialOrderNumber)
        : null;
    const [orderNumber, setOrderNumber] = useState(() => initialOrderNumber);
    const [email, setEmail] = useState(() => initialEmail || location.state?.email || storedGuestAccess?.email || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [message, setMessage] = useState('');
    const recoverySource = searchParams.get('source');
    const recoveryMessage = useMemo(() => {
        if (recoverySource === 'detail') {
            return 'Please confirm your order number and checkout email again to reload your guest order details.';
        }

        if (recoverySource === 'success') {
            return 'Use your order number and checkout email to reopen this guest order later or request the confirmation email again.';
        }

        if (recoverySource === 'cases') {
            return 'Please confirm your order number and checkout email again to reopen your guest cases.';
        }

        if (recoverySource === 'case-detail') {
            return 'Please confirm your order number and checkout email again to reopen this guest case detail.';
        }

        return null;
    }, [recoverySource]);

    const buildLookupPayload = () => ({
        orderNumber: orderNumber.trim(),
        email: email.trim()
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true);
        setMessage('');

        try {
            const payload = buildLookupPayload();
            const response = await checkoutService.lookupGuestOrder(payload);

            if (response.success && response.data?.found) {
                const guestAccess = guestCaseService.storeGuestAfterSalesAccess({
                    orderNumber: payload.orderNumber,
                    email: payload.email,
                    accessToken: response.data.afterSalesAccess?.accessToken,
                    expiresAt: response.data.afterSalesAccess?.expiresAt,
                    proofMethod: response.data.afterSalesAccess?.proofMethod
                });
                const detailParams = new URLSearchParams();
                if (payload.orderNumber) {
                    detailParams.set('orderNumber', payload.orderNumber);
                }

                navigate(
                    {
                        pathname: '/guest/orders/detail',
                        search: detailParams.toString() ? `?${detailParams.toString()}` : ''
                    },
                    {
                    replace: false,
                    state: {
                        order: response.data,
                        guestAccess
                    }
                    }
                );
                return;
            }

            setMessage('We could not find an order with those details. Check your order number and email, then try again.');
        } catch (err) {
            if (err.response?.status === 429) {
                setMessage('Too many lookup attempts. Please wait a minute and try again.');
            } else {
                setMessage('We could not look up your order right now. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendConfirmation = async () => {
        setIsResending(true);
        setMessage('');

        try {
            await checkoutService.resendGuestOrderConfirmation(buildLookupPayload());
            setMessage('If the order details match, we will send the confirmation email again shortly.');
        } catch (err) {
            if (err.response?.status === 429) {
                setMessage('Too many resend attempts. Please wait a bit before requesting another confirmation email.');
            } else {
                setMessage('We could not process the resend request right now. Please try again.');
            }
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="bg-[#f7f7f7] min-h-screen py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6 sm:p-8 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Guest order lookup</h1>
                    <p className="text-gray-600 mb-6">
                        Enter your order number and email to look up a guest order. You do not need to sign in.
                    </p>

                    {recoveryMessage && (
                        <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-700">
                            {recoveryMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="order-number" className="block text-sm font-medium text-gray-700 mb-1">
                                Order number
                            </label>
                            <input
                                id="order-number"
                                type="text"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Enter your order number"
                                autoComplete="off"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="lookup-email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                id="lookup-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Enter the email used at checkout"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full rounded-full font-bold text-[16px] py-3.5 ${isLoading ? 'bg-gray-300 text-gray-500 pointer-events-none' : 'bg-[#3665f3] hover:bg-blue-700 text-white'}`}
                        >
                            {isLoading ? 'Looking up order...' : 'Look up guest order'}
                        </Button>
                    </form>

                    <div className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isResending || isLoading || !orderNumber.trim() || !email.trim()}
                            onClick={handleResendConfirmation}
                            className="w-full rounded-full font-bold text-[16px] py-3.5"
                        >
                            {isResending ? 'Requesting confirmation email...' : 'Resend confirmation email'}
                        </Button>
                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                        Use the same order number and checkout email. We&apos;ll only resend the confirmation email when those details match a guest order.
                    </p>

                    {message && (
                        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                            {message}
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <Link to="/" className="text-blue-600 hover:underline text-sm font-medium">
                        Continue shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
