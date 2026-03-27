import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkCheck, ShoppingCart, Loader2, Heart } from 'lucide-react';
import useWatchlistStore from '../features/watchlist/useWatchlistStore';
import useAuthStore from '../store/useAuthStore';
import { isUserInteractingWithForm } from '../lib/autoRefresh';

function formatUsd(value) {
    return `US $${Number(value || 0).toLocaleString()}`;
}

function formatTimeLeft(endTime) {
    if (!endTime) {
        return 'N/A';
    }

    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) {
        return 'Ended';
    }

    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
        return `${days}d ${hours}h`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

function getStatusTone(status) {
    switch ((status || '').toUpperCase()) {
        case 'LEADING':
            return 'bg-green-50 border-green-200 text-green-700';
        case 'OUTBID':
            return 'bg-red-50 border-red-200 text-red-700';
        case 'WINNING':
            return 'bg-blue-50 border-blue-200 text-blue-700';
        case 'LOST':
            return 'bg-gray-100 border-gray-200 text-gray-700';
        default:
            return 'bg-gray-50 border-gray-200 text-gray-600';
    }
}

export default function WatchlistPage() {
    const { isAuthenticated } = useAuthStore();
    const watchItems = useWatchlistStore((state) => state.watchItems);
    const loading = useWatchlistStore((state) => state.loading);
    const toggleWatch = useWatchlistStore((state) => state.toggleWatch);
    const fetchWatchlist = useWatchlistStore((state) => state.fetchWatchlist);

    useEffect(() => {
        if (!isAuthenticated) {
            return undefined;
        }

        fetchWatchlist();
        const timer = window.setInterval(() => {
            if (!isUserInteractingWithForm()) {
                fetchWatchlist();
            }
        }, 30000);

        return () => window.clearInterval(timer);
    }, [fetchWatchlist, isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-gray-600">
                <BookmarkCheck size={56} className="text-gray-300" />
                <h2 className="text-xl font-bold text-gray-800">Sign in to see your watchlist</h2>
                <Link to="/login?redirect=/watchlist" className="rounded-full bg-[#3665f3] px-8 py-3 font-bold text-white transition hover:bg-blue-700">
                    Sign in
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-12">
            <div className="container mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8 flex items-center gap-3">
                    <BookmarkCheck size={28} className="text-[#3665f3]" />
                    <h1 className="text-[28px] font-bold text-gray-900">Watchlist</h1>
                    <span className="text-[16px] font-normal text-gray-500">({watchItems.length})</span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-[#3665f3]" />
                    </div>
                ) : watchItems.length === 0 ? (
                    <div className="py-20 text-center">
                        <BookmarkCheck size={64} className="mx-auto mb-4 text-gray-200" />
                        <h2 className="mb-2 text-xl font-bold text-gray-700">Your watchlist is empty</h2>
                        <p className="mb-6 text-gray-500">Click "Add to Watchlist" on any product page to track items here.</p>
                        <Link to="/" className="rounded-full bg-[#3665f3] px-8 py-3 font-bold text-white transition hover:bg-blue-700">
                            Start shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {watchItems.map((item) => (
                            <div key={item.productId} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
                                <Link to={`/products/${item.productId}`} className="relative block overflow-hidden bg-gray-50 pt-[72%]">
                                    {item.productImage ? (
                                        <img
                                            src={item.productImage}
                                            alt={item.productName}
                                            className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-200">
                                            <ShoppingCart size={48} />
                                        </div>
                                    )}
                                </Link>

                                <div className="p-4">
                                    <div className="mb-2 flex items-start justify-between gap-3">
                                        <Link to={`/products/${item.productId}`} className="line-clamp-2 text-[14px] font-medium leading-tight text-gray-900 hover:underline">
                                            {item.productName}
                                        </Link>
                                        {item.isAuction && (
                                            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusTone(item.userBidStatus)}`}>
                                                {item.userBidStatus}
                                            </span>
                                        )}
                                    </div>

                                    {item.isAuction ? (
                                        <>
                                            <div className="mb-3 text-[18px] font-bold text-gray-900">
                                                {formatUsd(item.currentPrice)}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[12px]">
                                                <div className="rounded-xl bg-gray-50 p-3">
                                                    <p className="text-gray-500">Time left</p>
                                                    <p className="mt-1 font-semibold text-gray-900">{formatTimeLeft(item.auctionEndTime)}</p>
                                                </div>
                                                <div className="rounded-xl bg-gray-50 p-3">
                                                    <p className="text-gray-500">Bids</p>
                                                    <p className="mt-1 font-semibold text-gray-900">{item.bidCount}</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mb-1 text-[18px] font-bold text-gray-900">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}
                                            </div>
                                            <div className="text-[12px] text-blue-600">
                                                {item.shippingFee === 0
                                                    ? 'Free shipping'
                                                    : `+${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.shippingFee)} shipping`}
                                            </div>
                                        </>
                                    )}

                                    <div className="mt-4 flex gap-2">
                                        <Link
                                            to={`/products/${item.productId}`}
                                            className="flex-1 rounded-full bg-[#3665f3] py-2 text-center text-[13px] font-bold text-white transition hover:bg-blue-700"
                                        >
                                            {item.isAuction ? 'View auction' : 'View item'}
                                        </Link>
                                        <button
                                            onClick={() => toggleWatch(item.productId)}
                                            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-400 transition hover:border-red-300 hover:bg-gray-50 hover:text-red-400"
                                            title="Remove from watchlist"
                                        >
                                            <Heart size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
