import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import api from '../lib/axios';
import useAuthStore from '../store/useAuthStore';

export default function OrderSuccessPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const stateOrder = location.state?.order;
    const { isAuthenticated, loading: authLoading } = useAuthStore();
    const [memberOrder, setMemberOrder] = useState(null);
    const [memberOrderLoading, setMemberOrderLoading] = useState(false);
    const [memberOrderError, setMemberOrderError] = useState('');

    const memberOrderId = searchParams.get('id') || stateOrder?.id || null;
    const stateCustomerType = stateOrder?.customerType || searchParams.get('customerType') || null;
    const isGuestOrder = stateCustomerType === 'guest';
    const shouldLoadMemberOrder = !isGuestOrder && Boolean(memberOrderId);

    const memberOrderTruth = useMemo(() => {
        if (memberOrder) {
            return memberOrder;
        }

        if (!memberOrderId && stateCustomerType === 'member' && stateOrder) {
            return stateOrder;
        }

        return null;
    }, [memberOrder, memberOrderId, stateCustomerType, stateOrder]);

    const orderNumber = isGuestOrder
        ? stateOrder?.orderNumber || searchParams.get('orderNumber') || null
        : memberOrderTruth?.orderNumber || null;
    const customerType = isGuestOrder
        ? stateCustomerType
        : (memberOrderTruth ? 'member' : stateCustomerType);
    const status = isGuestOrder
        ? stateOrder?.status || searchParams.get('status') || null
        : memberOrderTruth?.status || null;
    const paymentStatus = isGuestOrder
        ? stateOrder?.paymentStatus || searchParams.get('paymentStatus') || null
        : memberOrderTruth?.paymentStatus || null;
    const paymentMethod = isGuestOrder
        ? stateOrder?.paymentMethod || searchParams.get('paymentMethod') || null
        : memberOrderTruth?.paymentMethod || null;
    const shippingTracking = !isGuestOrder ? memberOrderTruth?.shippingTracking : null;
    const shippingAddress = !isGuestOrder ? memberOrderTruth?.shippingAddress : null;

    const showMemberOrdersLink = customerType === 'member';
    const isCashOnDelivery = typeof paymentMethod === 'string' && paymentMethod.toLowerCase() === 'cod';
    const isPendingPayment = typeof paymentStatus === 'string' && paymentStatus.toLowerCase() === 'pending';
    const isPendingOrder = typeof status === 'string' && status.toLowerCase() === 'pending';
    const guestLookupHref = orderNumber
        ? `/guest/orders/lookup?orderNumber=${encodeURIComponent(orderNumber)}&source=success`
        : '/guest/orders/lookup?source=success';

    useEffect(() => {
        if (!stateOrder?.orderNumber) {
            return;
        }

        const nextParams = new URLSearchParams(searchParams);
        const nextValues = {
            id: stateOrder.id,
            orderNumber: stateOrder.orderNumber,
            customerType: stateOrder.customerType,
            status: stateOrder.status,
            paymentStatus: stateOrder.paymentStatus,
            paymentMethod: stateOrder.paymentMethod
        };

        let hasChanges = false;

        Object.entries(nextValues).forEach(([key, value]) => {
            if (!value) {
                return;
            }

            if (nextParams.get(key) !== value) {
                nextParams.set(key, value);
                hasChanges = true;
            }
        });

        if (!hasChanges) {
            return;
        }

        navigate(
            {
                pathname: location.pathname,
                search: `?${nextParams.toString()}`
            },
            {
                replace: true,
                state: location.state
            }
        );
    }, [location.pathname, location.state, navigate, searchParams, stateOrder]);

    useEffect(() => {
        if (!shouldLoadMemberOrder) {
            setMemberOrder(null);
            setMemberOrderLoading(false);
            setMemberOrderError('');
            return;
        }

        if (authLoading) {
            return;
        }

        if (!isAuthenticated) {
            setMemberOrder(null);
            setMemberOrderLoading(false);
            setMemberOrderError('Sign in to load this order from your account history.');
            return;
        }

        let active = true;

        const loadMemberOrder = async () => {
            setMemberOrderLoading(true);
            setMemberOrderError('');

            try {
                const response = await api.get(`/api/Order/${memberOrderId}`);
                if (!active) {
                    return;
                }

                setMemberOrder(response.data?.data || null);
            } catch (error) {
                if (!active) {
                    return;
                }

                setMemberOrder(null);
                setMemberOrderError(
                    error.response?.data?.message || 'We could not recover this order from your account history.'
                );
            } finally {
                if (active) {
                    setMemberOrderLoading(false);
                }
            }
        };

        loadMemberOrder();

        return () => {
            active = false;
        };
    }, [authLoading, isAuthenticated, memberOrderId, shouldLoadMemberOrder]);

    if (shouldLoadMemberOrder && (authLoading || memberOrderLoading)) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
                <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 animate-pulse">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Loading your order</h1>
                <p className="text-lg text-gray-600">
                    We&apos;re pulling the latest order details from your account history.
                </p>
            </div>
        );
    }

    const showMemberRecovery = !isGuestOrder && !memberOrderTruth;
    const memberLoginHref = memberOrderId
        ? `/login?redirect=${encodeURIComponent(`/order-success?id=${memberOrderId}`)}`
        : '/login?redirect=%2Forders';

    return (
        <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your order has been received</h1>
            <p className="text-lg text-gray-600 mb-8">
                Your order was created successfully. We&apos;ll use your order details for the next steps.
            </p>

            {!showMemberRecovery && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left max-w-lg mx-auto">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
                        <div>
                            <span className="block text-sm text-gray-500 mb-1">Order number</span>
                            <span className="font-bold text-gray-900">{orderNumber || 'Available in your confirmation details'}</span>
                        </div>
                        {customerType && (
                            <div className="text-right">
                                <span className="block text-sm text-gray-500 mb-1">Customer type</span>
                                <span className="font-medium text-gray-900 capitalize">{customerType}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                        {status && (
                            <p>
                                Order status: <span className="font-medium text-gray-900 capitalize">{status}</span>
                                {isPendingOrder ? ' (your order has been created and is waiting for the next fulfillment step).' : '.'}
                            </p>
                        )}
                        {paymentMethod && (
                            <p>
                                Payment method: <span className="font-medium text-gray-900 uppercase">{paymentMethod}</span>
                            </p>
                        )}
                        {paymentStatus && (
                            <p>
                                Payment status: <span className="font-medium text-gray-900 capitalize">{paymentStatus}</span>
                                {isCashOnDelivery && isPendingPayment ? ' (payment has not been completed yet and will be collected on delivery).' : '.'}
                            </p>
                        )}
                        {shippingTracking?.status && (
                            <p>
                                Shipping status: <span className="font-medium text-gray-900 capitalize">{shippingTracking.status}</span>
                            </p>
                        )}
                        {shippingTracking?.trackingNumber && (
                            <p>
                                Tracking number: <span className="font-medium text-gray-900">{shippingTracking.trackingNumber}</span>
                            </p>
                        )}
                        {shippingAddress?.fullName && (
                            <p>
                                Shipping to: <span className="font-medium text-gray-900">{shippingAddress.fullName}</span>
                            </p>
                        )}
                        <p>
                            We&apos;ll send a confirmation email with your order details. This page confirms that your order was created, not that payment has been completed.
                        </p>
                    </div>
                </div>
            )}

            {isGuestOrder && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8 text-left max-w-lg mx-auto">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Need to recover this order later?</h2>
                    <p className="text-sm text-gray-700 mb-3">
                        Guest order recovery does not require a login. Use your order number and the email you entered at checkout to look up the latest order details or request the confirmation email again.
                    </p>
                    <Link to={guestLookupHref} className="text-blue-600 hover:underline font-medium text-sm">
                        Go to guest order lookup
                    </Link>
                </div>
            )}

            {showMemberRecovery && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left max-w-lg mx-auto">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">We couldn&apos;t recover this member order safely</h2>
                    <p className="text-sm text-gray-700 mb-3">
                        {memberOrderError || 'This success page needs a valid order reference from your account history. We won&apos;t show guessed order details here.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {!isAuthenticated ? (
                            <Link to={memberLoginHref} className="text-blue-600 hover:underline font-medium text-sm">
                                Sign in to recover this order
                            </Link>
                        ) : (
                            <Link to="/orders" className="text-blue-600 hover:underline font-medium text-sm">
                                Open your orders
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {!showMemberOrdersLink && !showMemberRecovery && !orderNumber && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left max-w-lg mx-auto">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Need to recover your order details?</h2>
                    <p className="text-sm text-gray-700 mb-3">
                        If this page was opened without your latest order state, use guest order lookup with your order number and checkout email. We won&apos;t show placeholder order data here.
                    </p>
                    <Link to="/guest/orders/lookup" className="text-blue-600 hover:underline font-medium text-sm">
                        Open guest order lookup
                    </Link>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {showMemberOrdersLink && (
                    <Link to="/orders">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto font-bold px-8">
                            View Orders
                        </Button>
                    </Link>
                )}
                <Link to="/">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto font-bold shadow-lg shadow-blue-500/20 px-8">
                        Continue Shopping
                    </Button>
                </Link>
            </div>
        </div>
    );
}
