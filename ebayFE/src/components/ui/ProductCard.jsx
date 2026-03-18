import { Link } from 'react-router-dom';
import { Button } from './Button';
import { useRequireAuth } from '../../hooks/useRequireAuth';

export function ProductCard({ product }) {
    const { handleSecureAction } = useRequireAuth();

    if (!product) return null;

    return (
        <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-shadow h-full">
            {product.discount > 0 && (
                <div className="absolute top-2 left-2 z-10 bg-primary leading-none text-white text-xs font-bold px-2 py-1 rounded">
                    {product.discount}% OFF
                </div>
            )}
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    handleSecureAction(() => {});
                }}
                className="absolute top-2 right-2 z-10 p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Add to watchlist"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            </button>

            <Link to={`/products/${product.id}`} className="block relative pt-[100%] overflow-hidden bg-white px-2">
                <img
                    src={product.thumbnail || product.imageUrl}
                    alt={product.title || product.name}
                    className="absolute inset-0 w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300 p-2"
                />
            </Link>

            <div className="p-3 flex flex-col flex-grow">
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
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.currentBid || product.price)}
                            </>
                        ) : (
                            new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)
                        )}
                    </div>
                    {product.isAuction && (
                        <div className="text-[11px] text-secondary font-medium mt-0.5">
                            {product.bidCount || 0} {product.bidCount === 1 ? 'bid' : 'bids'}
                        </div>
                    )}
                    {!product.isAuction && product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-[11px] text-gray-500 line-through">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                        </div>
                    )}

                    <div className="flex flex-col gap-0.5 mt-1">
                        <span className="text-[11px] text-blue-700 font-medium leading-none">
                            {product.shippingFee === 0 ? 'Free shipping' : `+₫${product.shippingFee?.toLocaleString('vi-VN')} shipping`}
                        </span>
                        <span className="text-[10px] text-gray-400">From {product.sellerName || 'ebay_seller'}</span>
                    </div>
                </div>

                <div className="mt-2 overflow-hidden h-0 group-hover:h-8 transition-all opacity-0 group-hover:opacity-100">
                    <Button className="w-full text-[12px] h-8 bg-secondary hover:bg-blue-700 text-white rounded-full font-bold" variant="secondary">
                        {product.isAuction ? 'Bid now' : 'Add to cart'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
