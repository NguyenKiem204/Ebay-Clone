import { Link } from 'react-router-dom';
import { BookmarkCheck, ShoppingCart, Loader2, Heart } from 'lucide-react';
import useWatchlistStore from '../features/watchlist/useWatchlistStore';
import useAuthStore from '../store/useAuthStore';

export default function WatchlistPage() {
    const { isAuthenticated } = useAuthStore();
    const watchItems = useWatchlistStore(s => s.watchItems);
    const loading = useWatchlistStore(s => s.loading);
    const toggleWatch = useWatchlistStore(s => s.toggleWatch);

    if (!isAuthenticated) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-gray-600">
                <BookmarkCheck size={56} className="text-gray-300" />
                <h2 className="text-xl font-bold text-gray-800">Sign in to see your watchlist</h2>
                <Link to="/login?redirect=/watchlist" className="px-8 py-3 bg-[#3665f3] text-white font-bold rounded-full hover:bg-blue-700 transition">
                    Sign in
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen pb-12">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex items-center gap-3 mb-8">
                    <BookmarkCheck size={28} className="text-[#3665f3]" />
                    <h1 className="text-[28px] font-bold text-gray-900">Watchlist</h1>
                    <span className="text-[16px] text-gray-500 font-normal">({watchItems.length})</span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-[#3665f3]" />
                    </div>
                ) : watchItems.length === 0 ? (
                    <div className="text-center py-20">
                        <BookmarkCheck size={64} className="mx-auto mb-4 text-gray-200" />
                        <h2 className="text-xl font-bold text-gray-700 mb-2">Your watchlist is empty</h2>
                        <p className="text-gray-500 mb-6">Click "Add to Watchlist" on any product page to track items here.</p>
                        <Link to="/" className="px-8 py-3 bg-[#3665f3] text-white font-bold rounded-full hover:bg-blue-700 transition">
                            Start shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {watchItems.map(item => (
                            <div key={item.productId} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white group">
                                <Link to={`/products/${item.productId}`} className="block relative pt-[80%] bg-gray-50 overflow-hidden">
                                    {item.productImage ? (
                                        <img
                                            src={item.productImage}
                                            alt={item.productName}
                                            className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-200">
                                            <ShoppingCart size={48} />
                                        </div>
                                    )}
                                </Link>
                                <div className="p-4">
                                    <Link to={`/products/${item.productId}`} className="text-[14px] text-gray-900 font-medium line-clamp-2 hover:underline leading-tight mb-2 block">
                                        {item.productName}
                                    </Link>
                                    <div className="text-[18px] font-bold text-gray-900 mb-1">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                    </div>
                                    <div className="text-[12px] text-blue-600">
                                        {item.shippingFee === 0 ? 'Free shipping' : `+${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.shippingFee)} shipping`}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <Link
                                            to={`/products/${item.productId}`}
                                            className="flex-1 text-center py-2 bg-[#3665f3] text-white text-[13px] font-bold rounded-full hover:bg-blue-700 transition"
                                        >
                                            View item
                                        </Link>
                                        <button
                                            onClick={() => toggleWatch(item.productId)}
                                            className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-full text-gray-400 hover:bg-gray-50 hover:border-red-300 hover:text-red-400 transition"
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
