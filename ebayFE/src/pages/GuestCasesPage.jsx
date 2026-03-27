import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import guestCaseService from '../features/checkout/services/guestCaseService';

const formatDateTime = (value) => (
    value ? new Date(value).toLocaleString('en-US') : 'Not available'
);

const formatVND = (amount) => (
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
);

const getCaseKindLabel = (caseKind, type) => {
    if (caseKind === 'return') {
        return 'Return request';
    }

    if (caseKind === 'dispute' && type?.toLowerCase() === 'inr') {
        return 'INR claim';
    }

    if (caseKind === 'dispute' && type?.toLowerCase() === 'snad') {
        return 'SNAD claim';
    }

    if (caseKind === 'dispute' && type?.toLowerCase() === 'damaged') {
        return 'Damaged item claim';
    }

    if (caseKind === 'dispute') {
        return 'Dispute';
    }

    return 'Case';
};

const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending':
            return 'text-yellow-700 bg-yellow-50 border-yellow-200';
        case 'open':
            return 'text-blue-700 bg-blue-50 border-blue-200';
        case 'in_progress':
            return 'text-sky-700 bg-sky-50 border-sky-200';
        case 'approved':
        case 'resolved':
            return 'text-green-700 bg-green-50 border-green-200';
        case 'completed':
            return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        case 'rejected':
        case 'closed':
            return 'text-red-700 bg-red-50 border-red-200';
        default:
            return 'text-gray-700 bg-gray-50 border-gray-200';
    }
};

const buildLookupPath = (source, orderNumber) => {
    const params = new URLSearchParams();

    if (orderNumber) {
        params.set('orderNumber', orderNumber);
    }

    params.set('source', source);
    return `/guest/orders/lookup?${params.toString()}`;
};

const buildGuestOrderDetailPath = (orderNumber) => (
    orderNumber
        ? `/guest/orders/detail?orderNumber=${encodeURIComponent(orderNumber)}`
        : '/guest/orders/detail'
);

const buildGuestCaseDetailPath = (caseKind, caseId, orderNumber) => {
    const basePath = `/guest/cases/${caseKind}/${caseId}`;

    if (!orderNumber) {
        return basePath;
    }

    return `${basePath}?orderNumber=${encodeURIComponent(orderNumber)}`;
};

export default function GuestCasesPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const guestAccessFromState = location.state?.guestAccess || null;
    const orderFromState = location.state?.order || null;
    const recoveryOrderNumber = guestAccessFromState?.orderNumber
        || orderFromState?.orderNumber
        || searchParams.get('orderNumber')
        || '';
    const storedGuestAccess = useMemo(() => (
        recoveryOrderNumber
            ? guestCaseService.getStoredGuestAfterSalesAccess(recoveryOrderNumber)
            : null
    ), [recoveryOrderNumber]);
    const [activeGuestAccess, setActiveGuestAccess] = useState(() => guestAccessFromState || storedGuestAccess);
    const guestAccess = activeGuestAccess || guestAccessFromState || storedGuestAccess;
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(Boolean(recoveryOrderNumber && guestAccess?.email));
    const [error, setError] = useState('');

    useEffect(() => {
        setActiveGuestAccess(guestAccessFromState || storedGuestAccess);
    }, [
        guestAccessFromState?.orderNumber,
        guestAccessFromState?.email,
        guestAccessFromState?.accessToken,
        guestAccessFromState?.expiresAt,
        guestAccessFromState?.proofMethod,
        storedGuestAccess?.orderNumber,
        storedGuestAccess?.email,
        storedGuestAccess?.accessToken,
        storedGuestAccess?.expiresAt,
        storedGuestAccess?.proofMethod
    ]);

    useEffect(() => {
        if (guestAccess) {
            guestCaseService.storeGuestAfterSalesAccess(guestAccess);
        }
    }, [
        guestAccess?.orderNumber,
        guestAccess?.email,
        guestAccess?.accessToken,
        guestAccess?.expiresAt,
        guestAccess?.proofMethod
    ]);

    useEffect(() => {
        if (!recoveryOrderNumber || searchParams.get('orderNumber') === recoveryOrderNumber) {
            return;
        }

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('orderNumber', recoveryOrderNumber);

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
    }, [location.pathname, location.state, navigate, recoveryOrderNumber, searchParams]);

    useEffect(() => {
        if (!recoveryOrderNumber || !guestAccess?.email) {
            setLoading(false);
            setCases([]);
            return;
        }

        let active = true;

        const loadCases = async () => {
            setLoading(true);
            setError('');

            try {
                const result = await guestCaseService.getGuestCases(guestAccess);

                if (active) {
                    setCases(result.cases);
                    if (result.guestAccess) {
                        setActiveGuestAccess(result.guestAccess);
                    }
                }
            } catch (loadError) {
                if (active) {
                    setCases([]);
                    setError(loadError.response?.data?.message || loadError.message || 'We could not load your guest cases right now.');
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadCases();

        return () => {
            active = false;
        };
    }, [
        recoveryOrderNumber,
        guestAccess?.orderNumber,
        guestAccess?.email,
        guestAccess?.accessToken,
        guestAccess?.expiresAt
    ]);

    const lookupState = guestAccess?.email
        ? { email: guestAccess.email }
        : undefined;

    if (!recoveryOrderNumber || !guestAccess?.email) {
        return <Navigate to={buildLookupPath('cases', recoveryOrderNumber)} replace state={lookupState} />;
    }

    return (
        <div className="bg-[#f7f7f7] min-h-screen py-12 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Guest cases</h1>
                        <p className="text-gray-600">
                            Review the return requests and guest protection claims attached to your guest order. No login is required.
                        </p>
                    </div>
                    <Link
                        to={buildGuestOrderDetailPath(recoveryOrderNumber)}
                        state={{ guestAccess }}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Back to guest order
                    </Link>
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-gray-700 mb-6">
                    Guest case access is tied to order <span className="font-semibold text-gray-900">{recoveryOrderNumber}</span> and your checkout email.
                    We keep that guest access refreshed in this browser session while you review case updates.
                </div>

                {loading ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500 font-medium">
                        Loading your guest cases...
                    </div>
                ) : error ? (
                    <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
                        <p className="font-semibold text-red-700">{error}</p>
                        <Link
                            to={buildLookupPath('cases', recoveryOrderNumber)}
                            state={lookupState}
                            className="inline-block mt-4 text-blue-600 hover:underline font-medium"
                        >
                            Return to guest lookup
                        </Link>
                    </div>
                ) : cases.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-300 rounded-lg p-10 text-center">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No guest cases yet</h2>
                        <p className="text-gray-600">
                            When a guest return request or protection claim is opened for this order, it will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {cases.map((item) => (
                            <div key={`${item.caseKind}-${item.caseId}`} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Case</p>
                                        <p className="font-bold text-gray-900">
                                            {getCaseKindLabel(item.caseKind, item.type)} #{item.caseId}
                                        </p>
                                    </div>
                                    <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusStyles(item.status)}`}>
                                        {item.displayStatus || item.status}
                                    </div>
                                </div>

                                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-4">
                                        <div>
                                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Opened</p>
                                            <p className="text-sm font-semibold text-gray-900">{formatDateTime(item.createdAt)}</p>
                                        </div>

                                        {item.order && (
                                            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Order summary</p>
                                                <p className="font-semibold text-gray-900">Order {item.order.orderNumber}</p>
                                                <p className="text-gray-600 mt-1 capitalize">Order status: {item.order.status}</p>
                                                <p className="text-gray-600 capitalize">
                                                    Payment: {item.order.paymentMethod || 'Not available'} â€¢ {item.order.paymentStatus || 'Not available'}
                                                </p>
                                                {item.order.shippingStatus && (
                                                    <p className="text-gray-600 capitalize">Shipping: {item.order.shippingStatus}</p>
                                                )}
                                                <p className="text-gray-900 font-semibold mt-2">
                                                    Total: {formatVND(item.order.totalAmount)}
                                                </p>
                                            </div>
                                        )}

                                        {item.orderItem ? (
                                            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 flex gap-4">
                                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                                                    <img
                                                        src={item.orderItem.image || 'https://via.placeholder.com/100'}
                                                        alt={item.orderItem.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Linked item</p>
                                                    <p className="font-semibold text-gray-900">{item.orderItem.title}</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Qty {item.orderItem.quantity} â€¢ {formatVND(item.orderItem.totalPrice)}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                                This case is currently tracked at order level.
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Latest update</p>
                                            {item.latestEvent ? (
                                                <>
                                                    <p className="font-semibold text-gray-900">{item.latestEvent.message}</p>
                                                    <p className="text-gray-600 mt-1 capitalize">
                                                        {item.latestEvent.actorType} â€¢ {formatDateTime(item.latestEvent.createdAt)}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-gray-600">No timeline updates are available yet.</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <Link
                                                to={buildGuestCaseDetailPath(item.caseKind, item.caseId, item.order?.orderNumber || recoveryOrderNumber)}
                                                state={{ guestAccess }}
                                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors"
                                            >
                                                View guest case detail
                                            </Link>
                                            <Link
                                                to={buildGuestOrderDetailPath(item.order?.orderNumber || recoveryOrderNumber)}
                                                state={{ guestAccess }}
                                                className="inline-flex items-center justify-center rounded-md border-2 border-primary px-4 py-3 text-sm font-bold text-primary hover:bg-red-50 transition-colors"
                                            >
                                                View guest order
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
