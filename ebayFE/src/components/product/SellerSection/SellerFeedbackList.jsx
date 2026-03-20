import { useState, useEffect } from 'react';
import { ChevronDown, PlusCircle, MinusCircle } from 'lucide-react';
import api from '../../../lib/axios';

export default function SellerFeedbackList({ product, onOpenModal }) {
    const [reviews, setReviews] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState('all'); // 'thisItem' | 'all'

    const fetchReviews = async () => {
        if (!product?.sellerId) return;
        setLoading(true);
        try {
            const params = { page: 1, pageSize: 5 }; // Only load a few for the preview
            if (tab === 'thisItem') params.productId = product.id;
            const res = await api.get(`/api/Seller/${product.sellerId}/reviews`, { params });
            const data = res.data.data;
            setReviews(data.items);
            setTotalItems(data.totalItems);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => {
        fetchReviews();
    }, [product?.sellerId, tab]); // eslint-disable-line react-hooks/exhaustive-deps

    const chips = ['Condition', 'Quality', 'Satisfaction', 'Appearance', 'Value', 'Extras', 'Usage'];

    return (
        <div className="space-y-6">
            <h2 className="text-[24px] font-bold text-gray-900">
                Seller feedback <span className="text-gray-500 font-normal">({totalItems.toLocaleString()})</span>
            </h2>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-200">
                <button
                    onClick={() => setTab('thisItem')}
                    className={`pb-3 text-[14px] font-medium transition-colors ${tab === 'thisItem' ? 'font-bold text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    This item {tab === 'thisItem' ? `(${totalItems.toLocaleString()})` : ''}
                </button>
                <button
                    onClick={() => setTab('all')}
                    className={`pb-3 text-[14px] font-medium transition-colors ${tab === 'all' ? 'font-bold text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    All items {tab === 'all' ? `(${totalItems.toLocaleString()})` : ''}
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 py-2 overflow-x-auto scbar-none">
                <button className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border border-gray-300 rounded-full text-[13px] text-gray-900 hover:bg-gray-50">
                    Filter: <span className="font-bold">All ratings</span> <ChevronDown size={14} />
                </button>
                {chips.map(chip => (
                    <button key={chip} className="flex-shrink-0 px-4 py-1.5 text-[13px] text-gray-600 hover:text-gray-900">
                        {chip}
                    </button>
                ))}
            </div>

            {/* Feedback List */}
            <div className="space-y-10 pt-4">
                {reviews.map((fb) => (
                    <div key={fb.id} className="flex gap-4">
                        <div className="flex-shrink-0 pt-1">
                            {fb.rating >= 4 ? (
                                <PlusCircle size={20} className="text-[#31a645]" fill="white" />
                            ) : fb.rating >= 3 ? (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
                            ) : (
                                <MinusCircle size={20} className="text-red-500" fill="white" />
                            )}
                        </div>
                        <div className="flex-1 flex justify-between items-start gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-[13px]">
                                    <span className="font-medium text-gray-900">{fb.reviewerName} ({fb.reviewerTotalReviews})</span>
                                    <span className="text-gray-400">·</span>
                                    <span className="text-gray-500">{fb.timeAgo}</span>
                                </div>
                                <p className="text-[14px] text-gray-800 leading-[1.4] max-w-[600px]">
                                    {fb.comment || fb.title || 'No comment'}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                {fb.isVerifiedPurchase && (
                                    <span className="text-[11px] text-gray-500">Verified purchase</span>
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

            {totalItems > 0 && (
                <div className="pt-6">
                    <button
                        onClick={onOpenModal}
                        className="px-8 py-2 border border-[#3665f3] text-[#3665f3] font-bold rounded-full text-[14px] hover:bg-blue-50 transition-colors"
                    >
                        See all feedback
                    </button>
                </div>
            )}
        </div>
    );
}
