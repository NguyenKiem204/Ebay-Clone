import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronDown, PlusCircle, MinusCircle, Heart } from 'lucide-react';
import { Button } from '../../ui/Button';
import api from '../../../lib/axios';

export default function SellerFeedbackModal({ isOpen, onClose, sellerId, productId }) {
    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState('all'); // 'thisItem' | 'all'
    const scrollRef = useRef(null);

    // Fetch seller profile
    useEffect(() => {
        if (!isOpen || !sellerId) return;
        api.get(`/api/Seller/${sellerId}`)
            .then(res => setProfile(res.data.data))
            .catch(() => {});
    }, [isOpen, sellerId]);

    // Fetch reviews
    const fetchReviews = useCallback(async (pageNum, reset = false) => {
        if (!sellerId) return;
        setLoading(true);
        try {
            const params = { page: pageNum, pageSize: 10 };
            if (tab === 'thisItem' && productId) params.productId = productId;
            const res = await api.get(`/api/Seller/${sellerId}/reviews`, { params });
            const data = res.data.data;
            setReviews(prev => reset ? data.items : [...prev, ...data.items]);
            setTotalItems(data.totalItems);
        } catch { /* ignore */ }
        setLoading(false);
    }, [sellerId, tab, productId]);

    useEffect(() => {
        if (!isOpen) return;
        setPage(1);
        setReviews([]);
        fetchReviews(1, true);
    }, [isOpen, tab, fetchReviews]);

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchReviews(next);
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const formatCount = (n) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n?.toLocaleString() || '0';
    };

    const ratings = profile?.detailedRatings;
    const ratingBars = ratings ? [
        { label: 'Accurate description', score: ratings.accurateDescription },
        { label: 'Reasonable shipping cost', score: ratings.reasonableShippingCost },
        { label: 'Shipping speed', score: ratings.shippingSpeed },
        { label: 'Communication', score: ratings.communication },
    ] : [];

    const thisItemCount = tab === 'thisItem' ? totalItems : null;
    const allItemCount = tab === 'all' ? totalItems : null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-[880px] max-h-[90vh] mt-[5vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                    <h2 className="text-[20px] font-bold text-gray-900">About this seller</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT PANEL — Seller Info */}
                    <div className="w-[320px] shrink-0 border-r border-gray-200 p-6 overflow-y-auto">
                        {profile ? (
                            <div className="space-y-6">
                                {/* Avatar & Info */}
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                        <img
                                            src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.username}&size=128`}
                                            alt={profile.username}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[16px] text-gray-900">{profile.username}</h3>
                                        <p className="text-[13px] text-gray-600">
                                            {profile.positivePercent}% positive feedback · {formatCount(profile.itemsSold)} items sold
                                        </p>
                                    </div>
                                </div>

                                {/* Joined */}
                                <div className="flex items-center gap-2 text-[13px] text-gray-600">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                                        <path fill="none" stroke="currentColor" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Joined {profile.joinedDate}</span>
                                </div>

                                {/* Buttons */}
                                <div className="space-y-2.5">
                                    {profile.storeSlug && (
                                        <Link to={`/store/${profile.storeSlug}`} className="block">
                                            <Button className="w-full bg-[#3665f3] hover:bg-blue-700 h-[42px] rounded-full font-bold text-[14px]">
                                                Seller's other items
                                            </Button>
                                        </Link>
                                    )}
                                    <button className="w-full h-[42px] border border-[#3665f3] text-[#3665f3] hover:bg-blue-50 rounded-full font-bold text-[14px] transition-colors">
                                        Message seller
                                    </button>
                                    <button className="w-full h-[42px] border border-[#3665f3] text-[#3665f3] hover:bg-blue-50 rounded-full font-bold text-[14px] flex items-center justify-center gap-2 transition-colors">
                                        <Heart size={16} />
                                        Save seller
                                    </button>
                                </div>

                                {/* Detailed Ratings */}
                                {ratingBars.length > 0 && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <h4 className="text-[15px] font-bold text-gray-900 mb-4">Detailed seller ratings</h4>
                                        <div className="space-y-2.5">
                                            {ratingBars.map((r, idx) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <span className="text-[13px] text-gray-700 max-w-[140px]">{r.label}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-[80px] h-[3px] bg-gray-100 relative rounded-full overflow-hidden">
                                                            <div
                                                                className="absolute top-0 left-0 h-full bg-gray-900 rounded-full"
                                                                style={{ width: `${(r.score / 5) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[12px] text-gray-900 min-w-[24px] text-right font-medium">{r.score}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-2">Average for the last 12 months</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
                                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL — Feedback List */}
                    <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
                        <h3 className="text-[20px] font-bold text-gray-900 mb-4">
                            Seller feedback ({totalItems.toLocaleString()})
                        </h3>

                        {/* Tabs */}
                        <div className="flex gap-6 border-b border-gray-200 mb-4">
                            <button
                                onClick={() => setTab('thisItem')}
                                className={`pb-3 text-[14px] font-medium transition-colors ${tab === 'thisItem' ? 'text-gray-900 border-b-2 border-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                This item {thisItemCount !== null ? `(${thisItemCount.toLocaleString()})` : ''}
                            </button>
                            <button
                                onClick={() => setTab('all')}
                                className={`pb-3 text-[14px] font-medium transition-colors ${tab === 'all' ? 'text-gray-900 border-b-2 border-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                All items {allItemCount !== null ? `(${allItemCount.toLocaleString()})` : ''}
                            </button>
                        </div>

                        {/* Filter chips */}
                        <div className="flex items-center gap-3 mb-5 flex-wrap">
                            <button className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-300 rounded-full text-[13px] text-gray-900 hover:bg-gray-50">
                                Filter: <span className="font-bold">All ratings</span> <ChevronDown size={14} />
                            </button>
                            {['Condition', 'Quality', 'Appearance', 'Satisfaction', 'Dimensions'].map(chip => (
                                <button key={chip} className="px-4 py-1.5 text-[13px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors">
                                    {chip}
                                </button>
                            ))}
                        </div>

                        {/* Review List */}
                        <div className="space-y-6">
                            {reviews.map((review) => (
                                <div key={review.id} className="flex gap-3">
                                    <div className="shrink-0 pt-0.5">
                                        {review.rating >= 4 ? (
                                            <PlusCircle size={18} className="text-[#31a645]" />
                                        ) : review.rating >= 3 ? (
                                            <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-400" />
                                        ) : (
                                            <MinusCircle size={18} className="text-red-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 flex justify-between items-start gap-3">
                                        <div className="space-y-1.5 min-w-0">
                                            <div className="flex items-center gap-1.5 text-[13px]">
                                                <span className="font-medium text-gray-900">{review.reviewerName} ({review.reviewerTotalReviews})</span>
                                                <span className="text-gray-400">·</span>
                                                <span className="text-gray-500">{review.timeAgo}</span>
                                            </div>
                                            <p className="text-[14px] text-gray-800 leading-relaxed">
                                                {review.comment || review.title || 'No comment'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            {review.isVerifiedPurchase && (
                                                <span className="text-[11px] text-gray-500 whitespace-nowrap">Verified purchase</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {reviews.length === 0 && !loading && (
                                <p className="text-center text-gray-500 py-8">No feedback yet</p>
                            )}

                            {loading && (
                                <div className="flex justify-center py-6">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3665f3]" />
                                </div>
                            )}
                        </div>

                        {/* Load more */}
                        {reviews.length < totalItems && !loading && (
                            <div className="pt-6 flex justify-center">
                                <button
                                    onClick={loadMore}
                                    className="px-8 py-2.5 border border-[#3665f3] text-[#3665f3] font-bold rounded-full text-[14px] hover:bg-blue-50 transition-colors"
                                >
                                    See more feedback
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
