import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import reviewService from '../../features/reviews/services/reviewService';
import ReviewMediaGallery from '../../features/reviews/components/ReviewMediaGallery';
import { resolveMediaUrl } from '../../lib/media';

function Stars({ value }) {
    return (
        <span className="text-amber-400">
            {'\u2605'.repeat(Math.max(0, Number(value) || 0))}
            <span className="text-gray-300">{'\u2605'.repeat(Math.max(0, 5 - (Number(value) || 0)))}</span>
        </span>
    );
}

export default function SellerReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyDrafts, setReplyDrafts] = useState({});
    const [saving, setSaving] = useState(null);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const data = await reviewService.getSellerReceivedReviews();
            setReviews(Array.isArray(data) ? data : []);
            setReplyDrafts((current) => {
                const next = { ...current };
                (Array.isArray(data) ? data : []).forEach((review) => {
                    next[review.reviewId] = review.sellerReply?.reply || current[review.reviewId] || '';
                });
                return next;
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to load seller reviews.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, []);

    const saveReply = async (reviewId) => {
        setSaving(reviewId);
        try {
            await reviewService.replyToReview(reviewId, { reply: replyDrafts[reviewId] || '' });
            toast.success('Seller reply saved.');
            await loadReviews();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to save this seller reply.');
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#3665f3]">Seller reviews</p>
                <h1 className="mt-2 text-3xl font-black text-gray-900">Reply to buyer reviews</h1>
                <p className="mt-2 text-sm text-gray-500">
                    Review recent product feedback, inspect media buyers uploaded, and respond publicly as the seller.
                </p>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                {loading && <p className="text-sm text-gray-500">Loading seller reviews...</p>}

                {!loading && reviews.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-sm text-gray-500">
                        No published buyer reviews are available for your listings yet.
                    </div>
                )}

                <div className="space-y-5">
                    {reviews.map((review) => (
                        <article key={review.reviewId} className="rounded-2xl border border-gray-200 p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex gap-4">
                                    <img
                                        src={resolveMediaUrl(review.productImage) || 'https://via.placeholder.com/96'}
                                        alt={review.productTitle}
                                        className="h-20 w-20 rounded-xl border border-gray-100 object-cover"
                                    />
                                    <div>
                                        <p className="font-black text-gray-900">{review.productTitle}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <Stars value={review.rating} />
                                            <span className="text-sm font-semibold text-gray-900">{review.reviewerDisplayName}</span>
                                            {review.isVerifiedPurchase && (
                                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                                    Verified purchase
                                                </span>
                                            )}
                                        </div>
                                        {review.title && <p className="mt-2 text-sm font-semibold text-gray-800">{review.title}</p>}
                                        <p className="mt-2 text-sm leading-7 text-gray-700">{review.content}</p>
                                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                            Helpful votes: {review.helpfulCount}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-US')}</p>
                            </div>

                            <ReviewMediaGallery mediaItems={review.mediaItems} />

                            {review.sellerReply && (
                                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Current seller reply</p>
                                    <p className="mt-2 text-sm leading-7 text-gray-700">{review.sellerReply.reply}</p>
                                </div>
                            )}

                            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-sm font-bold text-gray-900">Public seller reply</p>
                                <textarea
                                    value={replyDrafts[review.reviewId] || ''}
                                    onChange={(event) => setReplyDrafts((current) => ({ ...current, [review.reviewId]: event.target.value }))}
                                    placeholder="Reply to this review as the seller."
                                    className="mt-3 min-h-[120px] w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#3665f3]"
                                />
                                <div className="mt-4">
                                    <Button size="sm" isLoading={saving === review.reviewId} onClick={() => saveReply(review.reviewId)}>
                                        Save reply
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
