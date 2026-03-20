import { X, Check, ChevronRight, Info, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import useProductStore from '../../store/useProductStore';
import useWatchlistStore from '../../features/watchlist/useWatchlistStore';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../features/cart/hooks/useCartStore';

export default function AddToCartModal({ isOpen, onClose, product, quantity }) {
    const navigate = useNavigate();
    const relatedProducts = useProductStore(state => state.relatedProducts);
    const watchIds = useWatchlistStore(s => s.watchIds);
    const toggleWatch = useWatchlistStore(s => s.toggleWatch);
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    
    const cartItems = useCartStore(state => state.items);
    const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    if (!isOpen) return null;

    // Handle closing and navigating
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

    // Retrieve up to 3 real related items from the store
    const displayItems = relatedProducts && relatedProducts.length > 0 ? relatedProducts.slice(0, 3) : [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1000px] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-900">
                        <div className="w-6 h-6 bg-[#00a500] rounded-full flex items-center justify-center">
                            <Check size={16} strokeWidth={4} className="text-white" />
                        </div>
                        <h2 className="text-[20px] font-bold">Added to cart</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    {/* Left Section: Item Info & Actions */}
                    <div className="flex-1 p-6 space-y-6 md:p-8">
                        <div className="flex gap-4">
                            <div className="w-24 h-24 flex-shrink-0 bg-white border border-gray-100 rounded-lg overflow-hidden">
                                <img
                                    src={product.thumbnail || product.imageUrl}
                                    alt={product.title}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded mb-1 border border-blue-100 uppercase">
                                    IN {product.inCartCount || 0} CARTS
                                </div>
                                <h3 className="text-[14px] text-gray-900 leading-tight line-clamp-2 hover:underline cursor-pointer">
                                    {product.title}
                                </h3>
                                <p className="text-[13px] text-gray-500 mt-1">
                                    {product.color || 'Desert Titanium'}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-baseline pt-2">
                            <span className="text-[14px] text-gray-600">Item</span>
                            <span className="text-[18px] font-bold text-gray-900">
                                ${product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Main CTAs */}
                        <div className="space-y-3 pt-4">
                            <Button
                                onClick={handleSeeInCart}
                                className="w-full bg-[#3665f3] hover:bg-blue-700 h-11 rounded-full font-bold text-[15px]"
                            >
                                See in cart
                            </Button>
                            <Button
                                onClick={handleCheckout}
                                variant="outline"
                                className="w-full border-[#3665f3] text-[#3665f3] hover:bg-blue-50 h-11 rounded-full font-bold text-[15px]"
                            >
                                Checkout {totalCartItems} item{totalCartItems !== 1 ? 's' : ''}
                            </Button>
                        </div>
                    </div>

                    {/* Right Section: Related Items (Horizontal Layout) */}
                    <div className="flex-1 p-6 bg-gray-50/50">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex flex-col">
                                <h3 className="text-[18px] font-bold text-gray-900 leading-tight">Explore related items</h3>
                                <span className="text-[12px] text-gray-500">Sponsored</span>
                            </div>
                            <Link to={`/products/related/${product?.id}`} className="text-[14px] text-gray-900 underline font-medium" onClick={onClose}>See all</Link>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {displayItems.map((item) => (
                                <Link
                                    key={item.id}
                                    to={`/products/${item.slug || item.id}`}
                                    className="flex flex-col group"
                                    onClick={onClose}
                                >
                                    <div className="relative aspect-square bg-white border border-gray-200 rounded-lg overflow-hidden p-2 group-hover:shadow-sm transition-shadow">
                                        <img
                                            src={item.thumbnail}
                                            alt={item.title}
                                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                        />
                                        <button className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center border border-gray-100 hover:bg-white transition-colors" onClick={(e) => handleToggleWatch(e, item.id)}>
                                            <Heart size={18} className={watchIds.has(item.id) ? 'fill-[#e53238] text-[#e53238]' : 'text-gray-900'} />
                                        </button>
                                    </div>
                                    <div className="mt-3 flex flex-col min-w-0">
                                        <h4 className="text-[13px] text-gray-900 leading-[1.3] line-clamp-3 group-hover:underline font-normal h-[51px]">
                                            {item.title}
                                        </h4>
                                        <p className="text-[13px] text-gray-500 mt-1">{item.condition || 'Pre-owned'}</p>
                                        <p className="text-[16px] font-bold text-gray-900 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                            {(item.price * 26231).toLocaleString('vi-VN')}
                                        </p>
                                        <span className="text-[11px] font-bold text-gray-900">VND</span>
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
