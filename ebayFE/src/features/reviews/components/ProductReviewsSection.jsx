import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../../store/useAuthStore';
import reviewService from '../services/reviewService';
import ReviewMediaGallery from './ReviewMediaGallery';

function Stars({ value }) {
    const rounded = Math.round(Number(value) || 0);
    return (
        <span className="text-amber-400">
            {'\u2605'.repeat(Math.max(0, rounded))}
            <span className="text-gray-300">{'\u2605'.repeat(Math.max(0, 5 - rounded))}</span>
        </span>
    );
}

const DEFAULT_REPORT_FORM = { reviewId: null, reason: 'Spam or fake', details: '' };

export default function ProductReviewsSection({ productId }) {
    const { isAuthenticated } = useAuthStore();
    const [sortBy, setSortBy] = useState('most_recent');
    const [ratingFilter, setRatingFilter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feed, setFeed] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [reportForm, setReportForm] = useState(DEFAULT_REPORT_FORM);

    useEffect(() => {
        const loadReviews = async () => {
            if (!productId) {
                return;
            }

            setLoading(true);
            try {
                const data = await reviewService.getProductReviews(productId, {
                    sortBy,
                    ...(ratingFilter ? { rating: ratingFilter } : {}),
                    page: 1,
                    pageSize: 8
                });
                setFeed(data);
            } finally {
                setLoading(false);
            }
        };

        loadReviews();
    }, [productId, ratingFilter, sortBy]);

    const summary = feed?.summary;
    const reviews = feed?.items || [];
    const activeReportReview = useMemo(
        () => reviews.find((item) => item.id === reportForm.reviewId) || null,
        [reportForm.reviewId, reviews]
    );

    const patchReviewInFeed = (updatedReview) => {
        setFeed((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                items: current.items.map((item) => item.id === updatedReview.id ? updatedReview : item)
            };
        });
    };

    const handleHelpfulToggle = async (review) => {
        if (!isAuthenticated) {
            toast.error('Sign in to vote on reviews.');
            return;
        }

        setActionLoading(`helpful-${review.id}`);
        try {
            const updated = review.hasMarkedHelpful
                ? await reviewService.unmarkHelpful(review.id)
                : await reviewService.markHelpful(review.id);
            patchReviewInFeed(updated);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to update your helpful vote.');
        } finally {
            setActionLoading(null);
        }
    };

    const submitReport = async () => {
        if (!reportForm.reviewId) {
            return;
        }

        setActionLoading(`report-${reportForm.reviewId}`);
        try {
            await reviewService.reportReview(reportForm.reviewId, {
                reason: reportForm.reason,
                details: reportForm.details
            });
            toast.success('Review report submitted.');
            setReportForm(DEFAULT_REPORT_FORM);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to submit your report.');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <section className="mt-10 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#3665f3]">Ratings & reviews</p>
                    <h2 className="mt-2 text-2xl font-black text-gray-900">What buyers said</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Reviews are tied to delivered orders, can include media, and show when a seller has replied.
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black text-gray-900">{summary?.averageRating?.toFixed?.(1) || '0.0'}</span>
                        <Stars value={summary?.averageRating || 0} />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{summary?.totalReviews || 0} published reviews</p>
                </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = summary?.ratingBreakdown?.[star] || 0;
                        const total = summary?.totalReviews || 0;
                        const width = total > 0 ? (count / total) * 100 : 0;

                        return (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRatingFilter((current) => current === star ? null : star)}
                                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                                    ratingFilter === star
                                        ? 'border-[#3665f3] bg-white'
                                        : 'border-transparent hover:border-gray-200 hover:bg-white'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="font-semibold text-gray-700">{star} stars</span>
                                    <span className="text-gray-500">{count}</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-gray-200">
                                    <div className="h-2 rounded-full bg-[#3665f3]" style={{ width: `${width}%` }} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={() => setRatingFilter(null)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold ${ratingFilter === null ? 'bg-[#3665f3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            All ratings
                        </button>
                        <select
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value)}
                            className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#3665f3]"
                        >
                            <option value="most_recent">Most recent</option>
                            <option value="highest_rating">Highest rating</option>
                            <option value="lowest_rating">Lowest rating</option>
                            <option value="most_helpful">Most helpful</option>
                        </select>
                    </div>

                    {loading && (
                        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-sm text-gray-500">
                            Loading reviews...
                        </div>
                    )}

                    {!loading && reviews.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-sm text-gray-500">
                            No public reviews match the current filter yet.
                        </div>
                    )}

                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <article key={review.id} className="rounded-2xl border border-gray-200 p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Stars value={review.rating} />
                                            <span className="text-sm font-semibold text-gray-900">{review.reviewerDisplayName}</span>
                                            {review.isVerifiedPurchase && (
                                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                                    Verified purchase
                                                </span>
                                            )}
                                            {review.isEdited && (
                                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                                                    Edited
                                                </span>
                                            )}
                                        </div>
                                        {review.title && <h3 className="mt-2 text-base font-black text-gray-900">{review.title}</h3>}
                                    </div>
                                    <p className="text-sm text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-US')}</p>
                                </div>

                                <p className="mt-3 text-sm leading-7 text-gray-700">{review.content}</p>
                                <ReviewMediaGallery mediaItems={review.mediaItems} />

                                {review.sellerReply && (
                                    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Seller reply</p>
                                        <p className="mt-2 text-sm font-semibold text-gray-900">{review.sellerReply.sellerDisplayName}</p>
                                        <p className="mt-2 text-sm leading-7 text-gray-700">{review.sellerReply.reply}</p>
                                        <p className="mt-2 text-xs text-gray-400">
                                            {new Date(review.sellerReply.updatedAt || review.sellerReply.createdAt).toLocaleDateString('en-US')}
                                            {review.sellerReply.isEdited ? ' • Edited' : ''}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleHelpfulToggle(review)}
                                        disabled={actionLoading === `helpful-${review.id}`}
                                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                            review.hasMarkedHelpful
                                                ? 'bg-[#3665f3] text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {review.hasMarkedHelpful ? 'Helpful saved' : 'Helpful'} ({review.helpfulCount})
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!isAuthenticated) {
                                                toast.error('Sign in to report a review.');
                                                return;
                                            }
                                            setReportForm({ reviewId: review.id, reason: 'Spam or fake', details: '' });
                                        }}
                                        className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
                                    >
                                        Report
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>

                    {activeReportReview && (
                        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/40 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Report review</p>
                                    <p className="text-xs text-gray-500">Tell us what is wrong with this review and we will flag it for moderation.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setReportForm(DEFAULT_REPORT_FORM)}
                                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                                >
                                    Close
                                </button>
                            </div>

                            <select
                                value={reportForm.reason}
                                onChange={(event) => setReportForm((current) => ({ ...current, reason: event.target.value }))}
                                className="mt-3 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#3665f3]"
                            >
                                <option>Spam or fake</option>
                                <option>Abusive language</option>
                                <option>Off-topic content</option>
                                <option>Personal information</option>
                                <option>Other</option>
                            </select>
                            <textarea
                                value={reportForm.details}
                                onChange={(event) => setReportForm((current) => ({ ...current, details: event.target.value }))}
                                placeholder="Add optional details for the moderation team."
                                className="mt-3 min-h-[110px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#3665f3]"
                            />
                            <div className="mt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={submitReport}
                                    disabled={actionLoading === `report-${reportForm.reviewId}`}
                                    className="rounded-full bg-[#3665f3] px-5 py-2 text-sm font-bold text-white hover:bg-blue-700"
                                >
                                    {actionLoading === `report-${reportForm.reviewId}` ? 'Submitting...' : 'Submit report'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReportForm(DEFAULT_REPORT_FORM)}
                                    className="rounded-full bg-white px-5 py-2 text-sm font-bold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
