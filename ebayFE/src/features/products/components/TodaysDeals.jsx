import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import useProductStore from '../../../store/useProductStore';
import useAuthStore from '../../../store/useAuthStore';
import useSavedStore from '../../saved/useSavedStore';

import useCurrencyStore from '../../../store/useCurrencyStore';

export function TodaysDeals() {
    const formatPrice = useCurrencyStore(s => s.formatPrice);
    const { bestDeals, loading } = useProductStore();
    const { isAuthenticated } = useAuthStore();
    const savedIds = useSavedStore(s => s.savedIds);
    const toggleSaved = useSavedStore(s => s.toggleSaved);
    const navigate = useNavigate();

    const isSavedFn = (id) => savedIds.has(id);

    if (loading && bestDeals.length === 0) {
        return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl mb-16"></div>;
    }

    if (!bestDeals || bestDeals.length === 0) return null;

    const handleSaveToggle = (e, productId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            const isVerified = sessionStorage.getItem('verified') === 'true';
            if (isVerified) {
                navigate(`/login?redirect=/products/${productId}`);
            } else {
                navigate(`/verify?redirect=/products/${productId}`);
            }
            return;
        }
        toggleSaved(productId);
    };

    return (
        <section className="mb-16">
            <div className="flex flex-col mb-4">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 m-0 leading-none">Today's Deals</h2>
                        <span className="text-sm text-gray-500 font-medium">All With Free Shipping</span>
                    </div>
                    <Link to="/products?filter=deals" className="text-[#0654ba] hover:underline text-sm font-medium flex items-center gap-1">
                        See all <span className="text-lg leading-none">&rarr;</span>
                    </Link>
                </div>
            </div>

            <div className="flex overflow-x-auto pb-6 gap-3 lg:gap-4 snap-x mb-8">
                {bestDeals.map((product) => {
                    const isSaved = isSavedFn(product.id);
                    return (
                        <div key={product.id} className="flex flex-col min-w-[160px] max-w-[160px] md:min-w-[210px] md:max-w-[210px] snap-start group pb-2">
                            <div className="relative w-full aspect-square rounded-2xl bg-[#EFEFEF] overflow-hidden mb-3 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow">
                                <button
                                    onClick={(e) => handleSaveToggle(e, product.id)}
                                    className="absolute top-2 right-2 z-10 w-9 h-9 bg-white/70 hover:bg-white backdrop-blur rounded-full flex items-center justify-center transition-colors border border-gray-200 shadow-sm"
                                    title={isSaved ? 'Remove from saved' : 'Save'}
                                >
                                    <Heart
                                        size={20}
                                        strokeWidth={1.5}
                                        className={isSaved ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}
                                    />
                                </button>
                                <Link to={`/products/${product.id}`} className="block w-full h-full">
                                    <img
                                        src={product.thumbnail}
                                        alt={product.title}
                                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-neutral-800 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                                </Link>
                            </div>

                            <Link to={`/products/${product.id}`} className="flex flex-col flex-grow gap-1">
                                <h3 className="text-[15px] text-[#333] leading-[1.3] line-clamp-2 h-[2.6em] group-hover:underline m-0">
                                    {product.title}
                                </h3>
                                <div className="flex flex-wrap items-baseline gap-x-2 mt-1">
                                    <span className="font-bold text-[17px] text-gray-900">
                                        {formatPrice(product.price)}
                                    </span>
                                    {product.discountPrice && (
                                        <span className="text-gray-500 text-sm line-through">
                                            {formatPrice(product.discountPrice)}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
