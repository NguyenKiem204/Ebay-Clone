import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import caseService from '../features/cases/services/caseService';
import caseEvidenceService from '../features/cases/services/caseEvidenceService';
import { Button } from '../components/ui/Button';
import { BASE_URL } from '../lib/axios';

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

const getEvidenceFileUrl = (filePath) => (
    filePath ? `${BASE_URL}${filePath}` : '#'
);

const getCaseTitle = (caseKind, caseData) => {
    if (caseKind === 'return') {
        return `Return request #${caseData.id}`;
    }

    if (caseKind === 'dispute' && caseData.caseType?.toLowerCase() === 'inr') {
        return `INR claim #${caseData.id}`;
    }

    if (caseKind === 'dispute' && caseData.caseType?.toLowerCase() === 'snad') {
        return `SNAD claim #${caseData.id}`;
    }

    if (caseKind === 'dispute' && caseData.caseType?.toLowerCase() === 'damaged') {
        return `Damaged item claim #${caseData.id}`;
    }

    if (caseKind === 'dispute' && caseData.caseType?.toLowerCase() === 'return_escalation') {
        return `Escalated return dispute #${caseData.id}`;
    }

    if (caseKind === 'dispute') {
        return `Dispute #${caseData.id}`;
    }

    return 'Case detail';
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

const getLifecycleCopy = (caseKind, status) => {
    const normalizedStatus = status?.toLowerCase();

    if (caseKind === 'return') {
        switch (normalizedStatus) {
            case 'pending':
                return {
                    title: 'Waiting for seller response',
                    description: 'Your return request is open and waiting for the seller or platform to respond.'
                };
            case 'approved':
                return {
                    title: 'Return approved',
                    description: 'The seller or platform approved this return and it is moving toward completion.'
                };
            case 'completed':
                return {
                    title: 'Return completed',
                    description: 'This return request has completed and any recorded refund outcome should appear below.'
                };
            case 'rejected':
                return {
                    title: 'Return rejected',
                    description: 'This return request was rejected. Review the latest update and timeline for the reason.'
                };
            default:
                return {
                    title: 'Return in progress',
                    description: 'This return request is active. Review the timeline for the latest case handling updates.'
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
                description: 'The responsible seller or platform team is actively reviewing this claim.'
            };
        case 'resolved':
            return {
                title: 'Case resolved',
                description: 'A resolution has been recorded for this claim. Review the outcome and timeline below.'
            };
        case 'closed':
            return {
                title: 'Case closed',
                description: 'This claim has been closed. Review the timeline for the closing details and any outcome metadata.'
            };
        default:
            return {
                title: 'Case in progress',
                description: 'This buyer protection case is active. Review the timeline for the latest handling updates.'
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

const getFinancialOutcomeLabel = (financialOutcome) => {
    switch (financialOutcome?.toLowerCase()) {
        case 'refund':
            return 'Refund';
        case 'reimbursement':
            return 'Reimbursement';
        default:
            return 'Financial outcome';
    }
};

const parseMetadataJson = (metadataJson) => {
    if (!metadataJson) {
        return null;
    }

    try {
        const parsed = JSON.parse(metadataJson);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
};

const getLatestFinancialSnapshot = (caseData) => {
    if (!caseData) {
        return null;
    }

    const reversedTimeline = [...(caseData.timeline || [])].reverse();
    for (const event of reversedTimeline) {
        const metadata = parseMetadataJson(event.metadataJson);
        if (!metadata) {
            continue;
        }

        if (metadata.financialOutcome || metadata.financialAmount != null || metadata.financialStatusSyncApplied) {
            return {
                financialOutcome: metadata.financialOutcome || null,
                financialAmount: metadata.financialAmount != null ? Number(metadata.financialAmount) : null,
                orderStatus: metadata.orderStatus || null,
                paymentStatus: metadata.paymentStatus || null,
                financialStatusSyncApplied: Boolean(metadata.financialStatusSyncApplied),
                sourceEvent: event
            };
        }
    }

    if ('refundAmount' in caseData && caseData.refundAmount != null) {
        return {
            financialOutcome: caseData.resolutionType?.toLowerCase() === 'refund' ? 'refund' : null,
            financialAmount: Number(caseData.refundAmount),
            orderStatus: null,
            paymentStatus: null,
            financialStatusSyncApplied: false,
            sourceEvent: null
        };
    }

    return null;
};

export default function CaseDetailPage() {
    const { caseKind, id } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEscalationForm, setShowEscalationForm] = useState(false);
    const [escalationDescription, setEscalationDescription] = useState('');
    const [escalationError, setEscalationError] = useState('');
    const [submittingEscalation, setSubmittingEscalation] = useState(false);
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [evidenceLabel, setEvidenceLabel] = useState('');
    const [evidenceType, setEvidenceType] = useState('');
    const [evidenceError, setEvidenceError] = useState('');
    const [evidenceSuccess, setEvidenceSuccess] = useState('');
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
                const data = await caseService.getCaseDetail(caseKind, id);
                if (active) {
                    setCaseData(data);
                }
            } catch (loadError) {
                if (active) {
                    setError(loadError.response?.data?.message || loadError.message || 'Failed to load this case.');
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

    useEffect(() => {
        setShowEscalationForm(false);
        setEscalationDescription('');
        setEscalationError('');
        setSubmittingEscalation(false);
        setEvidenceFile(null);
        setEvidenceLabel('');
        setEvidenceType('');
        setEvidenceError('');
        setEvidenceSuccess('');
        setUploadingEvidence(false);
        setFileInputKey((current) => current + 1);
    }, [caseKind, id]);

    const caseTitle = useMemo(() => {
        if (!caseData || !caseKind) {
            return 'Case detail';
        }

        return getCaseTitle(caseKind, caseData);
    }, [caseData, caseKind]);

    const isReturnCase = caseKind === 'return';
    const hasEscalationEvent = caseData?.timeline?.some((event) => event.eventType === 'escalated');
    const canShowEscalationAction = Boolean(
        isReturnCase &&
        caseData &&
        !hasEscalationEvent &&
        ['pending', 'rejected'].includes(caseData.status?.toLowerCase())
    );
    const lifecycleCopy = useMemo(() => (
        caseData ? getLifecycleCopy(caseKind, caseData.status) : null
    ), [caseData, caseKind]);
    const financialSnapshot = useMemo(() => (
        getLatestFinancialSnapshot(caseData)
    ), [caseData]);

    const reloadCaseDetail = async () => {
        if (!caseKind || !id) {
            return;
        }

        const refreshedCase = await caseService.getCaseDetail(caseKind, id);
        setCaseData(refreshedCase);
    };

    const handleEscalationSubmit = async (event) => {
        event.preventDefault();
        if (!caseData?.id) {
            return;
        }

        setSubmittingEscalation(true);
        setEscalationError('');

        try {
            const createdDispute = await caseService.escalateReturnRequest(caseData.id, escalationDescription.trim());
            navigate(`/cases/dispute/${createdDispute.id}`);
        } catch (submitError) {
            setEscalationError(submitError.response?.data?.message || submitError.message || 'Could not escalate this return request right now.');
        } finally {
            setSubmittingEscalation(false);
        }
    };

    const handleEvidenceSubmit = async (event) => {
        event.preventDefault();
        if (!caseData?.id || !caseKind) {
            return;
        }

        if (!evidenceFile) {
            setEvidenceError('Please choose an image file before uploading evidence.');
            return;
        }

        setUploadingEvidence(true);
        setEvidenceError('');
        setEvidenceSuccess('');

        try {
            await caseEvidenceService.uploadEvidence(caseKind, caseData.id, {
                file: evidenceFile,
                label: evidenceLabel,
                evidenceType,
            });

            await reloadCaseDetail();

            setEvidenceFile(null);
            setEvidenceLabel('');
            setEvidenceType('');
            setFileInputKey((current) => current + 1);
            setEvidenceSuccess('Evidence uploaded successfully.');
        } catch (uploadError) {
            setEvidenceError(uploadError.response?.data?.message || uploadError.message || 'Could not upload evidence right now.');
        } finally {
            setUploadingEvidence(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500 font-medium">
                    Loading case detail...
                </div>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Case detail</h1>
                    <p className="text-gray-600 mb-6">{error || 'We could not load this case right now.'}</p>
                    <Link to="/cases" className="text-blue-600 hover:underline font-medium">
                        Back to my cases
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{caseTitle}</h1>
                    <p className="text-gray-600">
                        Review the current status and full timeline for this case.
                    </p>
                </div>
                <Link to="/cases" className="text-blue-600 hover:underline font-medium">
                    Back to my cases
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
                            {lifecycleCopy?.title && (
                                <p className="text-xs text-gray-500 mt-2">{lifecycleCopy.title}</p>
                            )}
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

                        {'reasonCode' in caseData && (
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Reason code</p>
                                <p className="font-semibold text-gray-900">{caseData.reasonCode || 'Not provided'}</p>
                            </div>
                        )}

                        {'resolutionType' in caseData && (
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Requested resolution</p>
                                <p className="font-semibold text-gray-900 capitalize">{caseData.resolutionType || 'Not available'}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Case scope</p>
                            <p className="font-semibold text-gray-900">
                                {caseData.orderItemId ? `Item-level case` : 'Order-level case'}
                            </p>
                        </div>

                        {caseData.orderItemId && (
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Linked order item ID</p>
                                <p className="font-mono font-semibold text-gray-900">{caseData.orderItemId}</p>
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

                        {'escalatedFromReturnRequestId' in caseData && caseData.escalatedFromReturnRequestId && (
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Escalated from return</p>
                                <Link
                                    to={`/cases/return/${caseData.escalatedFromReturnRequestId}`}
                                    className="font-semibold text-blue-600 hover:underline"
                                >
                                    Return request #{caseData.escalatedFromReturnRequestId}
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4">
                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Lifecycle progress</p>
                            <p className="font-semibold text-gray-900">
                                {lifecycleCopy?.title || 'Case in progress'}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                {lifecycleCopy?.description || 'This case is active. Review the latest updates below.'}
                            </p>
                        </div>

                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4">
                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Handling window</p>
                            {caseData.sla?.dueBy ? (
                                <>
                                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getSlaStyles(caseData.sla)}`}>
                                        {caseData.sla.isOverdue ? 'Overdue' : caseData.sla.stageLabel}
                                    </span>
                                    <p className="font-semibold text-gray-900 mt-3">
                                        Due by {formatDateTime(caseData.sla.dueBy)}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-2">
                                        Last activity: {formatDateTime(caseData.sla.lastActivityAt)}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Case age: {formatAge(caseData.sla.ageHours)}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {caseData.sla.isOverdue && caseData.sla.hoursOverdue != null
                                            ? `Overdue by ${caseData.sla.hoursOverdue}h`
                                            : caseData.sla.hoursUntilDue != null
                                                ? `${caseData.sla.hoursUntilDue}h remaining in the current handling window`
                                                : 'This case is within its current handling window.'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="font-semibold text-gray-900">No active deadline</p>
                                    <p className="text-sm text-gray-600 mt-2">
                                        Backend truth does not currently expose an active SLA window for this case state.
                                    </p>
                                    {caseData.sla?.ageHours != null && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Case age: {formatAge(caseData.sla.ageHours)}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4">
                            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2">Outcome</p>
                            {financialSnapshot ? (
                                <>
                                    <p className="font-semibold text-gray-900">
                                        {getFinancialOutcomeLabel(financialSnapshot.financialOutcome)}
                                    </p>
                                    {financialSnapshot.financialAmount != null && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            Amount: <span className="font-semibold text-gray-900">{formatVND(financialSnapshot.financialAmount)}</span>
                                        </p>
                                    )}
                                    {financialSnapshot.financialStatusSyncApplied && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Order/payment truth was also updated to reflect this outcome.
                                        </p>
                                    )}
                                    {(financialSnapshot.orderStatus || financialSnapshot.paymentStatus) && (
                                        <p className="text-sm text-gray-600 mt-1 capitalize">
                                            {financialSnapshot.orderStatus ? `Order: ${financialSnapshot.orderStatus}` : 'Order: unchanged'}
                                            {financialSnapshot.paymentStatus ? ` • Payment: ${financialSnapshot.paymentStatus}` : ''}
                                        </p>
                                    )}
                                    {financialSnapshot.sourceEvent && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Captured in timeline on {formatDateTime(financialSnapshot.sourceEvent.createdAt)}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p className="font-semibold text-gray-900">No recorded financial outcome</p>
                                    <p className="text-sm text-gray-600 mt-2">
                                        This case does not currently expose refund or reimbursement meaning in backend truth.
                                    </p>
                                </>
                            )}
                        </div>
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

                    {canShowEscalationAction && (
                        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                <div>
                                    <p className="font-semibold text-amber-900">Need stronger buyer protection?</p>
                                    <p className="text-sm text-amber-800 mt-1">
                                        You can escalate this return request into a dispute. Final eligibility is confirmed by the backend when you submit.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant={showEscalationForm ? 'primary' : 'outline'}
                                    onClick={() => {
                                        setEscalationError('');
                                        setShowEscalationForm((current) => !current);
                                    }}
                                >
                                    Escalate case
                                </Button>
                            </div>

                            {showEscalationForm && (
                                <form onSubmit={handleEscalationSubmit} className="space-y-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Why are you escalating this return request?
                                        </label>
                                        <textarea
                                            value={escalationDescription}
                                            onChange={(event) => setEscalationDescription(event.target.value)}
                                            className="w-full min-h-[120px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                            placeholder="Explain why the current return path is not enough and why you need buyer protection review."
                                            required
                                        />
                                    </div>

                                    {escalationError && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                            {escalationError}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-3">
                                        <Button type="submit" isLoading={submittingEscalation}>
                                            Submit escalation
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            disabled={submittingEscalation}
                                            onClick={() => {
                                                setShowEscalationForm(false);
                                                setEscalationError('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {caseData.order && (
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Linked order</h2>
                            <Link to={`/orders/${caseData.order.id}`} className="text-blue-600 hover:underline font-medium">
                                View order
                            </Link>
                        </div>
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
                                    {caseData.order.paymentMethod || 'Not available'} • {caseData.order.paymentStatus || 'Not available'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Shipping</p>
                                <p className="font-semibold text-gray-900 capitalize">{caseData.order.shippingStatus || 'Not available'}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Order created</p>
                                <p className="font-semibold text-gray-900">{formatDateTime(caseData.order.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-1">Delivered at</p>
                                <p className="font-semibold text-gray-900">{formatDateTime(caseData.order.deliveredAt)}</p>
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
                        <div className="flex flex-col sm:flex-row gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
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
                                <p className="text-sm text-gray-600 mt-1">
                                    Seller: {caseData.orderItem.sellerDisplayName || 'Not available'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Qty {caseData.orderItem.quantity} • Unit price {formatVND(caseData.orderItem.unitPrice)}
                                </p>
                                <p className="text-sm font-semibold text-gray-900 mt-2">
                                    Line total: {formatVND(caseData.orderItem.totalPrice)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {!caseData.orderItem && (
                    <div className="p-6 border-b border-gray-200">
                        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4">
                            <p className="font-semibold text-gray-900">Case scope</p>
                            <p className="text-sm text-gray-600 mt-1">
                                This case is currently tracked at order level. No specific order item is linked in backend case truth.
                            </p>
                        </div>
                    </div>
                )}

                <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Evidence</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Add image proof or review the files already attached to this case.
                            </p>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                            Current upload path reuses the existing image file pipeline.
                        </p>
                    </div>

                    {caseData.evidence?.length > 0 ? (
                        <div className="space-y-3 mb-5">
                            {caseData.evidence.map((attachment) => (
                                <div key={attachment.id} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 break-words">
                                            {attachment.label || attachment.originalFileName}
                                        </p>
                                        <p className="text-sm text-gray-600 break-words mt-1">
                                            {attachment.evidenceType || 'General evidence'} • {formatFileSize(attachment.fileSizeBytes)}
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
                        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-600 mb-5">
                            No evidence has been attached to this case yet.
                        </div>
                    )}

                    <form onSubmit={handleEvidenceSubmit} className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Upload image evidence
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Label
                                </label>
                                <input
                                    type="text"
                                    value={evidenceLabel}
                                    onChange={(event) => setEvidenceLabel(event.target.value)}
                                    className="w-full h-11 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
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
                                    className="w-full h-11 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                    placeholder="Optional type, for example damaged-item"
                                />
                            </div>
                        </div>

                        {evidenceError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {evidenceError}
                            </div>
                        )}

                        {evidenceSuccess && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                {evidenceSuccess}
                            </div>
                        )}

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
                                    setEvidenceError('');
                                    setEvidenceSuccess('');
                                    setFileInputKey((current) => current + 1);
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Timeline</h2>
                    {caseData.timeline?.length > 0 ? (
                        <div className="space-y-4">
                            {caseData.timeline.map((event) => {
                                const metadata = parseMetadataJson(event.metadataJson);

                                return (
                                <div key={event.id} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                        <div>
                                            <p className="font-semibold text-gray-900">{event.message}</p>
                                            <p className="text-xs uppercase tracking-wider font-bold text-gray-500 mt-1">
                                                {event.eventType}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm text-gray-600">
                                            <p className="capitalize font-medium">{event.actorDisplayName || event.actorType}</p>
                                            <p>{formatDateTime(event.createdAt)}</p>
                                        </div>
                                    </div>
                                    {metadata && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {metadata.currentStatus && metadata.nextStatus && (
                                                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 capitalize">
                                                    {metadata.currentStatus} to {metadata.nextStatus}
                                                </span>
                                            )}
                                            {metadata.financialOutcome && (
                                                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                                                    {getFinancialOutcomeLabel(metadata.financialOutcome)}
                                                </span>
                                            )}
                                            {metadata.financialAmount != null && (
                                                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                                                    {formatVND(Number(metadata.financialAmount))}
                                                </span>
                                            )}
                                            {metadata.orderStatus && (
                                                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 capitalize">
                                                    Order {metadata.orderStatus}
                                                </span>
                                            )}
                                            {metadata.paymentStatus && (
                                                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 capitalize">
                                                    Payment {metadata.paymentStatus}
                                                </span>
                                            )}
                                            {metadata.evidenceType && (
                                                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                                                    Evidence: {metadata.evidenceType}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {event.metadataJson && (
                                        <details className="text-xs text-gray-500 mt-2">
                                            <summary className="cursor-pointer select-none">Event metadata</summary>
                                            <pre className="mt-2 whitespace-pre-wrap break-words bg-white border border-gray-100 rounded-md p-3">
                                                {event.metadataJson}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600">
                            No timeline events are available for this case yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
