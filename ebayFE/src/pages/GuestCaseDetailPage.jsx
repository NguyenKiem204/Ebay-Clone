import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import guestCaseService from '../features/checkout/services/guestCaseService';
import { BASE_URL } from '../lib/axios';

const formatDateTime = (value) => (value ? new Date(value).toLocaleString('vi-VN') : 'Not available');
const formatVND = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
const formatAge = (hours) => (hours == null ? 'Not available' : hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d ${hours % 24}h`);
const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getCaseTitle = (caseKind, caseData) => {
    if (caseKind === 'return') return `Guest return request #${caseData.id}`;
    if (caseKind === 'dispute' && caseData.caseType?.toLowerCase() === 'inr') return `Guest INR claim #${caseData.id}`;
    if (caseKind === 'dispute' && caseData.caseType?.toLowerCase() === 'snad') return `Guest SNAD claim #${caseData.id}`;
    if (caseKind === 'dispute' && caseData.caseType?.toLowerCase() === 'damaged') return `Guest damaged item claim #${caseData.id}`;
    if (caseKind === 'dispute') return `Guest dispute #${caseData.id}`;
    return 'Guest case detail';
};

const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
        case 'open': return 'text-blue-700 bg-blue-50 border-blue-200';
        case 'in_progress': return 'text-sky-700 bg-sky-50 border-sky-200';
        case 'approved':
        case 'resolved': return 'text-green-700 bg-green-50 border-green-200';
        case 'completed': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        case 'rejected':
        case 'closed': return 'text-red-700 bg-red-50 border-red-200';
        default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
};

const buildLookupPath = (source, orderNumber) => {
    const params = new URLSearchParams();
    if (orderNumber) params.set('orderNumber', orderNumber);
    params.set('source', source);
    return `/guest/orders/lookup?${params.toString()}`;
};

const buildGuestCasesPath = (orderNumber) => (
    orderNumber ? `/guest/cases?orderNumber=${encodeURIComponent(orderNumber)}` : '/guest/cases'
);

const buildGuestOrderDetailPath = (orderNumber) => (
    orderNumber ? `/guest/orders/detail?orderNumber=${encodeURIComponent(orderNumber)}` : '/guest/orders/detail'
);

const getEvidenceFileUrl = (filePath) => (filePath ? `${BASE_URL}${filePath}` : '#');

export default function GuestCaseDetailPage() {
    const { caseKind, id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const guestAccessFromState = location.state?.guestAccess || null;
    const recoveryOrderNumber = guestAccessFromState?.orderNumber || searchParams.get('orderNumber') || '';
    const storedGuestAccess = useMemo(() => (
        recoveryOrderNumber ? guestCaseService.getStoredGuestAfterSalesAccess(recoveryOrderNumber) : null
    ), [recoveryOrderNumber]);
    const [activeGuestAccess, setActiveGuestAccess] = useState(() => guestAccessFromState || storedGuestAccess);
    const guestAccess = activeGuestAccess || guestAccessFromState || storedGuestAccess;
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(Boolean(caseKind && id && recoveryOrderNumber && guestAccess?.email));
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
    }, [guestAccess?.orderNumber, guestAccess?.email, guestAccess?.accessToken, guestAccess?.expiresAt, guestAccess?.proofMethod]);

    const resolvedOrderNumber = caseData?.order?.orderNumber || recoveryOrderNumber;

    useEffect(() => {
        if (!resolvedOrderNumber || searchParams.get('orderNumber') === resolvedOrderNumber) {
            return;
        }

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('orderNumber', resolvedOrderNumber);
        navigate({ pathname: location.pathname, search: `?${nextParams.toString()}` }, { replace: true, state: location.state });
    }, [location.pathname, location.state, navigate, resolvedOrderNumber, searchParams]);

    useEffect(() => {
        if (!caseKind || !id || !recoveryOrderNumber || !guestAccess?.email) {
            setLoading(false);
            setCaseData(null);
            return;
        }

        let active = true;

        const loadCaseDetail = async () => {
            setLoading(true);
            setError('');

            try {
                const result = await guestCaseService.getGuestCaseDetail(caseKind, id, guestAccess);
                if (active) {
                    setCaseData(result.caseData);
                    if (result.guestAccess) {
                        setActiveGuestAccess(result.guestAccess);
                    }
                }
            } catch (loadError) {
                if (active) {
                    setCaseData(null);
                    setError(loadError.response?.data?.message || loadError.message || 'We could not load this guest case right now.');
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadCaseDetail();
        return () => { active = false; };
    }, [caseKind, id, recoveryOrderNumber, guestAccess?.orderNumber, guestAccess?.email, guestAccess?.accessToken, guestAccess?.expiresAt]);

    const lookupState = guestAccess?.email ? { email: guestAccess.email } : undefined;

    if (!recoveryOrderNumber || !guestAccess?.email) {
        return <Navigate to={buildLookupPath('case-detail', recoveryOrderNumber)} replace state={lookupState} />;
    }

    if (loading) {
        return (
            <div className="bg-[#f7f7f7] min-h-screen py-12 px-4">
                <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500 font-medium">
                    Loading your guest case...
                </div>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="bg-[#f7f7f7] min-h-screen py-12 px-4">
                <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Guest case detail</h1>
                    <p className="text-gray-600 mb-6">{error || 'We could not load this guest case right now.'}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to={buildGuestCasesPath(recoveryOrderNumber)} state={{ guestAccess }} className="text-center px-6 py-3 rounded-full border border-gray-300 text-gray-900 font-medium hover:bg-gray-50">
                            Back to guest cases
                        </Link>
                        <Link to={buildLookupPath('case-detail', recoveryOrderNumber)} state={lookupState} className="text-center px-6 py-3 rounded-full bg-[#3665f3] text-white font-medium hover:bg-blue-700">
                            Return to guest lookup
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f7f7f7] min-h-screen py-12 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">{getCaseTitle(caseKind, caseData)}</h1>
                        <p className="text-gray-600">Review the backend-truth status, evidence, and timeline for this guest case. We keep guest access refreshed here while you stay in this recovery flow.</p>
                    </div>
                    <Link to={buildGuestCasesPath(resolvedOrderNumber)} state={{ guestAccess }} className="text-blue-600 hover:underline font-medium">
                        Back to guest cases
                    </Link>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Case ID</p>
                                <p className="font-mono font-semibold text-gray-900">{caseData.id}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Status</p>
                                <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusStyles(caseData.status)}`}>
                                    {caseData.status}
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Opened</p>
                                <p className="font-semibold text-gray-900">{formatDateTime(caseData.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Closed</p>
                                <p className="font-semibold text-gray-900">{formatDateTime(caseData.closedAt)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Case summary</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {'requestType' in caseData && <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Request type</p><p className="font-semibold text-gray-900 capitalize">{caseData.requestType || 'Not available'}</p></div>}
                            {'caseType' in caseData && <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Case type</p><p className="font-semibold text-gray-900 capitalize">{caseData.caseType || 'Not available'}</p></div>}
                            {'reasonCode' in caseData && <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Reason code</p><p className="font-semibold text-gray-900">{caseData.reasonCode || 'Not provided'}</p></div>}
                            {'resolutionType' in caseData && <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Requested resolution</p><p className="font-semibold text-gray-900 capitalize">{caseData.resolutionType || 'Not available'}</p></div>}
                            {'refundAmount' in caseData && caseData.refundAmount != null && <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Refund amount</p><p className="font-semibold text-gray-900">{formatVND(caseData.refundAmount)}</p></div>}
                            {'resolvedAt' in caseData && caseData.resolvedAt && <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Resolved at</p><p className="font-semibold text-gray-900">{formatDateTime(caseData.resolvedAt)}</p></div>}
                            {'reason' in caseData && <div className="md:col-span-2"><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Reason</p><p className="text-gray-700">{caseData.reason || 'Not provided'}</p></div>}
                            {'description' in caseData && <div className="md:col-span-2"><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Description</p><p className="text-gray-700">{caseData.description || 'Not provided'}</p></div>}
                            {'resolution' in caseData && caseData.resolution && <div className="md:col-span-2"><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Resolution</p><p className="text-gray-700">{caseData.resolution}</p></div>}
                            {'closedReason' in caseData && caseData.closedReason && <div className="md:col-span-2"><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Closed reason</p><p className="text-gray-700">{caseData.closedReason}</p></div>}
                            <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Case scope</p><p className="font-semibold text-gray-900">{caseData.orderItemId ? 'Item-level case' : 'Order-level case'}</p></div>
                            {caseData.orderItemId && <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Linked order item ID</p><p className="font-mono font-semibold text-gray-900">{caseData.orderItemId}</p></div>}
                        </div>
                    </div>

                    {caseData.sla && (
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Handling window</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Current stage</p><p className="font-semibold text-gray-900">{caseData.sla.stageLabel || 'Not available'}</p></div>
                                <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Due by</p><p className="font-semibold text-gray-900">{formatDateTime(caseData.sla.dueBy)}</p></div>
                                <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Case age</p><p className="font-semibold text-gray-900">{formatAge(caseData.sla.ageHours)}</p></div>
                                <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Deadline state</p><p className={`font-semibold ${caseData.sla.isOverdue ? 'text-red-700' : 'text-gray-900'}`}>{caseData.sla.isOverdue ? `Overdue by ${caseData.sla.hoursOverdue || 0}h` : caseData.sla.hoursUntilDue != null ? `${caseData.sla.hoursUntilDue}h remaining` : 'No active deadline'}</p></div>
                            </div>
                        </div>
                    )}

                    {caseData.order && (
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <h2 className="text-lg font-bold text-gray-900">Linked order</h2>
                                <Link to={buildGuestOrderDetailPath(caseData.order.orderNumber)} state={{ guestAccess }} className="text-blue-600 hover:underline font-medium">
                                    View guest order
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Order number</p><p className="font-mono font-semibold text-gray-900">{caseData.order.orderNumber}</p></div>
                                <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Order status</p><p className="font-semibold text-gray-900 capitalize">{caseData.order.status}</p></div>
                                <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Payment</p><p className="font-semibold text-gray-900 capitalize">{caseData.order.paymentMethod || 'Not available'} • {caseData.order.paymentStatus || 'Not available'}</p></div>
                                <div><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Shipping</p><p className="font-semibold text-gray-900 capitalize">{caseData.order.shippingStatus || 'Not available'}</p></div>
                            </div>
                            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Order total</p>
                                <p className="font-semibold text-gray-900">{formatVND(caseData.order.totalAmount)}</p>
                            </div>
                        </div>
                    )}

                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">{caseData.orderItem ? 'Linked order item' : 'Case scope'}</h2>
                        {caseData.orderItem ? (
                            <div className="flex flex-col sm:flex-row gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                                    <img src={caseData.orderItem.image || 'https://via.placeholder.com/100'} alt={caseData.orderItem.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-gray-900">{caseData.orderItem.title}</p>
                                        <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-bold tracking-wide text-gray-700 border border-gray-200">
                                            Order item #{caseData.orderItem.id || caseData.orderItemId}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">Seller: {caseData.orderItem.sellerDisplayName || 'Not available'}</p>
                                    <p className="text-sm text-gray-600">Qty {caseData.orderItem.quantity} • Unit price {formatVND(caseData.orderItem.unitPrice)}</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-2">Line total: {formatVND(caseData.orderItem.totalPrice)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                                This guest case is tracked at order level. No specific order item is linked in backend truth.
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Evidence</h2>
                        {caseData.evidence?.length > 0 ? (
                            <div className="space-y-3">
                                {caseData.evidence.map((attachment) => (
                                    <div key={attachment.id} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 break-words">{attachment.label || attachment.originalFileName}</p>
                                            <p className="text-sm text-gray-600 break-words mt-1">{attachment.evidenceType || 'General evidence'} • {formatFileSize(attachment.fileSizeBytes)}</p>
                                            <p className="text-sm text-gray-600 mt-1">Uploaded by {attachment.uploadedByDisplayName || 'case participant'} on {formatDateTime(attachment.uploadedAt)}</p>
                                        </div>
                                        <a href={getEvidenceFileUrl(attachment.filePath)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white">
                                            Open file
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                                No evidence has been attached to this case yet.
                            </div>
                        )}
                    </div>

                    <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Timeline</h2>
                        {caseData.timeline?.length > 0 ? (
                            <div className="space-y-4">
                                {caseData.timeline.map((event) => (
                                    <div key={event.id} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                            <div>
                                                <p className="font-semibold text-gray-900">{event.message}</p>
                                                <p className="text-xs uppercase tracking-wider font-bold text-gray-500 mt-1">{event.eventType}</p>
                                            </div>
                                            <div className="text-right text-sm text-gray-600">
                                                <p className="capitalize font-medium">{event.actorDisplayName || event.actorType}</p>
                                                <p>{formatDateTime(event.createdAt)}</p>
                                            </div>
                                        </div>
                                        {event.metadataJson && (
                                            <details className="text-xs text-gray-500 mt-2">
                                                <summary className="cursor-pointer select-none">Event metadata</summary>
                                                <pre className="mt-2 whitespace-pre-wrap break-words bg-white border border-gray-100 rounded-md p-3">{event.metadataJson}</pre>
                                            </details>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">No timeline events are available for this guest case yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
