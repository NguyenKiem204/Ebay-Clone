import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useOrderStore from '../store/useOrderStore';
import { Button } from '../components/ui/Button';
import { toast } from 'react-hot-toast';
import { checkoutService } from '../features/checkout/services/checkoutService';
import MyEbayLayout from '../components/myebay/MyEbayLayout';
import { isUserInteractingWithForm } from '../lib/autoRefresh';

export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState('All');
    const [payingOrderId, setPayingOrderId] = useState(null);
    const { orders, loading, fetchOrders, requestCancellation } = useOrderStore();
    const navigate = useNavigate();

    const tabs = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    useEffect(() => {
        const statusMap = {
            'All': null,
            'Pending': 'pending',
            'Processing': 'processing',
            'Shipped': 'shipped',
            'Delivered': 'delivered',
            'Cancelled': 'cancelled'
        };
        fetchOrders(statusMap[activeTab]);
    }, [activeTab, fetchOrders]);

    useEffect(() => {
        const statusMap = {
            'All': null,
            'Pending': 'pending',
            'Processing': 'processing',
            'Shipped': 'shipped',
            'Delivered': 'delivered',
            'Cancelled': 'cancelled'
        };

        const timer = window.setInterval(() => {
            if (!isUserInteractingWithForm()) {
                fetchOrders(statusMap[activeTab], { silent: true });
            }
        }, 30000);

        return () => window.clearInterval(timer);
    }, [activeTab, fetchOrders]);

    const formatVND = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatPaymentMethod = (paymentMethod) => {
        if (!paymentMethod) {
            return 'Not available';
        }

        if (paymentMethod.toLowerCase() === 'cod') {
            return 'COD';
        }

        if (paymentMethod.toLowerCase() === 'paypal') {
            return 'PayPal';
        }

        return paymentMethod;
    };

    const buildShippingSummary = (shippingAddress) => {
        if (!shippingAddress) {
            return 'Shipping details are not available yet.';
        }

        const parts = [shippingAddress.street, shippingAddress.city, shippingAddress.state, shippingAddress.country]
            .filter(Boolean);

        return parts.length > 0 ? parts.join(', ') : 'Shipping details are not available yet.';
    };

    const buildTrackingSummary = (shippingTracking) => {
        if (!shippingTracking) {
            return 'Tracking details are not available yet.';
        }

        const parts = [];

        if (shippingTracking.status) {
            parts.push(`Status: ${shippingTracking.status}`);
        }

        if (shippingTracking.carrier) {
            parts.push(`Carrier: ${shippingTracking.carrier}`);
        }

        if (shippingTracking.trackingNumber) {
            parts.push(`Tracking: ${shippingTracking.trackingNumber}`);
        }

        return parts.length > 0 ? parts.join(' â€¢ ') : 'Tracking details are not available yet.';
    };

    const formatDateTime = (value) => {
        return value ? new Date(value).toLocaleString('en-US') : 'Not available';
    };

    const handleRequestCancellation = async (orderId) => {
        const reason = window.prompt('Tell the seller why you want to cancel this order. This note is optional.', '');
        if (reason === null) {
            return;
        }

        if (window.confirm('Send this cancellation request to the seller?')) {
            const res = await requestCancellation(orderId, reason);
            if (res.success) {
                toast.success('Cancellation request sent');
            } else {
                toast.error(res.error || 'Failed to send cancellation request');
            }
        }
    };

    const canPayAuctionOrder = (order) => {
        if (!order?.isAuctionOrder) return false;
        if (order?.isPaymentOverdue) return false;
        if ((order?.status || '').toLowerCase() !== 'pending') return false;
        if ((order?.paymentMethod || '').toLowerCase() !== 'paypal') return false;

        const paymentStatus = (order?.paymentStatus || '').toLowerCase();
        return paymentStatus !== 'completed' && paymentStatus !== 'failed';
    };

    const handlePayNow = async (orderId) => {
        setPayingOrderId(orderId);
        try {
            const response = await checkoutService.createPaypalOrder(orderId);
            if (!response.success || !response.data) {
                throw new Error(response.message || 'Failed to initiate simulated PayPal payment.');
            }

            navigate(`/payment/simulate?orderId=${orderId}&paymentRef=${encodeURIComponent(response.data)}`);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Unable to continue payment.');
        } finally {
            setPayingOrderId(null);
        }
    };

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'text-yellow-600';
            case 'processing': return 'text-blue-600';
            case 'shipped': return 'text-purple-600';
            case 'delivered': return 'text-green-600';
            case 'cancelled': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'pending';
            case 'processing': return 'sync';
            case 'shipped': return 'local_shipping';
            case 'delivered': return 'check_circle';
            case 'cancelled': return 'cancel';
            default: return 'info';
        }
    };

    const getCancellationRequestStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'border-amber-200 bg-amber-50 text-amber-700';
            case 'approved':
                return 'border-emerald-200 bg-emerald-50 text-emerald-700';
            case 'rejected':
                return 'border-red-200 bg-red-50 text-red-700';
            default:
                return 'border-gray-200 bg-gray-50 text-gray-700';
        }
    };

    return (
        <MyEbayLayout
            activeKey="orders"
            title="Purchase History"
            description="Review your orders, payments, shipping progress, and follow-up actions without leaving My eBay."
        >
            <div className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h1 className="text-2xl font-bold mb-6 text-gray-900">Purchase History</h1>
                        <div className="flex space-x-8 text-sm text-gray-600 border-b border-gray-200 overflow-x-auto scrollbar-hide">
                            {tabs.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    className={`pb-3 border-b-2 font-bold whitespace-nowrap transition-colors ${activeTab === t
                                        ? 'border-secondary text-secondary'
                                        : 'border-transparent hover:text-gray-900'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-80 focus:ring-secondary focus:border-secondary outline-none"
                                    placeholder="Search by order number..."
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 absolute left-3 top-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                            {loading ? 'Searching...' : `Showing ${orders.length} orders`}
                        </div>
                    </div>

                    <div className="flex-1 p-6 space-y-6 bg-gray-50/50">
                        {loading ? (
                            <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse italic">
                                Loading your purchase history...
                            </div>
                        ) : orders.length > 0 ? (
                            orders.map((order) => (
                                <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                                            <div>
                                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Order Date</p>
                                                <p className="text-sm font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Total</p>
                                                <p className="text-sm font-black text-secondary">
                                                    {formatVND(order.totalAmount)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Order #</p>
                                            <p className="text-sm font-mono font-bold text-gray-900">{order.orderNumber || 'Not available'}</p>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        {canPayAuctionOrder(order) && (
                                            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
                                                <p className="text-sm font-black uppercase tracking-wide text-blue-700">You won this auction</p>
                                                <p className="mt-1 text-sm text-blue-900">
                                                    Complete payment before {formatDateTime(order.paymentDueAt)} to keep this order.
                                                </p>
                                                <div className="mt-4 flex flex-wrap gap-3">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="font-bold"
                                                        isLoading={payingOrderId === order.id}
                                                        onClick={() => handlePayNow(order.id)}
                                                    >
                                                        Pay now
                                                    </Button>
                                                    <Link to={`/orders/${order.id}`}>
                                                        <Button variant="outline" size="sm" className="font-bold">View order</Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                                            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Payment</p>
                                                <p className="font-semibold text-gray-900">{formatPaymentMethod(order.paymentMethod)}</p>
                                                <p className={`mt-1 font-medium capitalize ${getStatusStyles(order.paymentStatus)}`}>{order.paymentStatus}</p>
                                                {order.isAuctionOrder && order.paymentDueAt && (
                                                    <p className={`mt-1 text-xs ${order.isPaymentOverdue ? 'text-red-600 font-semibold' : 'text-amber-700'}`}>
                                                        Payment deadline: {formatDateTime(order.paymentDueAt)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 lg:col-span-2">
                                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Shipping summary</p>
                                                <p className="font-semibold text-gray-900">
                                                    {order.shippingAddress?.fullName || 'Recipient not available'}
                                                </p>
                                                <p className="text-gray-600 mt-1">{buildShippingSummary(order.shippingAddress)}</p>
                                            </div>
                                        </div>

                                        <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Shipping / tracking</p>
                                            <p className="font-semibold text-gray-900">
                                                {order.shippingTracking?.status ? order.shippingTracking.status : 'Not available yet'}
                                            </p>
                                            <p className="text-gray-600 mt-1">{buildTrackingSummary(order.shippingTracking)}</p>
                                        </div>

                                        {order.cancellationRequest && (
                                            <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${getCancellationRequestStyles(order.cancellationRequest.status)}`}>
                                                <p className="text-[11px] uppercase font-black tracking-widest mb-1">Cancellation request</p>
                                                <p className="font-semibold capitalize">{order.cancellationRequest.status}</p>
                                                {order.cancellationRequest.reason && (
                                                    <p className="mt-1">Buyer note: {order.cancellationRequest.reason}</p>
                                                )}
                                                {order.cancellationRequest.sellerResponse && (
                                                    <p className="mt-1">Seller response: {order.cancellationRequest.sellerResponse}</p>
                                                )}
                                            </div>
                                        )}

                                        {order.items?.map(item => (
                                            <div key={`${order.id}-${item.productId}-${item.title}`} className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 last:mb-0">
                                                <div className="flex gap-4">
                                                    <div className={`w-24 h-24 border border-gray-100 rounded-lg overflow-hidden flex-shrink-0 bg-white shadow-sm ${order.status?.toLowerCase() === 'cancelled' ? 'grayscale opacity-75' : ''}`}>
                                                        <img src={item.image || 'https://via.placeholder.com/100'} alt={item.title} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <Link to={`/products/${item.productId}`} className={`font-bold text-base hover:text-secondary line-clamp-2 leading-tight mb-2 transition-colors ${order.status?.toLowerCase() === 'cancelled' ? 'text-gray-500' : 'text-gray-900'}`}>
                                                            {item.title}
                                                        </Link>
                                                        <p className="text-sm text-gray-500 font-medium">Quantity: <span className="text-gray-900 font-bold">{item.quantity}</span></p>
                                                        <p className="text-sm text-gray-500 font-medium">Price: <span className="text-gray-900 font-bold">{formatVND(item.price)}</span></p>

                                                        <div className={`mt-3 flex items-center text-xs font-black uppercase tracking-wider ${getStatusStyles(order.status)}`}>
                                                            <span className="material-symbols-outlined text-base mr-1">{getStatusIcon(order.status)}</span>
                                                            {order.status}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col space-y-2 w-full sm:w-48 shrink-0 mt-4 sm:mt-0">
                                                    {order.status?.toLowerCase() === 'delivered' && (
                                                        <Link to={`/products/${item.productId}`} className="w-full">
                                                            <Button variant="primary" size="sm" className="w-full font-bold shadow-sm">Buy again</Button>
                                                        </Link>
                                                    )}
                                                    <Link to={`/orders/${order.id}`} className="w-full">
                                                        <Button variant="outline" size="sm" className="w-full font-bold">View details</Button>
                                                    </Link>
                                                    {canPayAuctionOrder(order) && (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            className="w-full font-bold"
                                                            isLoading={payingOrderId === order.id}
                                                            onClick={() => handlePayNow(order.id)}
                                                        >
                                                            Pay now
                                                        </Button>
                                                    )}
                                                    {order.canRequestCancellation && !order.cancellationRequest?.status?.toLowerCase()?.includes('pending') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full font-bold text-gray-500 hover:text-red-600"
                                                            onClick={() => handleRequestCancellation(order.id)}
                                                        >
                                                            Request cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                                <span className="material-symbols-outlined text-6xl text-gray-200 mb-4 block">shopping_basket</span>
                                <p className="text-gray-500 font-bold text-lg">No orders found</p>
                                <p className="text-sm text-gray-400 mt-1">Try selecting a different status or filter.</p>
                                <Link to="/" className="inline-block mt-6 text-secondary font-bold hover:underline">Start Shopping</Link>
                            </div>
                        )}
                    </div>
                </div>
        </MyEbayLayout>
    );
}
