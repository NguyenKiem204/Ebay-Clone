import { X, Check, Heart } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useProductStore from '../../store/useProductStore';
import useWatchlistStore from '../../features/watchlist/useWatchlistStore';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../features/cart/hooks/useCartStore';
import useCurrencyStore from '../../store/useCurrencyStore';
import { resolveMediaUrl } from '../../lib/media';

export default function AddToCartModal({ isOpen, onClose, product, quantity }) {
    const navigate = useNavigate();
    const relatedProducts = useProductStore(state => state.relatedProducts);
    const fetchRelatedProducts = useProductStore(state => state.fetchRelatedProducts);
    const watchIds = useWatchlistStore(s => s.watchIds);
    const toggleWatch = useWatchlistStore(s => s.toggleWatch);
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const { isVietnamese, formatVnd } = useCurrencyStore();

    const cartItems = useCartStore(state => state.items);
    const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    useEffect(() => {
        if (isOpen && product?.id) {
            fetchRelatedProducts(product.id);
        }
    }, [fetchRelatedProducts, isOpen, product?.id]);

    if (!isOpen) return null;

    const handleSeeInCart = () => {
        onClose();
        navigate('/cart');
    };

    const handleCheckout = () => {
        onClose();
        if (!isAuthenticated) {
            navigate('/login?redirect=/checkout');
        } else {
            navigate('/checkout');
        }
    };

    const handleToggleWatch = (e, productId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            navigate(`/login?redirect=/products/${product.id}`);
            return;
        }
        toggleWatch(productId);
    };

    const displayItems = relatedProducts && relatedProducts.length > 0
        ? relatedProducts.filter((item) => item?.id !== product?.id).slice(0, 3)
        : [];

    const subtotal = product.price + (product.shippingPrice || 0) - (product.discountAmount || 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-[1020px] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100">
                    <div className="flex items-center gap-2.5 text-gray-900">
                        <div className="w-6.5 h-6.5 bg-[#00a500] rounded-full flex items-center justify-center text-white">
                            <Check size={18} strokeWidth={4} />
                        </div>
                        <h2 className="text-[20px] font-bold text-[#191919]">Added to cart</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={26} className="text-[#191919]" />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    {/* Left Section: Item Info & Actions */}
                    <div className="w-full md:w-[460px] p-6 space-y-5">
                        <div className="flex gap-4">
                            <div className="w-[124px] h-[124px] flex-shrink-0 bg-white border border-gray-100 rounded-[8px] overflow-hidden">
                                <img
                                    src={resolveMediaUrl(product.thumbnail || product.imageUrl)}
                                    alt={product.title}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-[#0654ba] text-[10px] font-bold rounded-sm mb-1.5 border border-blue-100 uppercase tracking-tighter">
                                    IN {product.inCartCount || 34} CARTS
                                </div>
                                <h3 className="text-[14px] font-medium text-[#191919] leading-tight line-clamp-3 mb-1">
                                    {product.title}
                                </h3>
                                <p className="text-[13px] text-gray-500">
                                    {product.color || 'Desert Titanium'}
                                </p>
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between items-center text-[14.5px] text-[#191919]">
                                <span>Item</span>
                                <span>${product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-[14.5px] text-[#191919]">
                                <span>Shipping</span>
                                <span>${(product.shippingPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {product.discountAmount > 0 && (
                                <div className="flex justify-between items-center text-[14.5px] text-[#191919]">
                                    <span>Discounts</span>
                                    <span className="text-[#00a500]">-${product.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-baseline pt-1 border-t border-transparent">
                                <span className="text-[15px] font-bold text-[#191919]">Subtotal</span>
                                <div className="text-right leading-none">
                                    <span className="text-[16px] font-bold text-[#191919]">
                                        ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    {isVietnamese && (
                                        <p className="text-[13px] text-gray-500 mt-1.5 font-normal">
                                            ({formatVnd(subtotal)})
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Offer Success Banner */}
                        <div className="bg-[#f7f7f7] border border-gray-100 rounded-[8px] p-3 flex items-start gap-4">
                            <div className="w-5 h-5 bg-[#00a500] rounded-full flex items-center justify-center text-white mt-0.5">
                                <Check size={14} strokeWidth={4} />
                            </div>
                            <div>
                                <h4 className="text-[14px] font-bold text-[#191919]">You'll get this offer!</h4>
                                <p className="text-[13px] text-gray-700 leading-tight mt-0.5">Extra $15 off each item with coupon</p>
                                <button className="text-[13px] text-gray-900 underline font-bold mt-2">Shop now</button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2.5 pt-2">
                            <button
                                onClick={handleSeeInCart}
                                className="w-full bg-[#3665f3] hover:bg-blue-700 h-10 rounded-full font-bold text-[14px] text-white transition-colors"
                            >
                                See in cart
                            </button>
                            <button
                                onClick={handleCheckout}
                                className="w-full border border-[#3665f3] text-[#3665f3] hover:bg-blue-50 h-10 rounded-full font-bold text-[14px] transition-colors"
                            >
                                Checkout {totalCartItems} items
                            </button>
                        </div>
                    </div>

                    {/* Right Section: Related Items */}
                    <div className="flex-1 p-6 md:p-8 bg-[#fdfdfd]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex flex-col">
                                <h3 className="text-[18px] font-bold text-[#191919] leading-tight tracking-tight">Explore related items</h3>
                                <span className="text-[12px] text-gray-400 mt-0.5">Sponsored</span>
                            </div>
                            <Link to={`/products/related/${product?.id}`} className="text-[13px] text-[#191919] underline font-bold" onClick={onClose}>See all</Link>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {displayItems.map((item) => (
                                <Link
                                    key={item.id}
                                    to={`/products/${item.id}`}
                                    className="flex flex-col group"
                                    onClick={onClose}
                                >
                                    <div className="relative aspect-[12/12.5] bg-[#f7f7f7] rounded-[12px] overflow-hidden p-0 group-hover:shadow-md transition-shadow">
                                        <img
                                            src={resolveMediaUrl(item.thumbnail)}
                                            alt={item.title}
                                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                                        />
                                        <button
                                            className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full shadow-sm flex items-center justify-center border border-gray-100 hover:bg-white transition-colors"
                                            onClick={(e) => handleToggleWatch(e, item.id)}
                                        >
                                            <Heart size={18} className={watchIds.has(item.id) ? 'fill-[#e53238] text-[#e53238]' : 'text-[#191919]'} />
                                        </button>
                                    </div>
                                    <div className="mt-3 flex flex-col min-w-0">
                                        <h4 className="text-[13px] text-[#191919] leading-[1.25] h-[50px] line-clamp-3 group-hover:underline font-normal">
                                            {item.title}
                                        </h4>
                                        <p className="text-[13px] text-gray-500 mt-1">{item.condition || 'Brand New'}</p>
                                        <p className="text-[15px] font-bold text-[#191919] mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                            {isVietnamese ? formatVnd(item.price) : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}
                                            {isVietnamese && <span className="text-gray-900 text-[13px] ml-1"></span>}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
