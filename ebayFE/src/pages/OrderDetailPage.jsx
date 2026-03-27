import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useOrderStore from '../store/useOrderStore';
import { Button } from '../components/ui/Button';
import api from '../lib/axios';
import { checkoutService } from '../features/checkout/services/checkoutService';
import caseEvidenceService from '../features/cases/services/caseEvidenceService';
import MyEbayLayout from '../components/myebay/MyEbayLayout';
import OrderReviewActionsPanel from '../features/reviews/components/OrderReviewActionsPanel';
import { isUserInteractingWithForm } from '../lib/autoRefresh';

const DEFAULT_RETURN_FORM = {
    orderItemId: '',
    reasonCode: '',
    description: '',
    resolutionType: 'return_for_refund',
    evidenceFile: null
};

const DEFAULT_INR_FORM = {
    orderItemId: '',
    reasonCode: '',
    description: '',
    evidenceFile: null
};

const RETURN_REASON_OPTIONS = [
    { value: 'doesnt_match', label: "Doesn't match the listing" },
    { value: 'damaged', label: 'Arrived damaged' },
    { value: 'missing_parts', label: 'Missing parts or accessories' },
    { value: 'changed_mind', label: 'Changed my mind' },
    { value: 'other', label: 'Other' }
];

const INR_REASON_OPTIONS = [
    { value: 'not_received', label: 'Item not received' },
    { value: 'tracking_not_updated', label: 'Tracking is not updating' },
    { value: 'wrong_address', label: 'Delivered to the wrong address' },
    { value: 'other', label: 'Other' }
];

const formatVND = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

const resolveDefaultOrderItemId = (items) => (
    items?.length === 1 && items[0]?.id ? String(items[0].id) : ''
);

const getCancellationRequestStyles = (status) => {
    switch ((status || '').toLowerCase()) {
    case 'approved':
        return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    case 'rejected':
        return 'border-rose-200 bg-rose-50 text-rose-900';
    default:
        return 'border-amber-200 bg-amber-50 text-amber-900';
    }
};

function CaseItemTargetPicker({
    name,
    items,
    selectedItemId,
    onChange,
    allowOrderLevel = true,
    helperText
}) {
    if (!items?.length) {
        return null;
    }

    return (
        <div>
            <div className="flex items-start justify-between gap-4 mb-2">
                <label className="block text-sm font-semibold text-gray-900">
                    Target item
                </label>
                {helperText && (
                    <p className="text-xs text-gray-500 max-w-sm text-right">
                        {helperText}
                    </p>
                )}
            </div>

            <div className="space-y-3">
                {allowOrderLevel && (
                    <label
                        className={`block rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                            selectedItemId
                                ? 'border-gray-200 bg-white'
                                : 'border-primary/30 bg-primary/5'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <input
                                type="radio"
                                name={name}
                                checked={!selectedItemId}
                                onChange={() => onChange('')}
                                className="mt-1"
                            />
                            <div>
                                <p className="font-semibold text-gray-900">Entire order / not item-specific</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Use this only when the issue cannot be tied cleanly to one order item.
                                </p>
                            </div>
                        </div>
                    </label>
                )}

                {items.map((item) => {
                    const itemId = String(item.id ?? '');
                    const isSelected = selectedItemId === itemId;

                    return (
                        <label
                            key={item.id || `${item.productId}-${item.title}`}
                            className={`block rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                                isSelected
                                    ? 'border-primary/30 bg-primary/5'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <input
                                    type="radio"
                                    name={name}
                                    checked={isSelected}
                                    onChange={() => onChange(itemId)}
                                    className="mt-1"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-gray-900">{item.title}</p>
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-gray-700">
                                            Order item #{item.id}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Qty {item.quantity} â€¢ {formatVND(item.totalPrice)}
                                    </p>
                                </div>
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

export default function OrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { selectedOrder, loading, error, fetchOrderById, clearSelectedOrder, requestCancellation } = useOrderStore();
    const [activeCaseAction, setActiveCaseAction] = useState(null);
    const [returnForm, setReturnForm] = useState(DEFAULT_RETURN_FORM);
    const [inrForm, setInrForm] = useState(DEFAULT_INR_FORM);
    const [submittingAction, setSubmittingAction] = useState(null);
    const [caseFeedback, setCaseFeedback] = useState(null);
    const [paymentActionLoading, setPaymentActionLoading] = useState(false);
    const [cancellationActionLoading, setCancellationActionLoading] = useState(false);

    useEffect(() => {
        if (!id) {
            return;
        }

        fetchOrderById(id);

        return () => {
            clearSelectedOrder();
        };
    }, [clearSelectedOrder, fetchOrderById, id]);

    useEffect(() => {
        if (!id) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            if (!isUserInteractingWithForm()) {
                fetchOrderById(id, { silent: true });
            }
        }, 30000);

        return () => window.clearInterval(timer);
    }, [fetchOrderById, id]);

    useEffect(() => {
        setActiveCaseAction(null);
        setReturnForm(DEFAULT_RETURN_FORM);
        setInrForm(DEFAULT_INR_FORM);
        setCaseFeedback(null);
        setSubmittingAction(null);
    }, [id]);

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

    const formatDateTime = (value) => {
        return value ? new Date(value).toLocaleString('en-US') : 'Not available';
    };

    if (loading) {
        return (
            <MyEbayLayout
                activeKey="orders"
                title="Purchase History"
                description="Review the order details and continue any after-purchase actions without leaving My eBay."
            >
                <div className="rounded-[28px] border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
                    Loading order details...
                </div>
            </MyEbayLayout>
        );
    }

    if (!selectedOrder) {
        return (
            <MyEbayLayout
                activeKey="orders"
                title="Purchase History"
                description="Review the order details and continue any after-purchase actions without leaving My eBay."
            >
                <div className="rounded-[28px] border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Order details</h1>
                    <p className="text-gray-600 mb-6">{error || 'We could not load this order right now.'}</p>
                    <Link to="/orders" className="text-blue-600 hover:underline font-medium">
                        Back to orders
                    </Link>
                </div>
            </MyEbayLayout>
        );
    }

    const order = selectedOrder;
    const orderItems = order.items || [];
    const defaultOrderItemId = resolveDefaultOrderItemId(orderItems);
    const orderStatus = order.status?.toLowerCase() || '';
    const afterSalesOptions = order.afterSales?.options || [];
    const returnOption = afterSalesOptions.find((option) => option.requestType === 'return');
    const inrOption = afterSalesOptions.find((option) => option.requestType === 'inr');
    const hasSupportedCaseAction = Boolean(returnOption?.eligible || inrOption?.eligible);
    const hasMultipleOrderItems = orderItems.length > 1;
    const canPayAuctionOrder = Boolean(
        order.isAuctionOrder
        && !order.isPaymentOverdue
        && orderStatus === 'pending'
        && (order.paymentMethod || '').toLowerCase() === 'paypal'
        && !['completed', 'failed'].includes((order.paymentStatus || '').toLowerCase())
    );
    const hasPendingCancellationRequest = order.cancellationRequest?.status?.toLowerCase() === 'pending';

    const caseContextMessage = (() => {
        if (hasMultipleOrderItems && hasSupportedCaseAction) {
            return 'Choose the specific order item where practical. That helps keep case scope clearer for seller-first handling, while the backend remains the final source of truth.';
        }

        if (returnOption?.eligible) {
            return returnOption.message;
        }

        if (inrOption?.eligible) {
            return inrOption.message;
        }

        return returnOption?.message || inrOption?.message || 'Supported buyer case actions will appear here when the current order context makes them relevant.';
    })();

    const handleReturnSubmit = async (event) => {
        event.preventDefault();
        setSubmittingAction('return');
        setCaseFeedback(null);

        try {
            const selectedReason = RETURN_REASON_OPTIONS.find((option) => option.value === returnForm.reasonCode);
            const payload = {
                orderId: order.id,
                reason: selectedReason?.label || 'Other return reason',
                description: returnForm.description.trim(),
                resolutionType: returnForm.resolutionType
            };

            if (returnForm.orderItemId) {
                payload.orderItemId = Number(returnForm.orderItemId);
            }

            if (returnForm.reasonCode) {
                payload.reasonCode = returnForm.reasonCode;
            }

            const response = await api.post('/api/returns', payload);
            const createdCase = response.data?.data;

            if (createdCase?.id && returnForm.evidenceFile) {
                await caseEvidenceService.uploadEvidence('return', createdCase.id, {
                    file: returnForm.evidenceFile,
                    label: 'Buyer evidence',
                    evidenceType: 'image'
                });
            }

            setCaseFeedback({
                type: 'success',
                title: 'Return request submitted',
                message: createdCase?.id
                    ? `Return request #${createdCase.id} was created successfully.`
                    : 'Your return request was created successfully.'
            });
            setReturnForm({ ...DEFAULT_RETURN_FORM, orderItemId: defaultOrderItemId });
            setActiveCaseAction(null);
        } catch (submitError) {
            setCaseFeedback({
                type: 'error',
                title: 'Could not submit return request',
                message: submitError.response?.data?.message || 'Please review the order context and try again.'
            });
        } finally {
            setSubmittingAction(null);
        }
    };

    const handleInrSubmit = async (event) => {
        event.preventDefault();
        setSubmittingAction('inr');
        setCaseFeedback(null);

        try {
            const response = await api.post('/api/disputes/inr', {
                orderId: order.id,
                ...(inrForm.orderItemId ? { orderItemId: Number(inrForm.orderItemId) } : {}),
                ...(inrForm.reasonCode ? { reasonCode: inrForm.reasonCode } : {}),
                description: inrForm.description.trim()
            });

            const createdCase = response.data?.data;
            if (createdCase?.id && inrForm.evidenceFile) {
                await caseEvidenceService.uploadEvidence('dispute', createdCase.id, {
                    file: inrForm.evidenceFile,
                    label: 'Buyer evidence',
                    evidenceType: 'image'
                });
            }

            setCaseFeedback({
                type: 'success',
                title: 'INR claim submitted',
                message: createdCase?.id
                    ? `INR claim #${createdCase.id} was created successfully.`
                    : 'Your INR claim was created successfully.'
            });
            setInrForm({ ...DEFAULT_INR_FORM, orderItemId: defaultOrderItemId });
            setActiveCaseAction(null);
        } catch (submitError) {
            setCaseFeedback({
                type: 'error',
                title: 'Could not submit INR claim',
                message: submitError.response?.data?.message || 'Please review the order context and try again.'
            });
        } finally {
            setSubmittingAction(null);
        }
    };

    const handleCaseFileChange = (caseType, file) => {
        if (caseType === 'return') {
            setReturnForm((current) => ({ ...current, evidenceFile: file || null }));
            return;
        }

        setInrForm((current) => ({ ...current, evidenceFile: file || null }));
    };

    const handlePayNow = async () => {
        setPaymentActionLoading(true);
        setCaseFeedback(null);

        try {
            const response = await checkoutService.createPaypalOrder(order.id);
            if (!response.success || !response.data) {
                throw new Error(response.message || 'Failed to initiate simulated PayPal payment.');
            }

            navigate(`/payment/simulate?orderId=${order.id}&paymentRef=${encodeURIComponent(response.data)}`);
        } catch (paymentError) {
            setCaseFeedback({
                type: 'error',
                title: 'Could not continue payment',
                message: paymentError.response?.data?.message || paymentError.message || 'Please try again later.'
            });
        } finally {
            setPaymentActionLoading(false);
        }
    };

    const handleRequestCancellation = async () => {
        const reason = window.prompt('Optional note for the seller. Leave blank if you do not want to add one.')?.trim() || null;
        const confirmed = window.confirm('Send a cancellation request for this order? The seller will need to approve or reject it.');

        if (!confirmed) {
            return;
        }

        setCancellationActionLoading(true);
        setCaseFeedback(null);

        try {
            const response = await requestCancellation(order.id, reason);
            if (!response.success) {
                throw new Error(response.error || 'Failed to send cancellation request.');
            }

            await fetchOrderById(order.id);
            setCaseFeedback({
                type: 'success',
                title: 'Cancellation request sent',
                message: 'The seller can now approve or reject your request.'
            });
        } catch (requestError) {
            setCaseFeedback({
                type: 'error',
                title: 'Could not send cancellation request',
                message: requestError.message || 'Please try again later.'
            });
        } finally {
            setCancellationActionLoading(false);
        }
    };

    return (
        <MyEbayLayout
            activeKey="orders"
            title="Purchase History"
            description="Review the order details and continue any after-purchase actions without leaving My eBay."
        >
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Order details</h1>
                    <p className="text-gray-600">
                        Order <span className="font-mono font-semibold text-gray-900">{order.orderNumber}</span>
                    </p>
                </div>
                <Link to="/orders" className="text-blue-600 hover:underline font-medium">
                    Back to orders
                </Link>
            </div>

            {order.isAuctionOrder && (
                <div className={`mb-6 rounded-2xl border px-5 py-4 ${
                    canPayAuctionOrder
                        ? 'border-blue-200 bg-blue-50'
                        : order.isPaymentOverdue
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                }`}>
                    <p className={`text-sm font-black uppercase tracking-wide ${
                        canPayAuctionOrder
                            ? 'text-blue-700'
                            : order.isPaymentOverdue
                                ? 'text-red-700'
                                : 'text-gray-700'
                    }`}>
                        {canPayAuctionOrder ? 'You won this auction' : 'Auction order'}
                    </p>
                    <p className={`mt-1 text-sm ${
                        canPayAuctionOrder
                            ? 'text-blue-900'
                            : order.isPaymentOverdue
                                ? 'text-red-900'
                                : 'text-gray-700'
                    }`}>
                        {canPayAuctionOrder
                            ? `Complete payment before ${formatDateTime(order.paymentDueAt)} to keep this order.`
                            : order.isPaymentOverdue
                                ? 'The payment window for this auction order has expired.'
                                : 'This order was created from an auction result.'}
                    </p>
                    {canPayAuctionOrder && (
                        <div className="mt-4 flex flex-wrap gap-3">
                            <Button onClick={handlePayNow} isLoading={paymentActionLoading}>
                                Pay now
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Order number</p>
                            <p className="font-mono font-semibold text-gray-900">{order.orderNumber}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Order status</p>
                            <p className="font-semibold text-gray-900 capitalize">{order.status}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Payment</p>
                            <p className="font-semibold text-gray-900">{formatPaymentMethod(order.paymentMethod)}</p>
                            <p className="text-sm text-gray-600 capitalize mt-1">{order.paymentStatus}</p>
                            {order.isAuctionOrder && order.paymentDueAt && (
                                <p className={`text-xs mt-1 ${order.isPaymentOverdue ? 'text-red-600 font-semibold' : 'text-amber-700'}`}>
                                    Payment deadline: {formatDateTime(order.paymentDueAt)}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Created at</p>
                            <p className="font-semibold text-gray-900">{formatDateTime(order.createdAt)}</p>
                        </div>
                    </div>
                    {(canPayAuctionOrder || (order.canRequestCancellation && !hasPendingCancellationRequest)) && (
                        <div className="mt-4 flex flex-wrap gap-3 justify-start">
                            {canPayAuctionOrder && (
                                <Button onClick={handlePayNow} isLoading={paymentActionLoading}>
                                    Pay now
                                </Button>
                            )}
                            {order.canRequestCancellation && !hasPendingCancellationRequest && (
                                <Button
                                    variant="outline"
                                    onClick={handleRequestCancellation}
                                    isLoading={cancellationActionLoading}
                                >
                                    Request cancel
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {order.cancellationRequest && (
                    <div className="p-6 border-b border-gray-200">
                        <div className={`rounded-lg border px-4 py-3 text-sm ${getCancellationRequestStyles(order.cancellationRequest.status)}`}>
                            <p className="text-[11px] uppercase font-black tracking-widest opacity-70 mb-1">Cancellation request</p>
                            <p className="font-semibold capitalize">{order.cancellationRequest.status}</p>
                            {order.cancellationRequest.reason && (
                                <p className="mt-1">Buyer note: {order.cancellationRequest.reason}</p>
                            )}
                            {order.cancellationRequest.sellerResponse && (
                                <p className="mt-1">Seller response: {order.cancellationRequest.sellerResponse}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Shipping summary</h2>
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
                        <p className="text-sm text-gray-600">Shipping details are not available for this order.</p>
                    )}
                </div>

                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Shipping / tracking</h2>
                    {order.shippingTracking ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Shipping status</p>
                                <p className="font-semibold text-gray-900 capitalize">{order.shippingTracking.status || 'Not available'}</p>
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
                            Tracking details are not available for this order yet.
                        </p>
                    )}
                </div>

                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between gap-4 mb-3">
                        <h2 className="text-lg font-bold text-gray-900">Buyer protection</h2>
                        <Link to="/cases" className="text-blue-600 hover:underline font-medium text-sm">
                            View my cases
                        </Link>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{caseContextMessage}</p>

                    {caseFeedback && (
                        <div
                            className={`rounded-lg border px-4 py-3 mb-4 ${
                                caseFeedback.type === 'success'
                                    ? 'border-green-200 bg-green-50 text-green-800'
                                    : 'border-red-200 bg-red-50 text-red-800'
                            }`}
                        >
                            <p className="font-semibold">{caseFeedback.title}</p>
                            <p className="text-sm mt-1">{caseFeedback.message}</p>
                        </div>
                    )}

                    {hasSupportedCaseAction ? (
                        <>
                            <div className="flex flex-wrap gap-3">
                                {returnOption?.eligible && (
                                    <Button
                                        variant={activeCaseAction === 'return' ? 'primary' : 'outline'}
                                        onClick={() => {
                                            setCaseFeedback(null);
                                            if (activeCaseAction !== 'return') {
                                                setReturnForm((current) => ({
                                                    ...current,
                                                    orderItemId: current.orderItemId || defaultOrderItemId
                                                }));
                                            }
                                            setActiveCaseAction(activeCaseAction === 'return' ? null : 'return');
                                        }}
                                    >
                                        Open return / refund
                                    </Button>
                                )}

                                {inrOption?.eligible && (
                                    <Button
                                        variant={activeCaseAction === 'inr' ? 'primary' : 'outline'}
                                        onClick={() => {
                                            setCaseFeedback(null);
                                            if (activeCaseAction !== 'inr') {
                                                setInrForm((current) => ({
                                                    ...current,
                                                    orderItemId: current.orderItemId || defaultOrderItemId
                                                }));
                                            }
                                            setActiveCaseAction(activeCaseAction === 'inr' ? null : 'inr');
                                        }}
                                    >
                                        Report item not received
                                    </Button>
                                )}
                            </div>

                            {activeCaseAction === 'return' && (
                                <form onSubmit={handleReturnSubmit} className="mt-5 border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                                    <CaseItemTargetPicker
                                        name="return-item-target"
                                        items={orderItems}
                                        selectedItemId={returnForm.orderItemId}
                                        onChange={(value) => setReturnForm((current) => ({ ...current, orderItemId: value }))}
                                        helperText="Choose a specific item where possible. This keeps return scope clearer for seller-first handling."
                                    />

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Return reason
                                        </label>
                                        <select
                                            value={returnForm.reasonCode}
                                            onChange={(event) => setReturnForm((current) => ({ ...current, reasonCode: event.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            required
                                        >
                                            <option value="">Select a return reason</option>
                                            {RETURN_REASON_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Preferred resolution
                                        </label>
                                        <select
                                            value={returnForm.resolutionType}
                                            onChange={(event) => setReturnForm((current) => ({ ...current, resolutionType: event.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        >
                                            <option value="return_for_refund">Return for refund</option>
                                            <option value="refund_only">Refund only</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Tell us what happened
                                        </label>
                                        <textarea
                                            value={returnForm.description}
                                            onChange={(event) => setReturnForm((current) => ({ ...current, description: event.target.value }))}
                                            className="w-full min-h-[120px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            placeholder="Describe the issue, what you received, and why you want a return or refund."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Upload evidence
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={(event) => handleCaseFileChange('return', event.target.files?.[0])}
                                            className="block w-full text-sm text-gray-700"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Optional. If provided, the file will be uploaded right after the request is created.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <Button type="submit" isLoading={submittingAction === 'return'}>
                                            Submit return request
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setActiveCaseAction(null)}
                                            disabled={submittingAction === 'return'}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {activeCaseAction === 'inr' && (
                                <form onSubmit={handleInrSubmit} className="mt-5 border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                                    <CaseItemTargetPicker
                                        name="inr-item-target"
                                        items={orderItems}
                                        selectedItemId={inrForm.orderItemId}
                                        onChange={(value) => setInrForm((current) => ({ ...current, orderItemId: value }))}
                                        helperText="If one item is the clearest missing item, select it. Otherwise keep this claim at order level."
                                    />

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            INR reason
                                        </label>
                                        <select
                                            value={inrForm.reasonCode}
                                            onChange={(event) => setInrForm((current) => ({ ...current, reasonCode: event.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            required
                                        >
                                            <option value="">Select an INR reason</option>
                                            {INR_REASON_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            What happened?
                                        </label>
                                        <textarea
                                            value={inrForm.description}
                                            onChange={(event) => setInrForm((current) => ({ ...current, description: event.target.value }))}
                                            className="w-full min-h-[120px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            placeholder="Describe the delivery issue, any missed updates, or what you expected by now."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Upload evidence
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={(event) => handleCaseFileChange('inr', event.target.files?.[0])}
                                            className="block w-full text-sm text-gray-700"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Optional. If provided, the file will be uploaded right after the INR request is created.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <Button type="submit" isLoading={submittingAction === 'inr'}>
                                            Submit INR claim
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setActiveCaseAction(null)}
                                            disabled={submittingAction === 'inr'}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-gray-600">
                            No supported buyer case actions are currently suggested for this order.
                        </p>
                    )}
                </div>

                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Items</h2>
                    <div className="space-y-4">
                        {order.items?.map((item) => (
                            <div key={item.id || `${order.id}-${item.productId}-${item.title}`} className="flex flex-col sm:flex-row gap-4 border border-gray-100 rounded-lg p-4">
                                <div className="w-24 h-24 border border-gray-100 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                                    <img src={item.image || 'https://via.placeholder.com/100'} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link to={`/products/${item.productId}`} className="font-bold text-gray-900 hover:text-secondary transition-colors">
                                            {item.title}
                                        </Link>
                                        {item.id && (
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-gray-700">
                                                Order item #{item.id}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">Quantity: {item.quantity}</p>
                                    <p className="text-sm text-gray-600">Price: {formatVND(item.price)}</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-2">Line total: {formatVND(item.totalPrice)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-b border-gray-200 bg-gray-50/40">
                    <OrderReviewActionsPanel orderId={order.id} />
                </div>

                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Order summary</h2>
                    <div className="space-y-2 text-sm text-gray-700 max-w-md">
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
                        <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900">
                            <span>Total</span>
                            <span>{formatVND(order.totalAmount)}</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button variant="outline" as={Link} to="/orders" className="font-bold">
                            Back to purchase history
                        </Button>
                    </div>
                </div>
            </div>
        </MyEbayLayout>
    );
}
