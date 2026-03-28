import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import useAuthStore from '../../store/useAuthStore';
import opsCaseService from '../../features/cases/services/opsCaseService';
import caseEvidenceService from '../../features/cases/services/caseEvidenceService';
import { BASE_URL } from '../../lib/axios';

const formatDateTime = (value) => (
    value ? new Date(value).toLocaleString('en-US') : 'Not available'
);

const formatVND = (amount) => (
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
);

const formatFileSize = (bytes) => {
    if (!bytes) {
        return '0 B';
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatAge = (hours) => {
    if (hours == null) {
        return 'Not available';
    }

    if (hours < 24) {
        return `${hours}h`;
    }

    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
};

const getEvidenceFileUrl = (filePath) => (
    filePath ? `${BASE_URL}${filePath}` : '#'
);

const getCaseTitle = (caseKind, caseData) => {
    if (caseKind === 'return') {
        return `Return request #${caseData.id}`;
    }

    switch (caseData.caseType?.toLowerCase()) {
        case 'inr':
            return `INR claim #${caseData.id}`;
        case 'snad':
            return `SNAD claim #${caseData.id}`;
        case 'damaged':
            return `Damaged item claim #${caseData.id}`;
        case 'return_escalation':
            return `Escalated return dispute #${caseData.id}`;
        default:
            return `Dispute #${caseData.id}`;
    }
};

const normalizeAmount = (value) => {
    if (!value || !String(value).trim()) {
        return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
};

export default function SellerCaseDetailPage() {
    const { user } = useAuthStore();
    const { caseKind, id } = useParams();
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submittingAction, setSubmittingAction] = useState('');
    const [returnNote, setReturnNote] = useState('');
    const [returnRefundAmount, setReturnRefundAmount] = useState('');
    const [disputeResolution, setDisputeResolution] = useState('');
    const [disputeFinancialOutcome, setDisputeFinancialOutcome] = useState('');
    const [disputeFinancialAmount, setDisputeFinancialAmount] = useState('');
    const [disputeClosedReason, setDisputeClosedReason] = useState('');
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [evidenceLabel, setEvidenceLabel] = useState('');
    const [evidenceType, setEvidenceType] = useState('');
    const [uploadingEvidence, setUploadingEvidence] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(0);

    useEffect(() => {
        let active = true;

        const loadCaseDetail = async () => {
            if (!caseKind || !id) {
                setError('Case detail is not available.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const data = await opsCaseService.getCaseDetail(caseKind, id);
                if (active) {
                    setCaseData(data);
                }
            } catch (loadError) {
                if (active) {
                    setError(loadError.response?.data?.message || loadError.message || 'Failed to load this operational case.');
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadCaseDetail();

        return () => {
            active = false;
        };
    }, [caseKind, id]);

    const caseTitle = useMemo(() => (
        caseData && caseKind ? getCaseTitle(caseKind, caseData) : 'Case detail'
    ), [caseData, caseKind]);

    const normalizedStatus = caseData?.status?.toLowerCase();
    const isReturnCase = caseKind === 'return';
    const canApproveReturn = isReturnCase && normalizedStatus === 'pending';
    const canRejectReturn = isReturnCase && normalizedStatus === 'pending';
    const canCompleteReturn = isReturnCase && normalizedStatus === 'approved';
    const canAcknowledgeDispute = caseKind === 'dispute' && normalizedStatus === 'open';
    const canResolveDispute = caseKind === 'dispute' && ['open', 'in_progress'].includes(normalizedStatus);
    const canCloseDispute = caseKind === 'dispute' && ['open', 'in_progress', 'resolved'].includes(normalizedStatus);

    const refreshCase = async (updatedCase) => {
        if (updatedCase) {
            setCaseData(updatedCase);
            return;
        }

        if (caseKind && id) {
            const reloaded = await opsCaseService.getCaseDetail(caseKind, id);
            setCaseData(reloaded);
        }
    };

    const runAction = async (actionKey, requestFactory, successMessage) => {
        setSubmittingAction(actionKey);

        try {
            const updatedCase = await requestFactory();
            await refreshCase(updatedCase);
            toast.success(successMessage);
        } catch (actionError) {
            toast.error(actionError.response?.data?.message || actionError.message || 'Action failed.');
        } finally {
            setSubmittingAction('');
        }
    };

    const handleEvidenceUpload = async (event) => {
        event.preventDefault();

        if (!caseKind || !caseData?.id) {
            return;
        }

        if (!evidenceFile) {
            toast.error('Please choose an image file before uploading evidence.');
            return;
        }

        setUploadingEvidence(true);

        try {
            await caseEvidenceService.uploadEvidence(caseKind, caseData.id, {
                file: evidenceFile,
                label: evidenceLabel,
                evidenceType,
            });

            await refreshCase();
            setEvidenceFile(null);
            setEvidenceLabel('');
            setEvidenceType('');
            setFileInputKey((current) => current + 1);
            toast.success('Evidence uploaded successfully.');
        } catch (uploadError) {
            toast.error(uploadError.response?.data?.message || uploadError.message || 'Could not upload evidence right now.');
        } finally {
            setUploadingEvidence(false);
        }
    };

    if (!user || !['seller', 'admin'].includes(user.role?.toLowerCase())) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Operational case detail</h2>
                <p className="text-gray-600">This view is available to seller and admin users only.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 font-medium">
                Loading case detail...
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Operational case detail</h2>
                <p className="text-gray-600">{error || 'We could not load this case right now.'}</p>
                <Link to="/seller/cases" className="inline-block mt-4 text-blue-600 hover:underline font-medium">
                    Back to cases queue
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] uppercase tracking-widest font-black text-gray-500 mb-2">Operations</p>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{caseTitle}</h1>
                    <p className="text-gray-600">
                        Review the live case timeline and use the existing action APIs to move this case forward.
                    </p>
                </div>
                <Link to="/seller/cases" className="text-blue-600 hover:underline font-medium">
                    Back to cases queue
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.8fr)_360px] gap-6">
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Case ID</p>
                                <p className="font-mono font-semibold text-gray-900">{caseData.id}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Status</p>
                                <p className="font-semibold text-gray-900 capitalize">{caseData.status}</p>
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
                            {'requestType' in caseData && (
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Request type</p>
                                    <p className="font-semibold text-gray-900 capitalize">{caseData.requestType || 'Not available'}</p>
                                </div>
                            )}

                            {'caseType' in caseData && (
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Case type</p>
                                    <p className="font-semibold text-gray-900 capitalize">{caseData.caseType || 'Not available'}</p>
                                </div>
                            )}

                            {'resolutionType' in caseData && (
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Requested resolution</p>
                                    <p className="font-semibold text-gray-900 capitalize">{caseData.resolutionType || 'Not available'}</p>
                                </div>
                            )}

                            {'refundAmount' in caseData && caseData.refundAmount != null && (
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Refund amount</p>
                                    <p className="font-semibold text-gray-900">{formatVND(caseData.refundAmount)}</p>
                                </div>
                            )}

                            {'resolvedAt' in caseData && caseData.resolvedAt && (
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Resolved at</p>
                                    <p className="font-semibold text-gray-900">{formatDateTime(caseData.resolvedAt)}</p>
                                </div>
                            )}

                            {'closedReason' in caseData && caseData.closedReason && (
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Closed reason</p>
                                    <p className="font-semibold text-gray-900">{caseData.closedReason}</p>
                                </div>
                            )}

                            {'reasonCode' in caseData && (
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Reason code</p>
                                    <p className="font-semibold text-gray-900">{caseData.reasonCode || 'Not provided'}</p>
                                </div>
                            )}

                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Case scope</p>
                                <p className="font-semibold text-gray-900">
                                    {caseData.orderItemId ? 'Item-level case' : 'Order-level case'}
                                </p>
                            </div>

                            {caseData.orderItemId && (
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Linked order item ID</p>
                                    <p className="font-mono font-semibold text-gray-900">{caseData.orderItemId}</p>
                                </div>
                            )}
                        </div>

                        {'reason' in caseData && caseData.reason && (
                            <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Buyer reason</p>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{caseData.reason}</p>
                            </div>
                        )}

                        {'description' in caseData && caseData.description && (
                            <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Claim description</p>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{caseData.description}</p>
                            </div>
                        )}

                        {'resolution' in caseData && caseData.resolution && (
                            <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Resolution</p>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{caseData.resolution}</p>
                            </div>
                        )}
                    </div>

                    {caseData.order && (
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Linked order</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Order number</p>
                                    <p className="font-mono font-semibold text-gray-900">{caseData.order.orderNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Order status</p>
                                    <p className="font-semibold text-gray-900 capitalize">{caseData.order.status}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Payment</p>
                                    <p className="font-semibold text-gray-900 capitalize">
                                        {caseData.order.paymentMethod || 'Not available'} â€¢ {caseData.order.paymentStatus || 'Not available'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Shipping</p>
                                    <p className="font-semibold text-gray-900 capitalize">{caseData.order.shippingStatus || 'Not available'}</p>
                                </div>
                            </div>
                            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Order total</p>
                                <p className="font-semibold text-gray-900">{formatVND(caseData.order.totalAmount)}</p>
                            </div>
                        </div>
                    )}

                    {caseData.orderItem && (
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Linked order item</h2>
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 flex gap-4">
                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                                    <img
                                        src={caseData.orderItem.image || 'https://via.placeholder.com/100'}
                                        alt={caseData.orderItem.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-gray-900">{caseData.orderItem.title}</p>
                                        <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-bold tracking-wide text-gray-700 border border-gray-200">
                                            Order item #{caseData.orderItem.id || caseData.orderItemId}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">Seller: {caseData.orderItem.sellerDisplayName || 'Not available'}</p>
                                    <p className="text-sm text-gray-600">Qty {caseData.orderItem.quantity} â€¢ {formatVND(caseData.orderItem.totalPrice)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!caseData.orderItem && (
                        <div className="p-6 border-b border-gray-200">
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4">
                                <p className="font-semibold text-gray-900">Case scope</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    This case currently remains order-level in backend truth, so no specific order item is linked here.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Evidence</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Review uploaded proof and add more when operational handling needs it.
                                </p>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">
                                Image uploads reuse the existing file service.
                            </p>
                        </div>

                        {caseData.evidence?.length > 0 ? (
                            <div className="space-y-3">
                                {caseData.evidence.map((attachment) => (
                                    <div key={attachment.id} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 break-words">
                                                {attachment.label || attachment.originalFileName}
                                            </p>
                                            <p className="text-sm text-gray-600 break-words mt-1">
                                                {attachment.evidenceType || 'General evidence'} â€¢ {formatFileSize(attachment.fileSizeBytes)}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Uploaded by {attachment.uploadedByDisplayName || 'case participant'} on {formatDateTime(attachment.uploadedAt)}
                                            </p>
                                        </div>
                                        <a
                                            href={getEvidenceFileUrl(attachment.filePath)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
                                        >
                                            Open file
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">No evidence has been attached to this case yet.</p>
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
                                                <pre className="mt-2 whitespace-pre-wrap break-words bg-white border border-gray-100 rounded-md p-3">
                                                    {event.metadataJson}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">No timeline events are available for this case yet.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-3">SLA / aging</h2>
                        {caseData.sla?.dueBy ? (
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Tracking stage</p>
                                    <p className="font-semibold text-gray-900">{caseData.sla.stageLabel}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Due by</p>
                                    <p className="font-semibold text-gray-900">{formatDateTime(caseData.sla.dueBy)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Last activity</p>
                                    <p className="font-semibold text-gray-900">{formatDateTime(caseData.sla.lastActivityAt)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Aging</p>
                                    <p className="font-semibold text-gray-900">{formatAge(caseData.sla.ageHours)}</p>
                                </div>
                                <div className={`rounded-lg border px-4 py-3 ${caseData.sla.isOverdue
                                        ? 'border-red-200 bg-red-50'
                                        : caseData.sla.reminderSuggested
                                            ? 'border-amber-200 bg-amber-50'
                                            : 'border-emerald-200 bg-emerald-50'
                                    }`}>
                                    <p className={`font-semibold ${caseData.sla.isOverdue
                                            ? 'text-red-800'
                                            : caseData.sla.reminderSuggested
                                                ? 'text-amber-800'
                                                : 'text-emerald-800'
                                        }`}>
                                        {caseData.sla.isOverdue
                                            ? `Overdue by ${caseData.sla.hoursOverdue ?? 0}h`
                                            : caseData.sla.hoursUntilDue != null
                                                ? `${caseData.sla.hoursUntilDue}h until deadline`
                                                : 'Within SLA'}
                                    </p>
                                    <p className="text-sm text-gray-700 mt-1">
                                        {caseData.sla.reminderSuggested && !caseData.sla.isOverdue
                                            ? 'This case is approaching its operational deadline.'
                                            : caseData.sla.isOverdue
                                                ? 'This case has moved past its current operational deadline.'
                                                : 'This case is currently within its tracked SLA window.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>No active SLA window is currently tracked for this case state.</p>
                                <p>Case age: <span className="font-semibold text-gray-900">{formatAge(caseData.sla?.ageHours ?? 0)}</span></p>
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Upload evidence</h2>
                            <p className="text-sm text-gray-600">
                                Add image proof to the case timeline when buyer, seller, or internal handling needs supporting material.
                            </p>
                        </div>

                        <form onSubmit={handleEvidenceUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Image file
                                </label>
                                <input
                                    key={fileInputKey}
                                    type="file"
                                    accept="image/*"
                                    className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:font-semibold file:text-primary hover:file:bg-primary/15"
                                    onChange={(event) => setEvidenceFile(event.target.files?.[0] || null)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Label
                                </label>
                                <input
                                    type="text"
                                    value={evidenceLabel}
                                    onChange={(event) => setEvidenceLabel(event.target.value)}
                                    className="w-full h-11 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Optional short label"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Evidence type
                                </label>
                                <input
                                    type="text"
                                    value={evidenceType}
                                    onChange={(event) => setEvidenceType(event.target.value)}
                                    className="w-full h-11 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Optional type, for example packaging-photo"
                                />
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button type="submit" isLoading={uploadingEvidence}>
                                    Upload evidence
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={uploadingEvidence}
                                    onClick={() => {
                                        setEvidenceFile(null);
                                        setEvidenceLabel('');
                                        setEvidenceType('');
                                        setFileInputKey((current) => current + 1);
                                    }}
                                >
                                    Clear
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Operational actions</h2>
                        <p className="text-sm text-gray-600">
                            These controls call the existing seller/admin action APIs directly. The backend still decides ownership and transition validity.
                        </p>
                    </div>

                    {(canApproveReturn || canRejectReturn || canCompleteReturn) && (
                        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Return actions</h3>
                                <p className="text-sm text-gray-600 mt-1">Use one note field and optional refund amount where it makes sense.</p>
                            </div>

                            <textarea
                                value={returnNote}
                                onChange={(event) => setReturnNote(event.target.value)}
                                className="w-full min-h-[110px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Optional operational note..."
                            />

                            {(canApproveReturn || canCompleteReturn) && (
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={returnRefundAmount}
                                    onChange={(event) => setReturnRefundAmount(event.target.value)}
                                    className="w-full h-11 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Optional refund amount"
                                />
                            )}

                            <div className="flex flex-wrap gap-3">
                                {canApproveReturn && (
                                    <Button
                                        isLoading={submittingAction === 'approve-return'}
                                        onClick={() => runAction(
                                            'approve-return',
                                            () => opsCaseService.approveReturn(caseData.id, {
                                                note: returnNote.trim() || null,
                                                refundAmount: normalizeAmount(returnRefundAmount)
                                            }),
                                            'Return request approved.'
                                        )}
                                    >
                                        Approve return
                                    </Button>
                                )}

                                {canRejectReturn && (
                                    <Button
                                        variant="outline"
                                        isLoading={submittingAction === 'reject-return'}
                                        onClick={() => runAction(
                                            'reject-return',
                                            () => opsCaseService.rejectReturn(caseData.id, {
                                                note: returnNote.trim() || null
                                            }),
                                            'Return request rejected.'
                                        )}
                                    >
                                        Reject return
                                    </Button>
                                )}

                                {canCompleteReturn && (
                                    <Button
                                        isLoading={submittingAction === 'complete-return'}
                                        onClick={() => runAction(
                                            'complete-return',
                                            () => opsCaseService.completeReturn(caseData.id, {
                                                note: returnNote.trim() || null,
                                                refundAmount: normalizeAmount(returnRefundAmount)
                                            }),
                                            'Return request completed.'
                                        )}
                                    >
                                        Complete return
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {(canAcknowledgeDispute || canResolveDispute || canCloseDispute) && (
                        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Dispute actions</h3>
                                <p className="text-sm text-gray-600 mt-1">Keep this minimal and let the backend enforce final eligibility and ownership.</p>
                            </div>

                            {canAcknowledgeDispute && (
                                <Button
                                    isLoading={submittingAction === 'acknowledge-dispute'}
                                    onClick={() => runAction(
                                        'acknowledge-dispute',
                                        () => opsCaseService.acknowledgeDispute(caseData.id),
                                        'Dispute acknowledged.'
                                    )}
                                >
                                    Acknowledge dispute
                                </Button>
                            )}

                            {canResolveDispute && (
                                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
                                    <p className="text-sm font-semibold text-gray-900">Resolve dispute</p>
                                    <textarea
                                        value={disputeResolution}
                                        onChange={(event) => setDisputeResolution(event.target.value)}
                                        className="w-full min-h-[110px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                        placeholder="Resolution details..."
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <select
                                            value={disputeFinancialOutcome}
                                            onChange={(event) => setDisputeFinancialOutcome(event.target.value)}
                                            className="h-11 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                        >
                                            <option value="">No manual financial outcome</option>
                                            <option value="refund">Refund</option>
                                            <option value="reimbursement">Reimbursement</option>
                                        </select>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={disputeFinancialAmount}
                                            onChange={(event) => setDisputeFinancialAmount(event.target.value)}
                                            className="h-11 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                            placeholder="Financial amount"
                                        />
                                    </div>
                                    <Button
                                        isLoading={submittingAction === 'resolve-dispute'}
                                        onClick={() => runAction(
                                            'resolve-dispute',
                                            () => opsCaseService.resolveDispute(caseData.id, {
                                                resolution: disputeResolution.trim(),
                                                financialOutcome: disputeFinancialOutcome || null,
                                                financialAmount: normalizeAmount(disputeFinancialAmount)
                                            }),
                                            'Dispute resolved.'
                                        )}
                                    >
                                        Resolve dispute
                                    </Button>
                                </div>
                            )}

                            {canCloseDispute && (
                                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
                                    <p className="text-sm font-semibold text-gray-900">Close dispute</p>
                                    <textarea
                                        value={disputeClosedReason}
                                        onChange={(event) => setDisputeClosedReason(event.target.value)}
                                        className="w-full min-h-[100px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                        placeholder="Explain why this dispute is being closed..."
                                    />
                                    <Button
                                        variant="outline"
                                        isLoading={submittingAction === 'close-dispute'}
                                        onClick={() => runAction(
                                            'close-dispute',
                                            () => opsCaseService.closeDispute(caseData.id, {
                                                closedReason: disputeClosedReason.trim()
                                            }),
                                            'Dispute closed.'
                                        )}
                                    >
                                        Close dispute
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
