import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import guestCaseService from '../features/checkout/services/guestCaseService';
import { Button } from '../components/ui/Button';
import caseEvidenceService from '../features/cases/services/caseEvidenceService';

const DEFAULT_RETURN_FORM = {
    orderItemId: '',
    reasonCode: '',
    resolutionType: 'return_for_refund',
    description: '',
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

const formatDateTime = (value) => (
    value ? new Date(value).toLocaleString('vi-VN') : 'Not available'
);

const formatVND = (amount) => (
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
);

const resolveDefaultOrderItemId = (items) => (
    items?.length === 1 && items[0]?.id ? String(items[0].id) : ''
);

function CaseItemTargetPicker({
    name,
    items,
    selectedItemId,
    onChange,
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
                                        Qty {item.quantity} • {formatVND(item.totalPrice)}
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

const buildLookupPath = (source, orderNumber) => {
    const params = new URLSearchParams();

    if (orderNumber) {
        params.set('orderNumber', orderNumber);
    }

    params.set('source', source);
    return `/guest/orders/lookup?${params.toString()}`;
};

const buildGuestCasesPath = (orderNumber) => {
    if (!orderNumber) {
        return '/guest/cases';
    }

    return `/guest/cases?orderNumber=${encodeURIComponent(orderNumber)}`;
};

export default function GuestOrderDetailPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderFromState = location.state?.order || null;
    const guestAccessFromState = location.state?.guestAccess || null;
    const recoveryOrderNumber = orderFromState?.orderNumber
        || guestAccessFromState?.orderNumber
        || searchParams.get('orderNumber')
        || '';
    const storedGuestAccess = useMemo(() => (
        recoveryOrderNumber
            ? guestCaseService.getStoredGuestAfterSalesAccess(recoveryOrderNumber)
            : null
    ), [recoveryOrderNumber]);
    const recoveryGuestAccess = guestAccessFromState || storedGuestAccess;
    const [order, setOrder] = useState(() => (
        orderFromState?.found ? orderFromState : null
    ));
    const [loading, setLoading] = useState(() => (
        !orderFromState?.found && Boolean(recoveryOrderNumber && recoveryGuestAccess?.email)
    ));
    const [error, setError] = useState('');
    const [showReturnForm, setShowReturnForm] = useState(false);
    const [returnForm, setReturnForm] = useState(DEFAULT_RETURN_FORM);
    const [submittingReturn, setSubmittingReturn] = useState(false);
    const [returnFeedback, setReturnFeedback] = useState(null);
    const [showInrForm, setShowInrForm] = useState(false);
    const [inrForm, setInrForm] = useState(DEFAULT_INR_FORM);
    const [submittingInr, setSubmittingInr] = useState(false);
    const [inrFeedback, setInrFeedback] = useState(null);

    useEffect(() => {
        if (recoveryGuestAccess) {
            guestCaseService.storeGuestAfterSalesAccess(recoveryGuestAccess);
        }
    }, [
        recoveryGuestAccess?.orderNumber,
        recoveryGuestAccess?.email,
        recoveryGuestAccess?.accessToken,
        recoveryGuestAccess?.expiresAt,
        recoveryGuestAccess?.proofMethod
    ]);

    const resolvedOrderNumber = order?.orderNumber || recoveryGuestAccess?.orderNumber || recoveryOrderNumber;
    const orderItems = order?.items || [];
    const defaultOrderItemId = resolveDefaultOrderItemId(orderItems);

    useEffect(() => {
        if (!resolvedOrderNumber || searchParams.get('orderNumber') === resolvedOrderNumber) {
            return;
        }

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('orderNumber', resolvedOrderNumber);

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
    }, [location.pathname, location.state, navigate, resolvedOrderNumber, searchParams]);

    useEffect(() => {
        if (orderFromState?.found) {
            setOrder(orderFromState);
            setLoading(false);
            setError('');
            return;
        }

        if (!recoveryOrderNumber || !recoveryGuestAccess?.email) {
            setOrder(null);
            setLoading(false);
            return;
        }

        let active = true;

        const reloadOrder = async () => {
            setLoading(true);
            setError('');

            try {
                const result = await guestCaseService.reloadGuestOrder(recoveryGuestAccess);

                if (!active) {
                    return;
                }

                if (result.order?.found) {
                    setOrder(result.order);
                    return;
                }

                setOrder(null);
            } catch (loadError) {
                if (!active) {
                    return;
                }

                setOrder(null);
                setError(loadError.response?.data?.message || loadError.message || 'We could not reload this guest order right now.');
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        reloadOrder();

        return () => {
            active = false;
        };
    }, [
        orderFromState,
        recoveryGuestAccess?.orderNumber,
        recoveryGuestAccess?.email,
        recoveryGuestAccess?.accessToken,
        recoveryGuestAccess?.expiresAt,
        recoveryGuestAccess?.proofMethod,
        recoveryOrderNumber
    ]);

    const lookupState = recoveryGuestAccess?.email
        ? { email: recoveryGuestAccess.email }
        : undefined;
    const afterSalesOptions = order?.afterSales?.options || [];
    const returnOption = afterSalesOptions.find((option) => option.requestType === 'return');
    const inrOption = afterSalesOptions.find((option) => option.requestType === 'inr');

    const handleReturnSubmit = async (event) => {
        event.preventDefault();
        if (!recoveryGuestAccess) {
            return;
        }

        setSubmittingReturn(true);
        setReturnFeedback(null);

        try {
            const selectedReason = RETURN_REASON_OPTIONS.find((option) => option.value === returnForm.reasonCode);
            const createdCase = await guestCaseService.createGuestReturnRequest(recoveryGuestAccess, {
                ...(returnForm.orderItemId ? { orderItemId: Number(returnForm.orderItemId) } : {}),
                reasonCode: returnForm.reasonCode.trim() || null,
                resolutionType: returnForm.resolutionType,
                reason: selectedReason?.label || 'Other return reason',
                description: returnForm.description.trim()
            });

            if (createdCase?.id && returnForm.evidenceFile) {
                await caseEvidenceService.uploadEvidence('return', createdCase.id, {
                    file: returnForm.evidenceFile,
                    label: 'Guest buyer evidence',
                    evidenceType: 'image'
                });
            }

            setReturnFeedback({
                type: 'success',
                title: 'Guest return request submitted',
                message: createdCase?.id
                    ? `Guest return request #${createdCase.id} was created successfully.`
                    : 'Your guest return request was created successfully.',
                caseId: createdCase?.id || null
            });
            setReturnForm({ ...DEFAULT_RETURN_FORM, orderItemId: defaultOrderItemId });
            setShowReturnForm(false);
        } catch (submitError) {
            setReturnFeedback({
                type: 'error',
                title: 'Could not submit return request',
                message: submitError.response?.data?.message || 'Please review the guest order context and try again.',
                caseId: null
            });
        } finally {
            setSubmittingReturn(false);
        }
    };

    const handleInrSubmit = async (event) => {
        event.preventDefault();
        if (!recoveryGuestAccess) {
            return;
        }

        setSubmittingInr(true);
        setInrFeedback(null);

        try {
            const createdCase = await guestCaseService.createGuestInrClaim(recoveryGuestAccess, {
                ...(inrForm.orderItemId ? { orderItemId: Number(inrForm.orderItemId) } : {}),
                ...(inrForm.reasonCode ? { reasonCode: inrForm.reasonCode } : {}),
                description: inrForm.description.trim()
            });

            if (createdCase?.id && inrForm.evidenceFile) {
                await caseEvidenceService.uploadEvidence('dispute', createdCase.id, {
                    file: inrForm.evidenceFile,
                    label: 'Guest buyer evidence',
                    evidenceType: 'image'
                });
            }

            setInrFeedback({
                type: 'success',
                title: 'Guest INR claim submitted',
                message: createdCase?.id
                    ? `Guest INR claim #${createdCase.id} was created successfully.`
                    : 'Your guest INR claim was created successfully.',
                caseId: createdCase?.id || null
            });
            setInrForm({ ...DEFAULT_INR_FORM, orderItemId: defaultOrderItemId });
            setShowInrForm(false);
        } catch (submitError) {
            setInrFeedback({
                type: 'error',
                title: 'Could not submit INR claim',
                message: submitError.response?.data?.message || 'Please review the guest order context and try again.',
                caseId: null
            });
        } finally {
            setSubmittingInr(false);
        }
    };

    const handleCaseFileChange = (caseType, file) => {
        if (caseType === 'return') {
            setReturnForm((current) => ({ ...current, evidenceFile: file || null }));
            return;
        }

        setInrForm((current) => ({ ...current, evidenceFile: file || null }));
    };

    if (loading) {
        return (
            <div className="bg-[#f7f7f7] min-h-screen py-12 px-4">
                <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm rounded-lg p-8 text-center text-gray-500 font-medium">
                    Reloading your guest order...
                </div>
            </div>
        );
    }

    if (!order?.found && !error) {
        return <Navigate to={buildLookupPath('detail', recoveryOrderNumber)} replace state={lookupState} />;
    }

    if (!order?.found) {
        return (
            <div className="bg-[#f7f7f7] min-h-screen py-12 px-4">
                <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm rounded-lg p-6 sm:p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Guest order details</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to={buildLookupPath('detail', recoveryOrderNumber)}
                            state={lookupState}
                            className="text-center px-6 py-3 rounded-full border border-gray-300 text-gray-900 font-medium hover:bg-gray-50"
                        >
                            Return to guest lookup
                        </Link>
                        <Link to="/" className="text-center px-6 py-3 rounded-full bg-[#3665f3] text-white font-medium hover:bg-blue-700">
                            Continue shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f7f7f7] min-h-screen py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm rounded-lg p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-gray-200 pb-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">Guest order details</h1>
                        <p className="text-sm text-gray-600">
                            This page shows your guest order summary and gives you a recovery path into guest cases without requiring sign-in.
                        </p>
                    </div>
                    <div className="text-left sm:text-right">
                        <span className="block text-sm text-gray-500 mb-1">Order number</span>
                        <span className="font-bold text-gray-900">{order.orderNumber}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm text-gray-700">
                    <div>
                        <span className="block text-gray-500 mb-1">Order status</span>
                        <span className="font-medium text-gray-900 capitalize">{order.status}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 mb-1">Payment method</span>
                        <span className="font-medium text-gray-900 uppercase">{order.paymentMethod}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 mb-1">Payment status</span>
                        <span className="font-medium text-gray-900 capitalize">{order.paymentStatus}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 mb-1">Created at</span>
                        <span className="font-medium text-gray-900">
                            {formatDateTime(order.createdAt)}
                        </span>
                    </div>
                </div>

                {order.shippingAddress && (
                    <div className="mb-6">
                        <h2 className="font-bold text-gray-900 mb-2">Shipping address</h2>
                        <div className="text-sm text-gray-700">
                            <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.street}</p>
                            <p>
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                            {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                        </div>
                    </div>
                )}

                {Array.isArray(order.items) && order.items.length > 0 && (
                    <div className="mb-6">
                        <h2 className="font-bold text-gray-900 mb-3">Items</h2>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id || `${item.productId}-${item.title}`} className="flex gap-4 border border-gray-100 rounded-lg p-4">
                                    {item.image && (
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-20 h-20 object-contain bg-gray-50 border border-gray-100 rounded"
                                        />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <p className="font-medium text-gray-900">{item.title}</p>
                                            {item.id && (
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-gray-700">
                                                    Order item #{item.id}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">Seller: {item.sellerDisplayName}</p>
                                        <p className="text-sm text-gray-600 mb-1">Quantity: {item.quantity}</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatVND(item.totalPrice)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {order.totals && (
                    <div className="border-t border-gray-200 pt-4 mb-6">
                        <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatVND(order.totals.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>{formatVND(order.totals.shippingFee)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total</span>
                                <span className="font-bold text-gray-900">
                                    {formatVND(order.totals.totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-gray-700">
                    <p className="font-medium text-gray-900 mb-1">Need after-sales help later?</p>
                    <p>
                        You still do not need to sign in. Use guest order lookup with this order number and checkout email to reopen your order and guest cases.
                    </p>
                </div>

                <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <p className="font-medium text-gray-900 mb-1">Guest buyer protection</p>
                            <p className="text-sm text-gray-600">
                                {returnOption?.eligible
                                    ? returnOption.message
                                    : inrOption?.eligible
                                        ? inrOption.message
                                        : returnOption?.message || inrOption?.message || 'Guest after-sales entry points appear here when the current order status looks compatible. If the backend needs stronger proof later, guest lookup remains the recovery path.'}
                            </p>
                        </div>

                        {(returnOption?.eligible || inrOption?.eligible) && (
                            <div className="flex flex-wrap gap-3">
                                {returnOption?.eligible && (
                                    <Button
                                        variant={showReturnForm ? 'primary' : 'outline'}
                                        onClick={() => {
                                            setReturnFeedback(null);
                                            setInrFeedback(null);
                                            setShowInrForm(false);
                                            if (!showReturnForm) {
                                                setReturnForm((current) => ({
                                                    ...current,
                                                    orderItemId: current.orderItemId || defaultOrderItemId
                                                }));
                                            }
                                            setShowReturnForm((current) => !current);
                                        }}
                                        disabled={submittingReturn}
                                    >
                                        Open return / refund
                                    </Button>
                                )}

                                {inrOption?.eligible && (
                                    <Button
                                        variant={showInrForm ? 'primary' : 'outline'}
                                        onClick={() => {
                                            setInrFeedback(null);
                                            setReturnFeedback(null);
                                            setShowReturnForm(false);
                                            if (!showInrForm) {
                                                setInrForm((current) => ({
                                                    ...current,
                                                    orderItemId: current.orderItemId || defaultOrderItemId
                                                }));
                                            }
                                            setShowInrForm((current) => !current);
                                        }}
                                        disabled={submittingInr}
                                    >
                                        Report item not received
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {returnFeedback && (
                        <div
                            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                                returnFeedback.type === 'success'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-red-200 bg-red-50 text-red-700'
                            }`}
                        >
                            <p className="font-semibold">{returnFeedback.title}</p>
                            <p className="mt-1">{returnFeedback.message}</p>
                            {returnFeedback.caseId && (
                                <Link
                                    to={`/guest/cases/return/${returnFeedback.caseId}?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                                    state={{ guestAccess: recoveryGuestAccess }}
                                    className="inline-block mt-2 font-semibold underline"
                                >
                                    View guest case detail
                                </Link>
                            )}
                        </div>
                    )}

                    {inrFeedback && (
                        <div
                            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                                inrFeedback.type === 'success'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-red-200 bg-red-50 text-red-700'
                            }`}
                        >
                            <p className="font-semibold">{inrFeedback.title}</p>
                            <p className="mt-1">{inrFeedback.message}</p>
                            {inrFeedback.caseId && (
                                <Link
                                    to={`/guest/cases/dispute/${inrFeedback.caseId}?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                                    state={{ guestAccess: recoveryGuestAccess }}
                                    className="inline-block mt-2 font-semibold underline"
                                >
                                    View guest case detail
                                </Link>
                            )}
                        </div>
                    )}

                    {showReturnForm && returnOption?.eligible && (
                        <form onSubmit={handleReturnSubmit} className="mt-5 border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
                            <CaseItemTargetPicker
                                name="guest-return-item-target"
                                items={orderItems}
                                selectedItemId={returnForm.orderItemId}
                                onChange={(value) => setReturnForm((current) => ({ ...current, orderItemId: value }))}
                                helperText="Choose a specific item where possible so the guest return request stays scoped cleanly."
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
                                    Requested resolution
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
                                    className="w-full text-sm text-gray-700"
                                />
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button type="submit" isLoading={submittingReturn}>
                                    Submit return request
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowReturnForm(false)}
                                    disabled={submittingReturn}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}

                    {showInrForm && inrOption?.eligible && (
                        <form onSubmit={handleInrSubmit} className="mt-5 border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
                            <CaseItemTargetPicker
                                name="guest-inr-item-target"
                                items={orderItems}
                                selectedItemId={inrForm.orderItemId}
                                onChange={(value) => setInrForm((current) => ({ ...current, orderItemId: value }))}
                                helperText="If one item is the clearest missing item, select it. Otherwise keep the INR claim at order level."
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
                                    Describe the delivery issue
                                </label>
                                <textarea
                                    value={inrForm.description}
                                    onChange={(event) => setInrForm((current) => ({ ...current, description: event.target.value }))}
                                    className="w-full min-h-[120px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Describe why you believe this item was not received."
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
                                    className="w-full text-sm text-gray-700"
                                />
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button type="submit" isLoading={submittingInr}>
                                    Submit INR claim
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowInrForm(false)}
                                    disabled={submittingInr}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to={buildGuestCasesPath(order.orderNumber)}
                        state={{ guestAccess: recoveryGuestAccess, order }}
                        className="text-center px-6 py-3 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
                    >
                        View your guest cases
                    </Link>
                    <Link
                        to={buildLookupPath('detail', order.orderNumber)}
                        state={lookupState}
                        className="text-center px-6 py-3 rounded-full border border-gray-300 text-gray-900 font-medium hover:bg-gray-50"
                    >
                        Look up another order
                    </Link>
                    <Link to="/" className="text-center px-6 py-3 rounded-full bg-[#3665f3] text-white font-medium hover:bg-blue-700">
                        Continue shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
