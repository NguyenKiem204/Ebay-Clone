import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import opsCaseService from '../../features/cases/services/opsCaseService';

const formatDateTime = (value) => (
    value ? new Date(value).toLocaleString('vi-VN') : 'Not available'
);

const formatVND = (amount) => (
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
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

const getCaseLabel = (caseKind, type) => {
    if (caseKind === 'return') {
        return 'Return request';
    }

    switch (type?.toLowerCase()) {
        case 'inr':
            return 'INR claim';
        case 'snad':
            return 'SNAD claim';
        case 'damaged':
            return 'Damaged item claim';
        case 'return_escalation':
            return 'Escalated return dispute';
        default:
            return 'Dispute';
    }
};

const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending':
        case 'open':
            return 'text-amber-700 bg-amber-50 border-amber-200';
        case 'approved':
        case 'in_progress':
            return 'text-blue-700 bg-blue-50 border-blue-200';
        case 'resolved':
        case 'completed':
            return 'text-green-700 bg-green-50 border-green-200';
        case 'rejected':
        case 'closed':
            return 'text-red-700 bg-red-50 border-red-200';
        default:
            return 'text-gray-700 bg-gray-50 border-gray-200';
    }
};

export default function SellerCasesQueuePage() {
    const { user } = useAuthStore();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [kindFilter, setKindFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const overdueCount = useMemo(
        () => cases.filter((item) => item.sla?.isOverdue).length,
        [cases]
    );

    useEffect(() => {
        let active = true;

        const loadQueue = async () => {
            setLoading(true);
            setError('');

            try {
                const data = await opsCaseService.getQueueCases();
                if (active) {
                    setCases(data);
                }
            } catch (loadError) {
                if (active) {
                    setError(loadError.response?.data?.message || loadError.message || 'Failed to load the operations queue.');
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadQueue();

        return () => {
            active = false;
        };
    }, []);

    const filteredCases = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return cases.filter((item) => {
            if (statusFilter !== 'all' && item.status?.toLowerCase() !== statusFilter) {
                return false;
            }

            if (kindFilter !== 'all' && item.caseKind?.toLowerCase() !== kindFilter) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            const haystack = [
                item.caseId,
                item.type,
                item.status,
                item.order?.orderNumber,
                item.orderItem?.title,
                item.latestEvent?.message
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(normalizedSearch);
        });
    }, [cases, kindFilter, searchTerm, statusFilter]);

    const roleLabel = user?.role?.toLowerCase() === 'admin' ? 'Admin fallback queue' : 'Seller operations queue';

    if (!user || !['seller', 'admin'].includes(user.role?.toLowerCase())) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Operations queue</h2>
                <p className="text-gray-600">This view is available to seller and admin users only.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] uppercase tracking-widest font-black text-gray-500 mb-2">Operations</p>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Cases queue</h1>
                    <p className="text-gray-600">
                        {roleLabel}. Use this queue to review live return requests and disputes with the latest backend truth.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm min-w-[180px]">
                        <p className="text-gray-500 font-semibold mb-1">Visible cases</p>
                        <p className="text-2xl font-bold text-gray-900">{filteredCases.length}</p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm min-w-[180px]">
                        <p className="text-red-600 font-semibold mb-1">Overdue cases</p>
                        <p className="text-2xl font-bold text-red-700">{overdueCount}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by order number, case, item..."
                        className="h-11 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <select
                        value={kindFilter}
                        onChange={(event) => setKindFilter(event.target.value)}
                        className="h-11 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="all">All case kinds</option>
                        <option value="return">Return requests</option>
                        <option value="dispute">Disputes</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="h-11 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="open">Open</option>
                        <option value="approved">Approved</option>
                        <option value="in_progress">In progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                        <option value="completed">Completed</option>
                        <option value="closed">Closed</option>
                    </select>
                    <button
                        type="button"
                        onClick={() => {
                            setSearchTerm('');
                            setKindFilter('all');
                            setStatusFilter('all');
                        }}
                        className="h-11 rounded-md border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50"
                    >
                        Clear filters
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500 font-medium">
                    Loading operations queue...
                </div>
            ) : error ? (
                <div className="rounded-lg border border-red-200 bg-white p-10 text-center">
                    <p className="font-semibold text-red-700">{error}</p>
                </div>
            ) : filteredCases.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No cases in this view</h2>
                    <p className="text-gray-600">Try adjusting the filters or come back when new cases enter the queue.</p>
                </div>
            ) : (
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-[11px] text-gray-500 font-black uppercase tracking-widest">
                                <tr>
                                    <th className="px-5 py-3 text-left">Case</th>
                                    <th className="px-5 py-3 text-left">Status</th>
                                    <th className="px-5 py-3 text-left">Opened</th>
                                    <th className="px-5 py-3 text-left">Order</th>
                                    <th className="px-5 py-3 text-left">SLA</th>
                                    <th className="px-5 py-3 text-left">Latest update</th>
                                    <th className="px-5 py-3 text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredCases.map((item) => (
                                    <tr key={`${item.caseKind}-${item.caseId}`} className="hover:bg-gray-50/70">
                                        <td className="px-5 py-4 align-top">
                                            <p className="font-semibold text-gray-900">
                                                {getCaseLabel(item.caseKind, item.type)} #{item.caseId}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 capitalize">
                                                {item.type || item.caseKind}
                                            </p>
                                            {item.orderItem && (
                                                <p className="text-xs text-gray-600 mt-2 max-w-xs">
                                                    {item.orderItem.title}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusStyles(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 align-top text-gray-700">
                                            {formatDateTime(item.createdAt)}
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            {item.order ? (
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-gray-900">{item.order.orderNumber}</p>
                                                    <p className="text-xs text-gray-600 capitalize">
                                                        {item.order.status} • {item.order.paymentStatus}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {formatVND(item.order.totalAmount)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">Not available</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            {item.sla?.dueBy ? (
                                                <div className="space-y-1 max-w-[220px]">
                                                    <span
                                                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                                                            item.sla.isOverdue
                                                                ? 'text-red-700 bg-red-50 border-red-200'
                                                                : item.sla.reminderSuggested
                                                                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                                                                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                                        }`}
                                                    >
                                                        {item.sla.isOverdue ? 'Overdue' : item.sla.stageLabel}
                                                    </span>
                                                    <p className="text-xs text-gray-700">
                                                        Due by {formatDateTime(item.sla.dueBy)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Age {formatAge(item.sla.ageHours)}
                                                        {item.sla.isOverdue && item.sla.hoursOverdue != null
                                                            ? ` • ${item.sla.hoursOverdue}h overdue`
                                                            : item.sla.hoursUntilDue != null
                                                                ? ` • ${item.sla.hoursUntilDue}h left`
                                                                : ''}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-600">
                                                        No active SLA
                                                    </span>
                                                    <p className="text-xs text-gray-500">Age {formatAge(item.sla?.ageHours ?? 0)}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            {item.latestEvent ? (
                                                <div className="space-y-1 max-w-sm">
                                                    <p className="text-gray-900">{item.latestEvent.message}</p>
                                                    <p className="text-xs text-gray-500 capitalize">
                                                        {item.latestEvent.actorType} • {formatDateTime(item.latestEvent.createdAt)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">No timeline events yet</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <Link
                                                to={`/seller/cases/${item.caseKind}/${item.caseId}`}
                                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
                                            >
                                                Open case
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
