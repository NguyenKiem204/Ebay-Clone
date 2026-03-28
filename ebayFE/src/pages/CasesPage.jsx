import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import caseService from '../features/cases/services/caseService';

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

    if (caseKind === 'dispute' && type?.toLowerCase() === 'return_escalation') {
        return 'Escalated return dispute';
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

const formatDateTime = (value) => (
    value ? new Date(value).toLocaleString('en-US') : 'Not available'
);

const formatVND = (amount) => (
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
);

const formatAge = (hours) => {
    if (hours == null) {
        return 'Not available';
    }

    if (hours < 24) {
        return `${hours}h`;
    }

    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
};

const getLifecycleCopy = (caseKind, status) => {
    const normalizedStatus = status?.toLowerCase();

    if (caseKind === 'return') {
        switch (normalizedStatus) {
            case 'pending':
                return {
                    title: 'Waiting for seller response',
                    description: 'Your return request has been opened and is waiting for the seller or platform to respond.'
                };
            case 'approved':
                return {
                    title: 'Return approved',
                    description: 'The return has been approved and is moving toward completion.'
                };
            case 'completed':
                return {
                    title: 'Return completed',
                    description: 'This return request has reached a completed outcome.'
                };
            case 'rejected':
                return {
                    title: 'Return rejected',
                    description: 'This return request was rejected. You can review the latest update and timeline for details.'
                };
            default:
                return {
                    title: 'Return in progress',
                    description: 'This return request is active. Review the latest case update for the current handling state.'
                };
        }
    }

    switch (normalizedStatus) {
        case 'open':
            return {
                title: 'Protection case opened',
                description: 'Your buyer protection claim is open and awaiting operational review.'
            };
        case 'in_progress':
            return {
                title: 'Case under review',
                description: 'Your claim is actively being reviewed by the responsible seller or platform team.'
            };
        case 'resolved':
            return {
                title: 'Case resolved',
                description: 'A resolution has been recorded for this claim. Review the detail page for the outcome.'
            };
        case 'closed':
            return {
                title: 'Case closed',
                description: 'This claim is closed. Review the timeline for the closing details.'
            };
        default:
            return {
                title: 'Case in progress',
                description: 'This buyer protection case is active. Review the latest update for the current state.'
            };
    }
};

const getSlaStyles = (sla) => {
    if (!sla?.dueBy) {
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }

    if (sla.isOverdue) {
        return 'text-red-700 bg-red-50 border-red-200';
    }

    if (sla.reminderSuggested) {
        return 'text-amber-700 bg-amber-50 border-amber-200';
    }

    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
};

export default function CasesPage() {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        let active = true;

        const loadCases = async () => {
            setLoading(true);
            setError('');

            try {
                const data = await caseService.getCases();
                if (active) {
                    setCases(data);
                }
            } catch (loadError) {
                if (active) {
                    setError(loadError.response?.data?.message || loadError.message || 'Failed to load your cases.');
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
    }, []);

    const filteredCases = useMemo(() => {
        if (activeFilter === 'all') {
            return cases;
        }

        return cases.filter((item) => {
            const displayStatus = (item.displayStatus || item.status || '').toLowerCase();

            switch (activeFilter) {
                case 'open':
                    return ['waiting seller response', 'seller responded', 'escalated to platform', 'return shipping required', 'buyer shipped return'].includes(displayStatus);
                case 'waiting':
                    return ['waiting seller response', 'return shipping required'].includes(displayStatus);
                case 'approved':
                    return ['approved refund only', 'seller responded', 'escalated to platform', 'seller received return'].includes(displayStatus);
                case 'refunded':
                    return ['refunded', 'resolved refunded'].includes(displayStatus);
                case 'closed':
                    return ['closed', 'cancelled', 'rejected', 'resolved delivered'].includes(displayStatus);
                default:
                    return true;
            }
        });
    }, [activeFilter, cases]);

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">My cases</h1>
                    <p className="text-gray-600">
                        Track your return / refund and item-not-received requests in one place.
                    </p>
                </div>
                <Link to="/orders" className="text-blue-600 hover:underline font-medium">
                    Back to orders
                </Link>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {[
                    ['all', 'All'],
                    ['open', 'Open'],
                    ['waiting', 'Waiting'],
                    ['approved', 'Approved'],
                    ['refunded', 'Refunded'],
                    ['closed', 'Closed']
                ].map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setActiveFilter(value)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${activeFilter === value
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500 font-medium">
                    Loading your cases...
                </div>
            ) : error ? (
                <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
                    <p className="font-semibold text-red-700">{error}</p>
                    <Link to="/orders" className="inline-block mt-4 text-blue-600 hover:underline font-medium">
                        Back to orders
                    </Link>
                </div>
            ) : filteredCases.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-lg p-10 text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No cases yet</h2>
                    <p className="text-gray-600">
                        No cases match the current filter.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredCases.map((item) => (
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

                            <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
                                <div className="xl:col-span-2 space-y-4">
                                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                                        <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Lifecycle</p>
                                        <p className="font-semibold text-gray-900">
                                            {item.displayStatus || getLifecycleCopy(item.caseKind, item.status).title}
                                        </p>
                                        <p className="text-gray-600 mt-1">
                                            {item.nextAction || getLifecycleCopy(item.caseKind, item.status).description}
                                        </p>
                                        {item.closedAt && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                Closed at {formatDateTime(item.closedAt)}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Opened</p>
                                        <p className="text-sm font-semibold text-gray-900">{formatDateTime(item.createdAt)}</p>
                                    </div>

                                    {item.order && (
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Order summary</p>
                                            <p className="font-semibold text-gray-900">
                                                Order {item.order.orderNumber}
                                            </p>
                                            <p className="text-gray-600 mt-1 capitalize">
                                                Order status: {item.order.status}
                                            </p>
                                            <p className="text-gray-600 capitalize">
                                                Payment: {item.order.paymentMethod || 'Not available'} â€¢ {item.order.paymentStatus || 'Not available'}
                                            </p>
                                            {item.order.shippingStatus && (
                                                <p className="text-gray-600 capitalize">
                                                    Shipping: {item.order.shippingStatus}
                                                </p>
                                            )}
                                            <p className="text-gray-900 font-semibold mt-2">
                                                Total: {formatVND(item.order.totalAmount)}
                                            </p>
                                        </div>
                                    )}

                                    {item.orderItem && (
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 flex gap-4">
                                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                                                <img
                                                    src={item.orderItem.image || 'https://via.placeholder.com/100'}
                                                    alt={item.orderItem.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Order item</p>
                                                <p className="font-semibold text-gray-900">{item.orderItem.title}</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Seller: {item.orderItem.sellerDisplayName || 'Not available'}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Qty {item.orderItem.quantity} â€¢ {formatVND(item.orderItem.totalPrice)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                                        <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Handling window</p>
                                        {item.sla?.dueBy ? (
                                            <>
                                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getSlaStyles(item.sla)}`}>
                                                    {item.sla.isOverdue ? 'Overdue' : item.sla.stageLabel}
                                                </span>
                                                <p className="text-gray-900 font-semibold mt-3">
                                                    Due by {formatDateTime(item.sla.dueBy)}
                                                </p>
                                                <p className="text-gray-600 mt-1">
                                                    Case age: {formatAge(item.sla.ageHours)}
                                                </p>
                                                <p className="text-gray-600 mt-1">
                                                    {item.sla.isOverdue && item.sla.hoursOverdue != null
                                                        ? `Overdue by ${item.sla.hoursOverdue}h`
                                                        : item.sla.hoursUntilDue != null
                                                            ? `${item.sla.hoursUntilDue}h remaining in the current handling window`
                                                            : 'This case is within its current handling window.'}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-semibold text-gray-900">No active deadline</p>
                                                <p className="text-gray-600 mt-1">
                                                    This case does not currently expose an active SLA window in backend truth.
                                                </p>
                                                {item.sla?.ageHours != null && (
                                                    <p className="text-gray-600 mt-1">
                                                        Case age: {formatAge(item.sla.ageHours)}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>

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
                                            to={`/cases/${item.caseKind}/${item.caseId}`}
                                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors"
                                        >
                                            View case detail
                                        </Link>
                                        {item.order?.id && (
                                            <Link
                                                to={`/orders/${item.order.id}`}
                                                className="inline-flex items-center justify-center rounded-md border-2 border-primary px-4 py-3 text-sm font-bold text-primary hover:bg-red-50 transition-colors"
                                            >
                                                View order
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
