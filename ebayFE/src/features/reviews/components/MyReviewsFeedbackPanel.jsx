import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import reviewService from '../services/reviewService';
import { resolveMediaUrl } from '../../../lib/media';
import ReviewMediaGallery from './ReviewMediaGallery';

function Stars({ value, onChange, interactive = false }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={!interactive}
                    onClick={() => interactive && onChange(star)}
                    className={`${star <= value ? 'text-amber-400' : 'text-gray-300'} ${interactive ? 'text-2xl' : 'text-base'} transition`}
                >
                    {'\u2605'}
                </button>
            ))}
        </div>
    );
}

export default function MyReviewsFeedbackPanel() {
    const [dashboard, setDashboard] = useState({ pendingItems: [], productReviews: [], sellerFeedback: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('reviews');
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editingFeedbackId, setEditingFeedbackId] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '' });
    const [feedbackForm, setFeedbackForm] = useState({ sentiment: 'positive', comment: '' });
    const [reviewFiles, setReviewFiles] = useState([]);
    const [saving, setSaving] = useState(null);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const data = await reviewService.getDashboard();
            setDashboard(data || { pendingItems: [], productReviews: [], sellerFeedback: [] });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to load your review dashboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const startEditReview = (review) => {
        setEditingFeedbackId(null);
        setEditingReviewId(review.id);
        setReviewFiles([]);
        setReviewForm({
            rating: review.rating,
            title: review.title || '',
            content: review.content || ''
        });
    };

    const startEditFeedback = (feedback) => {
        setEditingReviewId(null);
        setEditingFeedbackId(feedback.id);
        setFeedbackForm({
            sentiment: feedback.sentiment,
            comment: feedback.comment || ''
        });
    };

    const saveReview = async (reviewId) => {
        setSaving(`review-${reviewId}`);
        try {
            await reviewService.updateProductReview(reviewId, reviewForm);
            if (reviewFiles.length > 0) {
                await reviewService.uploadReviewMedia(reviewId, reviewFiles);
            }
            toast.success('Review updated.');
            setEditingReviewId(null);
            setReviewFiles([]);
            await loadDashboard();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to update this review.');
        } finally {
            setSaving(null);
        }
    };

    const removeReviewMedia = async (reviewId, mediaUrl) => {
        setSaving(`media-${reviewId}`);
        try {
            await reviewService.removeReviewMedia(reviewId, mediaUrl);
            toast.success('Review media removed.');
            await loadDashboard();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to remove this media item.');
        } finally {
            setSaving(null);
        }
    };

    const saveFeedback = async (feedbackId) => {
        setSaving(`feedback-${feedbackId}`);
        try {
            await reviewService.updateSellerFeedback(feedbackId, feedbackForm);
            toast.success('Seller feedback updated.');
            setEditingFeedbackId(null);
            await loadDashboard();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to update this seller feedback.');
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-8">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#3665f3]">Reviews & Feedback</p>
                        <h2 className="mt-2 text-2xl font-black text-gray-900">Manage what you have shared</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Review delivered items, add media, track seller replies, and update your recent submissions inside My eBay.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="rounded-2xl bg-blue-50 px-4 py-3 text-center">
                            <p className="text-xs font-bold uppercase tracking-wide text-blue-500">Pending</p>
                            <p className="mt-1 text-2xl font-black text-blue-900">{dashboard.pendingItems.length}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-100 px-4 py-3 text-center">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Published</p>
                            <p className="mt-1 text-2xl font-black text-gray-900">
                                {dashboard.productReviews.length + dashboard.sellerFeedback.length}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black text-gray-900">Ready for review</h3>
                <p className="mt-1 text-sm text-gray-500">Delivered items that still need a product review or seller feedback.</p>

                <div className="mt-5 space-y-4">
                    {loading && <p className="text-sm text-gray-500">Loading your review queue...</p>}
                    {!loading && dashboard.pendingItems.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-sm text-gray-500">
                            Nothing is waiting for review right now.
                        </div>
                    )}
                    {!loading && dashboard.pendingItems.map((item) => (
                        <div key={`${item.orderId}-${item.orderItemId}`} className="rounded-2xl border border-gray-200 p-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex gap-4">
                                    <img
                                        src={resolveMediaUrl(item.productImage) || 'https://via.placeholder.com/96'}
                                        alt={item.productTitle}
                                        className="h-20 w-20 rounded-xl border border-gray-100 object-cover"
                                    />
                                    <div>
                                        <p className="font-black text-gray-900">{item.productTitle}</p>
                                        <p className="mt-1 text-sm text-gray-500">Seller: {item.sellerName}</p>
                                        <p className="mt-1 text-xs text-gray-400">Order {item.orderNumber}</p>
                                    </div>
                                </div>
                                <Link to={`/orders/${item.orderId}`} className="text-sm font-bold text-[#3665f3] hover:underline">
                                    Open order detail
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => setActiveTab('reviews')}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === 'reviews' ? 'bg-[#3665f3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Reviews for products
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('feedback')}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === 'feedback' ? 'bg-[#3665f3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Feedback for sellers
                    </button>
                </div>

                {activeTab === 'reviews' && (
                    <div className="mt-5 space-y-4">
                        {!loading && dashboard.productReviews.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-sm text-gray-500">
                                You have not published any product reviews yet.
                            </div>
                        )}
                        {dashboard.productReviews.map((review) => (
                            <div key={review.id} className="rounded-2xl border border-gray-200 p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="flex gap-4">
                                        <img
                                            src={resolveMediaUrl(review.productImage) || 'https://via.placeholder.com/96'}
                                            alt={review.productTitle}
                                            className="h-20 w-20 rounded-xl border border-gray-100 object-cover"
                                        />
                                        <div>
                                            <p className="font-black text-gray-900">{review.productTitle}</p>
                                            <div className="mt-2"><Stars value={review.rating} /></div>
                                            {review.title && <p className="mt-2 text-sm font-semibold text-gray-800">{review.title}</p>}
                                            <p className="mt-2 text-sm leading-6 text-gray-600">{review.content}</p>
                                            <ReviewMediaGallery mediaItems={review.mediaItems} />
                                            {review.sellerReply && (
                                                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Seller reply</p>
                                                    <p className="mt-2 text-sm font-semibold text-gray-900">{review.sellerReply.sellerDisplayName}</p>
                                                    <p className="mt-2 text-sm leading-7 text-gray-700">{review.sellerReply.reply}</p>
                                                </div>
                                            )}
                                            <p className="mt-3 text-xs text-gray-400">
                                                Updated {new Date(review.updatedAt || review.createdAt).toLocaleString('en-US')}
                                            </p>
                                        </div>
                                    </div>
                                    {review.canEdit && (
                                        <Button variant="outline" size="sm" onClick={() => startEditReview(review)}>
                                            Edit review
                                        </Button>
                                    )}
                                </div>

                                {editingReviewId === review.id && (
                                    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                                        <Stars value={reviewForm.rating} onChange={(rating) => setReviewForm((current) => ({ ...current, rating }))} interactive />
                                        <input
                                            type="text"
                                            value={reviewForm.title}
                                            onChange={(event) => setReviewForm((current) => ({ ...current, title: event.target.value }))}
                                            placeholder="Review title"
                                            className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#3665f3]"
                                        />
                                        <textarea
                                            value={reviewForm.content}
                                            onChange={(event) => setReviewForm((current) => ({ ...current, content: event.target.value }))}
                                            className="mt-3 min-h-[120px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#3665f3]"
                                        />

                                        <div className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-3">
                                            <label className="text-sm font-semibold text-gray-700">Add more photos or videos</label>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,video/*"
                                                onChange={(event) => setReviewFiles(Array.from(event.target.files || []))}
                                                className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-[#3665f3] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-700"
                                            />
                                            {reviewFiles.length > 0 && (
                                                <p className="mt-2 text-xs text-gray-500">{reviewFiles.length} file(s) selected for upload.</p>
                                            )}
                                        </div>

                                        <ReviewMediaGallery
                                            mediaItems={review.mediaItems}
                                            onRemove={(mediaUrl) => removeReviewMedia(review.id, mediaUrl)}
                                        />

                                        <div className="mt-4 flex gap-3">
                                            <Button size="sm" isLoading={saving === `review-${review.id}`} onClick={() => saveReview(review.id)}>
                                                Save changes
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setEditingReviewId(null)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'feedback' && (
                    <div className="mt-5 space-y-4">
                        {!loading && dashboard.sellerFeedback.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-sm text-gray-500">
                                You have not left seller feedback yet.
                            </div>
                        )}
                        {dashboard.sellerFeedback.map((feedback) => (
                            <div key={feedback.id} className="rounded-2xl border border-gray-200 p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <p className="font-black text-gray-900">{feedback.productTitle}</p>
                                        <p className="mt-1 text-sm text-gray-500">Seller: {feedback.sellerName}</p>
                                        <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                                            feedback.sentiment === 'positive'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : feedback.sentiment === 'neutral'
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : 'bg-red-50 text-red-700'
                                        }`}>
                                            {feedback.sentiment}
                                        </span>
                                        <p className="mt-3 text-sm leading-6 text-gray-600">{feedback.comment}</p>
                                        <p className="mt-3 text-xs text-gray-400">
                                            Updated {new Date(feedback.updatedAt || feedback.createdAt).toLocaleString('en-US')}
                                        </p>
                                    </div>
                                    {feedback.canEdit && (
                                        <Button variant="outline" size="sm" onClick={() => startEditFeedback(feedback)}>
                                            Edit feedback
                                        </Button>
                                    )}
                                </div>

                                {editingFeedbackId === feedback.id && (
                                    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                                        <div className="flex flex-wrap gap-2">
                                            {['positive', 'neutral', 'negative'].map((sentiment) => (
                                                <button
                                                    key={sentiment}
                                                    type="button"
                                                    onClick={() => setFeedbackForm((current) => ({ ...current, sentiment }))}
                                                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                                        feedbackForm.sentiment === sentiment
                                                            ? 'bg-[#3665f3] text-white'
                                                            : 'bg-white text-gray-600 ring-1 ring-gray-200'
                                                    }`}
                                                >
                                                    {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            value={feedbackForm.comment}
                                            onChange={(event) => setFeedbackForm((current) => ({ ...current, comment: event.target.value }))}
                                            className="mt-3 min-h-[120px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#3665f3]"
                                        />
                                        <div className="mt-4 flex gap-3">
                                            <Button size="sm" isLoading={saving === `feedback-${feedback.id}`} onClick={() => saveFeedback(feedback.id)}>
                                                Save changes
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setEditingFeedbackId(null)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
