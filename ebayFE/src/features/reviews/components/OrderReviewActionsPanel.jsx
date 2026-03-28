import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import reviewService from '../services/reviewService';
import { resolveMediaUrl } from '../../../lib/media';

function StarPicker({ value, onChange }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className={`text-2xl transition ${star <= value ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
                >
                    {'\u2605'}
                </button>
            ))}
        </div>
    );
}

const DEFAULT_REVIEW_FORM = { rating: 5, title: '', content: '' };
const DEFAULT_FEEDBACK_FORM = { sentiment: 'positive', comment: '' };

export default function OrderReviewActionsPanel({ orderId }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeReviewItemId, setActiveReviewItemId] = useState(null);
    const [activeFeedbackItemId, setActiveFeedbackItemId] = useState(null);
    const [reviewForm, setReviewForm] = useState(DEFAULT_REVIEW_FORM);
    const [feedbackForm, setFeedbackForm] = useState(DEFAULT_FEEDBACK_FORM);
    const [reviewFiles, setReviewFiles] = useState([]);
    const [submitting, setSubmitting] = useState(null);
    const reviewSubmitLock = useRef(false);
    const feedbackSubmitLock = useRef(false);

    const loadEligibility = async () => {
        if (!orderId) return;

        setLoading(true);
        try {
            const data = await reviewService.getOrderEligibility(orderId);
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to load review actions for this order.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEligibility();
    }, [orderId]);

    const handleReviewSubmit = async (orderItemId) => {
        if (reviewSubmitLock.current) {
            return;
        }

        reviewSubmitLock.current = true;
        setSubmitting(`review-${orderItemId}`);
        try {
            const review = await reviewService.createProductReview({
                orderItemId,
                rating: reviewForm.rating,
                title: reviewForm.title,
                content: reviewForm.content
            });

            if (reviewFiles.length > 0) {
                await reviewService.uploadReviewMedia(review.id, reviewFiles);
            }

            toast.success('Product review submitted.');
            setReviewForm(DEFAULT_REVIEW_FORM);
            setReviewFiles([]);
            setActiveReviewItemId(null);
            await loadEligibility();
        } catch (error) {
            const message = error.response?.data?.message || 'Unable to submit your product review.';

            if (message.toLowerCase().includes('already reviewed')) {
                toast.success('Product review submitted.');
                setReviewForm(DEFAULT_REVIEW_FORM);
                setReviewFiles([]);
                setActiveReviewItemId(null);
                await loadEligibility();
            } else {
                toast.error(message);
            }
        } finally {
            setSubmitting(null);
            reviewSubmitLock.current = false;
        }
    };

    const handleFeedbackSubmit = async (orderItemId) => {
        if (feedbackSubmitLock.current) {
            return;
        }

        feedbackSubmitLock.current = true;
        setSubmitting(`feedback-${orderItemId}`);
        try {
            await reviewService.createSellerFeedback({
                orderItemId,
                sentiment: feedbackForm.sentiment,
                comment: feedbackForm.comment
            });
            toast.success('Seller feedback submitted.');
            setFeedbackForm(DEFAULT_FEEDBACK_FORM);
            setActiveFeedbackItemId(null);
            await loadEligibility();
        } catch (error) {
            const message = error.response?.data?.message || 'Unable to submit your seller feedback.';

            if (message.toLowerCase().includes('already left seller feedback')) {
                toast.success('Seller feedback submitted.');
                setFeedbackForm(DEFAULT_FEEDBACK_FORM);
                setActiveFeedbackItemId(null);
                await loadEligibility();
            } else {
                toast.error(message);
            }
        } finally {
            setSubmitting(null);
            feedbackSubmitLock.current = false;
        }
    };

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-black text-gray-900">Reviews & feedback</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Leave a verified product review, upload media, and share transaction feedback after delivery.
                    </p>
                </div>
                <Link to="/profile?view=reviews" className="text-sm font-bold text-[#3665f3] hover:underline">
                    Open My eBay reviews
                </Link>
            </div>

            <div className="mt-5 space-y-4">
                {loading && (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                        Loading review eligibility...
                    </div>
                )}

                {!loading && items.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                        No review actions are available for this order yet.
                    </div>
                )}

                {!loading && items.map((item) => (
                    <div key={item.orderItemId} className="rounded-2xl border border-gray-200 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex gap-4">
                                <img
                                    src={resolveMediaUrl(item.productImage) || 'https://via.placeholder.com/96'}
                                    alt={item.productTitle}
                                    className="h-20 w-20 rounded-xl border border-gray-100 object-cover"
                                />
                                <div>
                                    <p className="text-sm font-black text-gray-900">{item.productTitle}</p>
                                    <p className="mt-1 text-sm text-gray-500">Seller: {item.sellerName}</p>
                                    {item.deliveredAt && (
                                        <p className="mt-1 text-xs text-gray-400">
                                            Delivered: {new Date(item.deliveredAt).toLocaleString('en-US')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {item.canReviewProduct ? (
                                    <Button
                                        variant={activeReviewItemId === item.orderItemId ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                            setActiveFeedbackItemId(null);
                                            setReviewFiles([]);
                                            setActiveReviewItemId((current) => current === item.orderItemId ? null : item.orderItemId);
                                        }}
                                    >
                                        Leave review
                                    </Button>
                                ) : (
                                    <span className="rounded-full bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500">
                                        {item.existingReviewId ? 'Reviewed' : item.reviewReason}
                                    </span>
                                )}

                                {item.canLeaveSellerFeedback ? (
                                    <Button
                                        variant={activeFeedbackItemId === item.orderItemId ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                            setActiveReviewItemId(null);
                                            setActiveFeedbackItemId((current) => current === item.orderItemId ? null : item.orderItemId);
                                        }}
                                    >
                                        Leave feedback
                                    </Button>
                                ) : (
                                    <span className="rounded-full bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500">
                                        {item.existingSellerFeedbackId ? 'Seller feedback sent' : item.sellerFeedbackReason}
                                    </span>
                                )}
                            </div>
                        </div>

                        {activeReviewItemId === item.orderItemId && (
                            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                                <p className="text-sm font-bold text-gray-900">Product review</p>
                                <div className="mt-3">
                                    <StarPicker value={reviewForm.rating} onChange={(rating) => setReviewForm((current) => ({ ...current, rating }))} />
                                </div>
                                <input
                                    type="text"
                                    value={reviewForm.title}
                                    onChange={(event) => setReviewForm((current) => ({ ...current, title: event.target.value }))}
                                    placeholder="Add a review title"
                                    className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#3665f3]"
                                />
                                <textarea
                                    value={reviewForm.content}
                                    onChange={(event) => setReviewForm((current) => ({ ...current, content: event.target.value }))}
                                    placeholder="Tell other buyers how the item matched the listing and what stood out."
                                    className="mt-3 min-h-[120px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#3665f3]"
                                />
                                <div className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-3">
                                    <label className="text-sm font-semibold text-gray-700">Add photos or videos</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        onChange={(event) => setReviewFiles(Array.from(event.target.files || []))}
                                        className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-[#3665f3] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-700"
                                    />
                                    {reviewFiles.length > 0 && (
                                        <p className="mt-2 text-xs text-gray-500">{reviewFiles.length} file(s) selected for upload after submit.</p>
                                    )}
                                </div>
                                <div className="mt-4 flex gap-3">
                                    <Button
                                        size="sm"
                                        isLoading={submitting === `review-${item.orderItemId}`}
                                        onClick={() => handleReviewSubmit(item.orderItemId)}
                                    >
                                        Submit review
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setActiveReviewItemId(null)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeFeedbackItemId === item.orderItemId && (
                            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                                <p className="text-sm font-bold text-gray-900">Seller feedback</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {['positive', 'neutral', 'negative'].map((sentiment) => (
                                        <button
                                            key={sentiment}
                                            type="button"
                                            onClick={() => setFeedbackForm((current) => ({ ...current, sentiment }))}
                                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                                feedbackForm.sentiment === sentiment
                                                    ? 'bg-[#3665f3] text-white'
                                                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={feedbackForm.comment}
                                    onChange={(event) => setFeedbackForm((current) => ({ ...current, comment: event.target.value }))}
                                    placeholder="Describe the transaction, communication, and overall seller experience."
                                    className="mt-3 min-h-[120px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#3665f3]"
                                />
                                <div className="mt-4 flex gap-3">
                                    <Button
                                        size="sm"
                                        isLoading={submitting === `feedback-${item.orderItemId}`}
                                        onClick={() => handleFeedbackSubmit(item.orderItemId)}
                                    >
                                        Submit feedback
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setActiveFeedbackItemId(null)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
