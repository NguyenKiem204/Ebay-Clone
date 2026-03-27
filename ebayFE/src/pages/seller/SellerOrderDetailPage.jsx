import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import useAuthStore from '../../store/useAuthStore';
import sellerOrderService from '../../features/seller/services/sellerOrderService';

const formatDateTime = (value) => (
    value ? new Date(value).toLocaleString('en-US') : 'Not available'
);

const formatVND = (amount) => (
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
);

const formatCodeLabel = (value) => {
    if (!value) {
        return 'Not available';
    }

    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatPaymentMethod = (value) => {
    if (!value) {
        return 'Not available';
    }

    if (value.toLowerCase() === 'cod') {
        return 'Cash on delivery';
    }

    if (value.toLowerCase() === 'paypal') {
        return 'PayPal';
    }

    return formatCodeLabel(value);
};

const resolveWorkflowKey = (order) => {
    const orderStatus = order.orderStatus?.toLowerCase();
    const paymentStatus = order.paymentStatus?.toLowerCase();
    const paymentMethod = order.paymentMethod?.toLowerCase();
    const shippingStatus = order.shippingStatus?.toLowerCase();

    if (orderStatus === 'cancelled' || paymentStatus === 'failed' || paymentStatus === 'refunded') {
        return 'cancelled';
    }

    if (shippingStatus === 'delivered' || orderStatus === 'delivered') {
        return 'delivered';
    }

    if (shippingStatus === 'out_for_delivery') {
        return 'out_for_delivery';
    }

    if (paymentMethod !== 'cod' && paymentStatus !== 'completed') {
        return 'awaiting_payment';
    }

    if (['shipped', 'in_transit'].includes(shippingStatus) || orderStatus === 'shipped') {
        return 'paid_shipped';
    }

    return 'awaiting_shipment';
};

const getWorkflowLabel = (workflowKey) => {
    switch (workflowKey) {
        case 'awaiting_payment':
            return 'Awaiting payment';
        case 'awaiting_shipment':
            return 'Awaiting shipment';
        case 'out_for_delivery':
            return 'Out for delivery';
        case 'paid_shipped':
            return 'Paid and shipped';
        case 'delivered':
            return 'Delivered';
        case 'cancelled':
            return 'Cancelled';
        default:
            return 'Not available';
    }
};

const getWorkflowStyles = (workflowKey) => {
    switch (workflowKey) {
        case 'awaiting_payment':
            return 'border-amber-200 bg-amber-50 text-amber-700';
        case 'awaiting_shipment':
            return 'border-blue-200 bg-blue-50 text-blue-700';
        case 'out_for_delivery':
            return 'border-sky-200 bg-sky-50 text-sky-700';
        case 'paid_shipped':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        case 'delivered':
            return 'border-green-200 bg-green-50 text-green-700';
        case 'cancelled':
            return 'border-red-200 bg-red-50 text-red-700';
        default:
            return 'border-gray-200 bg-gray-50 text-gray-700';
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

export default function SellerOrderDetailPage() {
    const { user } = useAuthStore();
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [trackingActionLoading, setTrackingActionLoading] = useState(false);
    const [shipmentStatusActionLoading, setShipmentStatusActionLoading] = useState(null);
    const [trackingForm, setTrackingForm] = useState({
        carrier: '',
        trackingNumber: '',
        estimatedArrival: ''
    });

    const loadOrder = async () => {
        if (!orderId) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await sellerOrderService.getOrderById(orderId);
            setOrder(data);
        } catch (loadError) {
            setError(loadError.response?.data?.message || loadError.message || 'Failed to load seller order detail.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    useEffect(() => {
        if (!order) {
            return;
        }

        setTrackingForm({
            carrier: order.shippingTracking?.carrier || '',
            trackingNumber: order.shippingTracking?.trackingNumber || '',
            estimatedArrival: order.shippingTracking?.estimatedArrival
                ? new Date(order.shippingTracking.estimatedArrival).toISOString().slice(0, 10)
                : ''
        });
    }, [order]);

    const handleApproveCancellation = async () => {
        if (!order?.cancellationRequest?.id) {
            return;
        }

        const sellerResponse = window.prompt('Optional response to buyer when approving this cancellation request.', '');
        if (sellerResponse === null) {
            return;
        }

        if (!window.confirm(`Approve cancellation request for order ${order.orderNumber}?`)) {
            return;
        }

        setActionLoading(`approve-${order.cancellationRequest.id}`);
        try {
            await sellerOrderService.approveCancellationRequest(order.cancellationRequest.id, sellerResponse);
            toast.success('Cancellation request approved');
            await loadOrder();
        } catch (actionError) {
            toast.error(actionError.response?.data?.message || actionError.message || 'Failed to approve cancellation request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectCancellation = async () => {
        if (!order?.cancellationRequest?.id) {
            return;
        }

        const sellerResponse = window.prompt('Tell the buyer why this cancellation request is being rejected.', '');
        if (sellerResponse === null) {
            return;
        }

        setActionLoading(`reject-${order.cancellationRequest.id}`);
        try {
            await sellerOrderService.rejectCancellationRequest(order.cancellationRequest.id, sellerResponse);
            toast.success('Cancellation request rejected');
            await loadOrder();
        } catch (actionError) {
            toast.error(actionError.response?.data?.message || actionError.message || 'Failed to reject cancellation request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleTrackingSubmit = async (event) => {
        event.preventDefault();

        if (!order) {
            return;
        }

        setTrackingActionLoading(true);
        try {
            const updatedOrder = await sellerOrderService.upsertTracking(order.orderId, {
                carrier: trackingForm.carrier,
                trackingNumber: trackingForm.trackingNumber,
                estimatedArrival: trackingForm.estimatedArrival || null
            });

            setOrder(updatedOrder);
            toast.success(order.shippingTracking?.trackingNumber ? 'Tracking updated' : 'Order marked as shipped');
        } catch (actionError) {
            toast.error(actionError.response?.data?.message || actionError.message || 'Failed to update tracking');
        } finally {
            setTrackingActionLoading(false);
        }
    };

    const handleShipmentStatusUpdate = async (nextStatus) => {
        if (!order) {
            return;
        }

        const confirmMessage = nextStatus === 'delivered'
            ? `Mark order ${order.orderNumber} as delivered? This will open buyer-side return / SNAD windows and complete COD payment if applicable.`
            : `Mark order ${order.orderNumber} as out for delivery?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setShipmentStatusActionLoading(nextStatus);
        try {
            const updatedOrder = await sellerOrderService.updateShipmentStatus(order.orderId, nextStatus);
            setOrder(updatedOrder);
            toast.success(nextStatus === 'delivered' ? 'Order marked as delivered' : 'Order marked as out for delivery');
        } catch (actionError) {
            toast.error(actionError.response?.data?.message || actionError.message || 'Failed to update shipment status');
        } finally {
            setShipmentStatusActionLoading(null);
        }
    };

    const workflowKey = useMemo(() => (
        order ? resolveWorkflowKey(order) : 'all'
    ), [order]);

    if (!user || !['seller', 'admin'].includes(user.role?.toLowerCase())) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Order detail</h2>
                <p className="text-gray-600">This view is available to seller and admin users only.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500 font-medium">
                Loading seller order detail...
            </div>
        );
    }

    if (!order) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                <p className="font-semibold text-red-700 mb-2">Could not load seller order detail</p>
                <p className="text-sm text-red-600 mb-4">{error || 'This order was not found in your seller queue.'}</p>
                <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={loadOrder}>
                        Retry
                    </Button>
                    <Link
                        to="/seller/orders"
                        className="inline-flex items-center justify-center h-11 px-6 text-[15px] font-bold rounded-md border-2 border-primary text-primary hover:bg-red-50 transition-colors"
                    >
                        Back to orders
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <Link to="/seller/orders" className="text-sm font-medium text-blue-600 hover:underline">
                        Back to seller orders
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-1">Order detail</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="text-gray-600">
                            Order <span className="font-mono font-semibold text-gray-900">{order.orderNumber}</span>
                        </p>
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getWorkflowStyles(workflowKey)}`}>
                            {getWorkflowLabel(workflowKey)}
                        </span>
                        {order.isAuctionOrder && (
                            <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                                Auction
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={loadOrder} isLoading={loading}>
                        Refresh
                    </Button>
                </div>
            </div>

            {order.containsOtherSellerItems && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    This buyer order still contains {order.otherSellerItemCount} item(s) from other seller accounts.
                    Amounts shown as seller totals below are scoped to your listings only.
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6">
                <div className="space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Buyer and payment</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Buyer</p>
                                <p className="font-semibold text-gray-900">{order.buyerDisplayName}</p>
                                <p className="text-gray-600 mt-1">{formatCodeLabel(order.customerType)}</p>
                                {order.buyerEmail && <p className="text-gray-600 mt-1">{order.buyerEmail}</p>}
                                {order.buyerPhone && <p className="text-gray-600 mt-1">{order.buyerPhone}</p>}
                            </div>

                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Payment snapshot</p>
                                <p className="font-semibold text-gray-900">
                                    {formatCodeLabel(order.paymentStatus)} via {formatPaymentMethod(order.paymentMethod)}
                                </p>
                                <p className="text-gray-600 mt-1">
                                    Order status: <span className="font-semibold text-gray-900">{formatCodeLabel(order.orderStatus)}</span>
                                </p>
                                <p className="text-gray-600 mt-1">
                                    Created at: <span className="font-semibold text-gray-900">{formatDateTime(order.createdAt)}</span>
                                </p>
                                {order.paymentDueAt && (
                                    <p className="text-gray-600 mt-1">
                                        Payment deadline: <span className="font-semibold text-gray-900">{formatDateTime(order.paymentDueAt)}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {order.buyerNote && (
                            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Buyer note</p>
                                <p>{order.buyerNote}</p>
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Ship to</h2>
                        {order.shippingAddress ? (
                            <div className="text-sm text-gray-700 space-y-1">
                                <p className="font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
                                <p>{order.shippingAddress.phone}</p>
                                <p>{order.shippingAddress.street}</p>
                                <p>
                                    {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode]
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                                <p>{order.shippingAddress.country}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">Shipping address is not available for this order.</p>
                        )}
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Shipping and tracking snapshot</h2>
                        {order.shippingTracking ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Shipping status</p>
                                    <p className="font-semibold text-gray-900">{formatCodeLabel(order.shippingTracking.status)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Carrier</p>
                                    <p className="font-semibold text-gray-900">{order.shippingTracking.carrier || 'Not available'}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Tracking number</p>
                                    <p className="font-semibold text-gray-900">{order.shippingTracking.trackingNumber || 'Not available'}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Shipped at</p>
                                    <p className="font-semibold text-gray-900">{formatDateTime(order.shippingTracking.shippedAt)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Estimated arrival</p>
                                    <p className="font-semibold text-gray-900">{formatDateTime(order.shippingTracking.estimatedArrival)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Delivered at</p>
                                    <p className="font-semibold text-gray-900">{formatDateTime(order.shippingTracking.deliveredAt)}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">
                                Tracking data does not exist yet. The next phase will add seller-side tracking and ship-state updates.
                            </p>
                        )}
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Your order items</h2>
                        <div className="space-y-4">
                            {order.items?.map((item) => (
                                <div key={item.orderItemId} className="flex gap-4 rounded-lg border border-gray-100 p-4">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="h-20 w-20 rounded-lg border border-gray-100 bg-gray-50 object-contain"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-lg border border-gray-100 bg-gray-50" />
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <Link to={`/products/${item.productId}`} className="font-semibold text-gray-900 hover:text-secondary transition-colors">
                                                {item.title}
                                            </Link>
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-gray-700">
                                                Order item #{item.orderItemId}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">Qty {item.quantity}</p>
                                        <p className="text-sm text-gray-600">Unit price {formatVND(item.unitPrice)}</p>
                                        <p className="text-sm font-semibold text-gray-900 mt-2">Line total {formatVND(item.totalPrice)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Seller summary</h2>
                        <div className="space-y-3 text-sm text-gray-700">
                            <div className="flex justify-between gap-4">
                                <span>Your line items</span>
                                <span className="font-semibold text-gray-900">{order.sellerItemCount}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span>Your quantity total</span>
                                <span className="font-semibold text-gray-900">{order.sellerQuantityTotal}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span>Your seller total</span>
                                <span className="font-semibold text-gray-900">{formatVND(order.sellerTotalAmount)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span>Order subtotal</span>
                                <span className="font-semibold text-gray-900">{formatVND(order.orderSubtotal)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span>Order shipping</span>
                                <span className="font-semibold text-gray-900">{formatVND(order.orderShippingFee)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span>Order discount</span>
                                <span className="font-semibold text-gray-900">{formatVND(order.orderDiscountAmount)}</span>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-gray-100 pt-3">
                                <span className="font-bold text-gray-900">Order total</span>
                                <span className="font-bold text-gray-900">{formatVND(order.orderTotalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {order.cancellationRequest ? (
                        <div className={`rounded-lg border px-4 py-4 shadow-sm ${getCancellationRequestStyles(order.cancellationRequest.status)}`}>
                            <p className="text-[11px] uppercase font-black tracking-widest mb-1 opacity-80">Cancellation request</p>
                            <p className="font-semibold capitalize">{order.cancellationRequest.status}</p>
                            {order.cancellationRequest.reason && (
                                <p className="text-sm mt-2">Buyer note: {order.cancellationRequest.reason}</p>
                            )}
                            {order.cancellationRequest.sellerResponse && (
                                <p className="text-sm mt-2">Seller response: {order.cancellationRequest.sellerResponse}</p>
                            )}

                            {order.canManageCancellationRequest && order.cancellationRequest.status?.toLowerCase() === 'pending' && (
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="shadow-none"
                                        isLoading={actionLoading === `approve-${order.cancellationRequest.id}`}
                                        onClick={handleApproveCancellation}
                                    >
                                        Approve request
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        isLoading={actionLoading === `reject-${order.cancellationRequest.id}`}
                                        onClick={handleRejectCancellation}
                                    >
                                        Reject request
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-600">
                            No buyer cancellation request is attached to this order right now.
                        </div>
                    )}

                    <div className="rounded-lg border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-600">
                        {order.canUpdateTracking || order.canMarkOutForDelivery || order.canMarkDelivered
                            ? 'Seller-managed shipment updates are available here for single-seller orders. Carrier sync is not integrated yet, so use the next-state buttons only when your fulfillment flow has actually reached that stage.'
                            : 'Tracking and shipment-stage updates are blocked for this order right now. Current rules only allow seller-managed fulfillment on single-seller orders that are still eligible for shipping.'}
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {order.shippingTracking?.trackingNumber ? 'Update tracking' : 'Mark shipped'}
                        </h2>

                        {order.canUpdateTracking ? (
                            <form onSubmit={handleTrackingSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Carrier
                                    </label>
                                    <input
                                        type="text"
                                        value={trackingForm.carrier}
                                        onChange={(event) => setTrackingForm((current) => ({ ...current, carrier: event.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="UPS, FedEx, DHL..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Tracking number
                                    </label>
                                    <input
                                        type="text"
                                        value={trackingForm.trackingNumber}
                                        onChange={(event) => setTrackingForm((current) => ({ ...current, trackingNumber: event.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Enter buyer-facing tracking number"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Estimated arrival
                                    </label>
                                    <input
                                        type="date"
                                        value={trackingForm.estimatedArrival}
                                        onChange={(event) => setTrackingForm((current) => ({ ...current, estimatedArrival: event.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>

                                <p className="text-xs text-gray-500">
                                    The first save marks the order as shipped and creates or updates the shared shipping record for this order.
                                </p>

                                <Button type="submit" isLoading={trackingActionLoading}>
                                    {order.shippingTracking?.trackingNumber ? 'Update tracking' : 'Save and mark shipped'}
                                </Button>
                            </form>
                        ) : (
                            <p className="text-sm text-gray-600">
                                This order is not eligible for seller-managed tracking yet.
                            </p>
                        )}
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Shipment progress</h2>

                        {(order.canMarkOutForDelivery || order.canMarkDelivered) ? (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Move the shipment forward only when the tracked parcel has actually reached the next milestone.
                                </p>

                                <div className="flex flex-wrap gap-3">
                                    {order.canMarkOutForDelivery && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            isLoading={shipmentStatusActionLoading === 'out_for_delivery'}
                                            onClick={() => handleShipmentStatusUpdate('out_for_delivery')}
                                        >
                                            Mark out for delivery
                                        </Button>
                                    )}

                                    {order.canMarkDelivered && (
                                        <Button
                                            type="button"
                                            isLoading={shipmentStatusActionLoading === 'delivered'}
                                            onClick={() => handleShipmentStatusUpdate('delivered')}
                                        >
                                            Mark delivered
                                        </Button>
                                    )}
                                </div>

                                <p className="text-xs text-gray-500">
                                    Marking an order as delivered stamps `DeliveredAt`, updates buyer tracking, and closes the delivery leg. For COD, the latest pending payment is also completed at delivery time.
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">
                                No next shipment-state action is available right now. Add tracking first, or refresh after the previous stage has been saved.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
