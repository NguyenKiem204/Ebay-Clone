import { Link, useNavigate } from 'react-router-dom';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import useHistoryStore from '../../history/useHistoryStore';
import useAuthStore from '../../../store/useAuthStore';
import useSavedStore from '../../saved/useSavedStore';

export function RecentlyViewed() {
    const historyItems = useHistoryStore(s => s.historyItems);
    const { isAuthenticated } = useAuthStore();
    const savedIds = useSavedStore(s => s.savedIds);
    const toggleSaved = useSavedStore(s => s.toggleSaved);
    const navigate = useNavigate();
    const scrollRef = useRef(null);

    if (!historyItems || historyItems.length === 0) return null;

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir * 220, behavior: 'smooth' });
        }
    };

    const handleSaveToggle = (e, productId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            const isVerified = sessionStorage.getItem('verified') === 'true';
            navigate(isVerified
                ? `/login?redirect=/products/${productId}`
                : `/verify?redirect=/products/${productId}`);
            return;
        }
        toggleSaved(productId);
    };

    return (
        <section className="mb-16">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Your Recently Viewed Items</h2>
            </div>

            <div className="relative group/carousel">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll(-1)}
                    className="absolute left-[-16px] top-[100px] -translate-y-1/2 z-10 w-11 h-11 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll(1)}
                    className="absolute right-[-16px] top-[100px] -translate-y-1/2 z-10 w-11 h-11 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
                >
                    <ChevronRight size={24} />
                </button>

                <div ref={scrollRef} className="flex overflow-x-auto pb-4 gap-3 lg:gap-4 snap-x scrollbar-hide">
                    {historyItems.map((item) => {
                        const isSaved = savedIds.has(item.productId);
                        return (
                            <div
                                key={item.productId}
                                className="flex flex-col min-w-[160px] max-w-[160px] md:min-w-[200px] md:max-w-[200px] snap-start group pb-2"
                            >
                                <div className="relative w-full aspect-square rounded-2xl bg-[#F4F4F4] overflow-hidden mb-3 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow">
                                    <button
                                        onClick={(e) => handleSaveToggle(e, item.productId)}
                                        className="absolute top-2 right-2 z-10 w-9 h-9 bg-white/70 hover:bg-white backdrop-blur rounded-full flex items-center justify-center transition-colors border border-gray-200 shadow-sm"
                                        title={isSaved ? 'Remove from saved' : 'Save'}
                                    >
                                        <Heart
                                            size={20}
                                            strokeWidth={1.5}
                                            className={isSaved ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}
                                        />
                                    </button>
                                    <Link to={`/products/${item.productId}`} className="block w-full h-full">
                                        {item.productImage ? (
                                            <img
                                                src={item.productImage}
                                                alt={item.productName}
                                                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300 p-2"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200 text-4xl">Ã°Å¸â€œÂ¦</div>
                                        )}
                                        <div className="absolute inset-0 bg-neutral-800 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" />
                                    </Link>
                                </div>

                                <Link to={`/products/${item.productId}`} className="flex flex-col flex-grow gap-1">
                                    <h3 className="text-[14px] text-[#333] leading-[1.3] line-clamp-2 h-[2.6em] group-hover:underline m-0">
                                        {item.productName}
                                    </h3>
                                    <div className="flex flex-wrap items-baseline gap-x-2 mt-1">
                                        <span className="font-bold text-[16px] text-gray-900">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(item.price || 0))}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-blue-600 font-medium">
                                        {item.shippingFee === 0
                                            ? 'Free shipping'
                                            : `+${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(item.shippingFee || 0))} shipping`}
                                    </span>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
