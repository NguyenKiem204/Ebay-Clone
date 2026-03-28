import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import useAuthStore from '../../store/useAuthStore';
import sellerOrderService from '../../features/seller/services/sellerOrderService';

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'awaiting_payment', label: 'Awaiting payment' },
    { key: 'awaiting_shipment', label: 'Awaiting shipment' },
    { key: 'paid_shipped', label: 'Paid and shipped' },
    { key: 'cancelled', label: 'Cancelled' }
];

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

    if (paymentMethod !== 'cod' && paymentStatus !== 'completed') {
        return 'awaiting_payment';
    }

    if (['shipped', 'delivered'].includes(shippingStatus) || ['shipped', 'delivered'].includes(orderStatus)) {
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
        case 'paid_shipped':
            return 'Paid and shipped';
        case 'cancelled':
            return 'Cancelled';
        default:
            return 'All';
    }
};

const getWorkflowStyles = (workflowKey) => {
    switch (workflowKey) {
        case 'awaiting_payment':
            return 'border-amber-200 bg-amber-50 text-amber-700';
        case 'awaiting_shipment':
            return 'border-blue-200 bg-blue-50 text-blue-700';
        case 'paid_shipped':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
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

export default function SellerOrdersPage() {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);

    const loadOrders = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await sellerOrderService.getMyOrders();
            setOrders(data);
        } catch (loadError) {
            setError(loadError.response?.data?.message || loadError.message || 'Failed to load seller orders.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleApproveCancellation = async (order) => {
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
            await loadOrders();
        } catch (actionError) {
            toast.error(actionError.response?.data?.message || actionError.message || 'Failed to approve cancellation request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectCancellation = async (order) => {
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
            await loadOrders();
        } catch (actionError) {
            toast.error(actionError.response?.data?.message || actionError.message || 'Failed to reject cancellation request');
        } finally {
            setActionLoading(null);
        }
    };

    const ordersWithWorkflow = useMemo(() => (
        orders.map((order) => ({
            ...order,
            workflowKey: resolveWorkflowKey(order)
        }))
    ), [orders]);

    const filteredOrders = useMemo(() => (
        activeTab === 'all'
            ? ordersWithWorkflow
            : ordersWithWorkflow.filter((order) => order.workflowKey === activeTab)
    ), [activeTab, ordersWithWorkflow]);

    const tabCounts = useMemo(() => (
        TABS.reduce((counts, tab) => {
            counts[tab.key] = tab.key === 'all'
                ? ordersWithWorkflow.length
                : ordersWithWorkflow.filter((order) => order.workflowKey === tab.key).length;
            return counts;
        }, {})
    ), [ordersWithWorkflow]);

    const awaitingShipmentCount = tabCounts.awaiting_shipment || 0;
    const awaitingPaymentCount = tabCounts.awaiting_payment || 0;

    if (!user || !['seller', 'admin'].includes(user.role?.toLowerCase())) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage orders</h2>
                <p className="text-gray-600">This view is available to seller and admin users only.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Manage orders</h1>
                    <p className="text-gray-600">
                        Live seller order projection with cancellation-request handling. Fulfillment and tracking actions still come next.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm min-w-[180px]">
                        <p className="text-gray-500 font-semibold mb-1">Visible orders</p>
                        <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm min-w-[180px]">
                        <p className="text-blue-600 font-semibold mb-1">Awaiting shipment</p>
                        <p className="text-2xl font-bold text-blue-700">{awaitingShipmentCount}</p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm min-w-[180px]">
                        <p className="text-amber-600 font-semibold mb-1">Awaiting payment</p>
                        <p className="text-2xl font-bold text-amber-700">{awaitingPaymentCount}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-gray-200">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${isActive
                                    ? 'border-gray-900 text-gray-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label} ({tabCounts[tab.key] || 0})
                        </button>
                    );
                })}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                    Seller totals and items below are scoped to your listings only, even if the buyer order contains products from multiple sellers.
                </p>
                <Button type="button" variant="outline" onClick={loadOrders} isLoading={loading}>
                    Refresh orders
                </Button>
            </div>

            {loading ? (
                <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500 font-medium">
                    Loading seller orders...
                </div>
            ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                    <p className="font-semibold text-red-700 mb-2">Could not load seller orders</p>
                    <p className="text-sm text-red-600 mb-4">{error}</p>
                    <Button type="button" variant="outline" onClick={loadOrders}>
                        Retry
                    </Button>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                        {ordersWithWorkflow.length === 0 ? 'No seller orders yet' : 'No orders match this filter'}
                    </p>
                    <p className="text-gray-600">
                        {ordersWithWorkflow.length === 0
                            ? 'When buyers place orders that include your listings, they will appear here.'
                            : 'Try another workflow tab or refresh the queue.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
                        const primaryItem = order.items?.[0] || null;
                        const additionalItems = Math.max((order.items?.length || 0) - 1, 0);
                        const workflowLabel = getWorkflowLabel(order.workflowKey);

                        return (
                            <div key={`${order.orderId}-${order.orderNumber}`} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-gray-100">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <p className="text-lg font-bold text-gray-900">{order.orderNumber}</p>
                                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getWorkflowStyles(order.workflowKey)}`}>
                                                {workflowLabel}
                                            </span>
                                            {order.isAuctionOrder && (
                                                <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                                                    Auction
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-600">
                                            Buyer: <span className="font-semibold text-gray-900">{order.buyerDisplayName}</span>
                                            <span className="mx-2 text-gray-300">â€¢</span>
                                            <span>{formatCodeLabel(order.customerType)}</span>
                                            {order.buyerEmail && (
                                                <>
                                                    <span className="mx-2 text-gray-300">â€¢</span>
                                                    <span>{order.buyerEmail}</span>
                                                </>
                                            )}
                                        </p>

                                        <p className="text-sm text-gray-500 mt-1">
                                            Created at {formatDateTime(order.createdAt)}
                                        </p>
                                    </div>

                                    <div className="text-left sm:text-right">
                                        <p className="text-sm text-gray-500 mb-1">Seller total</p>
                                        <p className="text-2xl font-bold text-gray-900">{formatVND(order.sellerTotalAmount)}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {order.sellerQuantityTotal} unit(s) across {order.sellerItemCount} line(s)
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-5 pt-5">
                                    <div className="space-y-3">
                                        {primaryItem && (
                                            <div className="flex gap-4">
                                                {primaryItem.image ? (
                                                    <img
                                                        src={primaryItem.image}
                                                        alt={primaryItem.title}
                                                        className="h-20 w-20 rounded-lg border border-gray-100 bg-gray-50 object-contain"
                                                    />
                                                ) : (
                                                    <div className="h-20 w-20 rounded-lg border border-gray-100 bg-gray-50" />
                                                )}

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <p className="font-semibold text-gray-900">{primaryItem.title}</p>
                                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-gray-700">
                                                            Order item #{primaryItem.orderItemId}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        Qty {primaryItem.quantity} â€¢ {formatVND(primaryItem.totalPrice)}
                                                    </p>
                                                    {additionalItems > 0 && (
                                                        <p className="text-sm text-gray-500 mt-2">
                                                            +{additionalItems} more item(s) from this order belong to your seller account.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {order.items?.length > 1 && (
                                            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                                                    Additional seller items
                                                </p>
                                                <div className="space-y-2">
                                                    {order.items.slice(1).map((item) => (
                                                        <div key={item.orderItemId} className="flex items-center justify-between gap-4 text-sm">
                                                            <span className="text-gray-700 truncate">
                                                                {item.title} <span className="text-gray-400">x{item.quantity}</span>
                                                            </span>
                                                            <span className="font-semibold text-gray-900 whitespace-nowrap">
                                                                {formatVND(item.totalPrice)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4 space-y-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Payment</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {formatCodeLabel(order.paymentStatus)} via {formatPaymentMethod(order.paymentMethod)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Order lifecycle</p>
                                            <p className="text-sm text-gray-700">
                                                Order status: <span className="font-semibold text-gray-900">{formatCodeLabel(order.orderStatus)}</span>
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                Shipping status: <span className="font-semibold text-gray-900">{formatCodeLabel(order.shippingStatus)}</span>
                                            </p>
                                        </div>

                                        {order.paymentDueAt && order.workflowKey === 'awaiting_payment' && (
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Auction payment deadline</p>
                                                <p className="text-sm font-semibold text-amber-700">
                                                    {formatDateTime(order.paymentDueAt)}
                                                </p>
                                            </div>
                                        )}

                                        {order.cancellationRequest && (
                                            <div className={`rounded-lg border px-3 py-3 text-sm ${getCancellationRequestStyles(order.cancellationRequest.status)}`}>
                                                <p className="text-xs font-bold uppercase tracking-wide mb-1">Cancellation request</p>
                                                <p className="font-semibold capitalize">{order.cancellationRequest.status}</p>
                                                {order.cancellationRequest.reason && (
                                                    <p className="mt-1">Buyer note: {order.cancellationRequest.reason}</p>
                                                )}
                                                {order.cancellationRequest.sellerResponse && (
                                                    <p className="mt-1">Seller response: {order.cancellationRequest.sellerResponse}</p>
                                                )}
                                                {order.canManageCancellationRequest && order.cancellationRequest.status?.toLowerCase() === 'pending' && (
                                                    <div className="mt-3 flex flex-wrap gap-3">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className="shadow-none"
                                                            isLoading={actionLoading === `approve-${order.cancellationRequest.id}`}
                                                            onClick={() => handleApproveCancellation(order)}
                                                        >
                                                            Approve request
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            isLoading={actionLoading === `reject-${order.cancellationRequest.id}`}
                                                            onClick={() => handleRejectCancellation(order)}
                                                        >
                                                            Reject request
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-3 text-sm text-gray-600">
                                            Use the detail view for tracking and shipment-stage updates.
                                            This list stays read-focused so seller queue review remains stable.
                                        </div>

                                        <div className="pt-1">
                                            <Link
                                                to={`/seller/orders/${order.orderId}`}
                                                className="inline-flex items-center justify-center h-10 px-4 text-sm font-bold rounded-md border-2 border-primary text-primary hover:bg-red-50 transition-colors"
                                            >
                                                View order details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
