import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import api from '../lib/axios';
import { checkoutService } from '../features/checkout/services/checkoutService';
import useAuthStore from '../store/useAuthStore';

const formatVND = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

export default function PaymentSimulationPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, loading: authLoading } = useAuthStore();
    const [order, setOrder] = useState(null);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [submittingAction, setSubmittingAction] = useState(null);
    const [actionError, setActionError] = useState('');
    const [actionMessage, setActionMessage] = useState('');

    const orderId = searchParams.get('orderId');
    const paymentRef = searchParams.get('paymentRef');

    useEffect(() => {
        if (authLoading || !isAuthenticated || !orderId) {
            return;
        }

        let active = true;

        const loadOrder = async () => {
            setLoadingOrder(true);
            setOrderError('');

            try {
                const response = await api.get(`/api/Order/${orderId}`);
                if (!active) {
                    return;
                }

                setOrder(response.data?.data || null);
            } catch (error) {
                if (!active) {
                    return;
                }

                setOrder(null);
                setOrderError(error.response?.data?.message || 'We could not load this order for payment simulation.');
            } finally {
                if (active) {
                    setLoadingOrder(false);
                }
            }
        };

        loadOrder();

        return () => {
            active = false;
        };
    }, [authLoading, isAuthenticated, orderId]);

    const paymentState = useMemo(() => {
        const paymentStatus = order?.paymentStatus?.toLowerCase();
        const orderStatus = order?.status?.toLowerCase();
        const overdue = Boolean(order?.isPaymentOverdue);

        if (paymentStatus === 'completed') {
            return 'completed';
        }

        if (overdue || paymentStatus === 'failed' || orderStatus === 'cancelled') {
            return 'failed';
        }

        return 'pending';
    }, [order?.isPaymentOverdue, order?.paymentStatus, order?.status]);

    const handleApprove = async () => {
        if (!paymentRef || !orderId) {
            setActionError('This simulated payment reference is missing.');
            return;
        }

        setSubmittingAction('approve');
        setActionError('');
        setActionMessage('');

        try {
            const response = await checkoutService.capturePaypalOrder(paymentRef);
            if (!response.success) {
                throw new Error(response.message || 'Unable to approve this simulated payment.');
            }

            navigate(`/order-success?id=${orderId}`);
        } catch (error) {
            setActionError(error.response?.data?.message || error.message || 'Unable to approve this simulated payment.');
        } finally {
            setSubmittingAction(null);
        }
    };

    const handleFail = async () => {
        if (!paymentRef) {
            setActionError('This simulated payment reference is missing.');
            return;
        }

        setSubmittingAction('fail');
        setActionError('');
        setActionMessage('');

        try {
            const response = await checkoutService.failPaypalOrder(paymentRef);
            if (!response.success) {
                throw new Error(response.message || 'Unable to mark this simulated payment as failed.');
            }

            setActionMessage('The simulated payment was marked as failed. The order is now cancelled.');
            setOrder((current) => current
                ? { ...current, paymentStatus: 'failed', status: 'cancelled' }
                : current);
        } catch (error) {
            setActionError(error.response?.data?.message || error.message || 'Unable to mark this simulated payment as failed.');
        } finally {
            setSubmittingAction(null);
        }
    };

    if (authLoading || loadingOrder) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading simulated payment details...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">Sign in to continue payment simulation</h1>
                <p className="text-gray-600 mb-6">
                    This payment simulation belongs to a signed-in member order.
                </p>
                <Link
                    to={orderId ? `/login?redirect=${encodeURIComponent(`/payment/simulate?orderId=${orderId}${paymentRef ? `&paymentRef=${encodeURIComponent(paymentRef)}` : ''}`)}` : '/login'}
                    className="text-blue-600 hover:underline font-medium"
                >
                    Go to sign in
                </Link>
            </div>
        );
    }

    if (!orderId || !paymentRef || !order) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">We could not recover this simulated payment</h1>
                <p className="text-gray-600 mb-6">
                    {orderError || 'This page needs a valid order and simulated payment reference.'}
                </p>
                <Link to="/orders" className="text-blue-600 hover:underline font-medium">
                    Open your orders
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                    <p className="text-sm font-bold tracking-[0.2em] uppercase text-blue-700 mb-2">Demo Payment</p>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulated PayPal approval</h1>
                    <p className="text-gray-600">
                        This page simulates the buyer approval step for member checkout without using a real payment gateway.
                    </p>
                </div>

                <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-5">
                        <div className="rounded-lg border border-gray-200 p-5">
                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Order number</p>
                            <p className="font-mono font-bold text-gray-900">{order.orderNumber}</p>
                        </div>

                        <div className="rounded-lg border border-gray-200 p-5">
                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Simulated payment reference</p>
                            <p className="font-mono text-sm text-gray-900 break-all">{paymentRef}</p>
                        </div>

                        <div className="rounded-lg border border-gray-200 p-5">
                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-3">Current state</p>
                            <div className="space-y-2 text-sm text-gray-700">
                                <p>Order status: <span className="font-semibold text-gray-900 capitalize">{order.status}</span></p>
                                <p>Payment method: <span className="font-semibold text-gray-900 uppercase">{order.paymentMethod}</span></p>
                                <p>Payment status: <span className="font-semibold text-gray-900 capitalize">{order.paymentStatus}</span></p>
                                {order.isAuctionOrder && (
                                    <p>
                                        Payment deadline:{' '}
                                        <span className="font-semibold text-gray-900">
                                            {order.paymentDueAt ? new Date(order.paymentDueAt).toLocaleString('vi-VN') : 'Not available'}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="rounded-lg border border-gray-200 p-5">
                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-3">Order total</p>
                            <p className="text-3xl font-black text-gray-900">{formatVND(order.totalAmount)}</p>
                            <div className="mt-4 space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatVND(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span>{formatVND(order.shippingFee)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Discount</span>
                                    <span>{formatVND(order.discountAmount)}</span>
                                </div>
                            </div>
                        </div>

                        {actionError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {actionError}
                            </div>
                        )}

                        {actionMessage && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                {actionMessage}
                            </div>
                        )}

                        {paymentState === 'pending' ? (
                            <div className="rounded-lg border border-gray-200 p-5">
                                <p className="text-sm text-gray-700 mb-4">
                                    Choose the outcome you want to simulate for this buyer payment step.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        onClick={handleApprove}
                                        isLoading={submittingAction === 'approve'}
                                        className="flex-1"
                                    >
                                        Approve payment
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleFail}
                                        isLoading={submittingAction === 'fail'}
                                        className="flex-1"
                                    >
                                        Mark payment failed
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-gray-200 p-5">
                                <p className="text-sm text-gray-700 mb-4">
                                    This simulated payment is no longer pending.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {paymentState === 'completed' ? (
                                        <Link to={`/order-success?id=${orderId}`} className="flex-1">
                                            <Button className="w-full">Open success page</Button>
                                        </Link>
                                    ) : (
                                        <Link to={`/orders/${orderId}`} className="flex-1">
                                            <Button className="w-full">View order detail</Button>
                                        </Link>
                                    )}
                                    <Link to="/orders" className="flex-1">
                                        <Button variant="outline" className="w-full">Open orders</Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
