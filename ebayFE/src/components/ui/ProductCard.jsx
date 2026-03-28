import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useSavedStore from '../../features/saved/useSavedStore';
import {
    formatAuctionRelativeTime,
    getAuctionStatusMeta,
    normalizeAuctionLifecycle
} from '../../features/auction/utils/auctionPresentation';
import { resolveMediaUrl } from '../../lib/media';

import useCurrencyStore from '../../store/useCurrencyStore';

export function ProductCard({ product }) {
    const formatPrice = useCurrencyStore(s => s.formatPrice);
    const [nowTick, setNowTick] = useState(() => Date.now());
    const { isAuthenticated } = useAuthStore();
    const isSaved = useSavedStore(s => s.savedIds.has(product?.id));
    const toggleSaved = useSavedStore(s => s.toggleSaved);
    const navigate = useNavigate();

    if (!product) return null;

    const handleSaveToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            const isVerified = sessionStorage.getItem('verified') === 'true';
            if (isVerified) {
                navigate(`/login?redirect=/products/${product.id}`);
            } else {
                navigate(`/verify?redirect=/products/${product.id}`);
            }
            return;
        }
        toggleSaved(product.id);
    };

    const auctionStatus = product.isAuction
        ? normalizeAuctionLifecycle({
            auctionStatus: product.auctionStatus,
            auctionStartTime: product.auctionStartTime,
            auctionEndTime: product.auctionEndTime,
            winningBidderId: product.winningBidderId
        })
        : null;
    const auctionStatusMeta = auctionStatus ? getAuctionStatusMeta(auctionStatus) : null;
    const auctionTimeCopy = auctionStatus === 'scheduled'
        ? formatAuctionRelativeTime(product.auctionStartTime, 'Starts in', nowTick)
        : formatAuctionRelativeTime(product.auctionEndTime, 'Ends in', nowTick);

    useEffect(() => {
        if (!product.isAuction) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setNowTick(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [product.isAuction]);

    return (
        <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-shadow h-full">
            {product.discount > 0 && (
                <div className="absolute top-2 left-2 z-10 bg-primary leading-none text-white text-xs font-bold px-2 py-1 rounded">
                    {product.discount}% OFF
                </div>
            )}
            <button
                onClick={handleSaveToggle}
                className="absolute top-2 right-2 z-10 p-2 transition-colors"
                title={isSaved ? 'Remove from saved' : 'Save'}
            >
                <Heart
                    size={22}
                    strokeWidth={1.5}
                    className={isSaved ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}
                />
            </button>

            <Link to={`/products/${product.id}`} className="block relative pt-[100%] overflow-hidden bg-white px-2">
                <img
                    src={resolveMediaUrl(product.thumbnail || product.imageUrl)}
                    alt={product.title || product.name}
                    className="absolute inset-0 w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300 p-2"
                />
            </Link>

            <div className="p-3 flex flex-col flex-grow">
                {product.isAuction && auctionStatusMeta && (
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${auctionStatusMeta.badgeClassName}`}>
                            {auctionStatusMeta.label}
                        </span>
                        <span className="text-[10px] text-gray-500">{auctionTimeCopy}</span>
                    </div>
                )}

                <Link to={`/products/${product.id}`} className="text-[13px] leading-tight font-normal text-gray-800 line-clamp-2 hover:underline mb-1 flex-grow">
                    {product.title || product.name}
                </Link>
                <div className="flex items-center gap-1 mb-1">
                    <div className="flex text-yellow-400 text-[10px]">
                        {'★'.repeat(Math.round(product.rating || 5))}
                        {'☆'.repeat(5 - Math.round(product.rating || 5))}
                    </div>
                    <span className="text-[10px] text-gray-500">({product.reviewCount || 0})</span>
                </div>

                <div className="mt-auto">
                    <div className="text-base font-bold text-gray-900 leading-tight">
                        {product.isAuction ? (
                            <>
                                <span className="text-[11px] font-normal text-gray-500 block mb-0.5">Current bid:</span>
                                {formatPrice(product.currentBid || product.price)}
                            </>
                        ) : (
                            formatPrice(product.price)
                        )}
                    </div>
                    {product.isAuction && (
                        <>
                            <div className="text-[11px] text-secondary font-medium mt-0.5">
                                {product.bidCount || 0} {product.bidCount === 1 ? 'bid' : 'bids'}
                            </div>
                            {product.buyItNowPrice && (
                                <div className="text-[11px] text-[#3665f3] font-medium mt-0.5">
                                    Buy It Now: {formatPrice(product.buyItNowPrice)}
                                </div>
                            )}
                        </>
                    )}
                    {!product.isAuction && product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-[11px] text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                        </div>
                    )}

                    <div className="flex flex-col gap-0.5 mt-1">
                        <span className="text-[11px] text-blue-700 font-medium leading-none">
                            {product.shippingFee === 0
                                ? 'Free shipping'
                                : `+${formatPrice(product.shippingFee || 0)} shipping`}
                        </span>
                        <span className="text-[10px] text-gray-400">From {product.sellerName || 'ebay_seller'}</span>
                    </div>
                </div>

                <div className="mt-2 overflow-hidden h-0 group-hover:h-8 transition-all opacity-0 group-hover:opacity-100">
                    <Link
                        to={`/products/${product.id}`}
                        className="flex w-full items-center justify-center text-[12px] h-8 bg-secondary hover:bg-blue-700 text-white rounded-full font-bold"
                    >
                        <ShoppingCart size={14} className="mr-1.5" />
                        {product.isAuction ? 'View auction' : 'View item'}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;
