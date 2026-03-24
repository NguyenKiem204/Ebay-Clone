import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Heart, Info } from 'lucide-react';
import { useCart } from '../../features/cart/hooks/useCart';
import useCartStore from '../../features/cart/hooks/useCartStore';
import toast from 'react-hot-toast';
import AddToCartModal from './AddToCartModal';
import useAuthStore from '../../store/useAuthStore';
import GuestCheckoutModal from './GuestCheckoutModal';
import { useDebounceButton } from '../../hooks/useDebounceButton';
import useWatchlistStore from '../../features/watchlist/useWatchlistStore';
import SellerFeedbackModal from './SellerSection/SellerFeedbackModal';
import api from '../../lib/axios';

export default function ProductPurchaseOptions({ product }) {
    const [quantity, setQuantity] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
    const [sellerProfile, setSellerProfile] = useState(null);
    const { addItem } = useCart();
    const cartItems = useCartStore(s => s.items);
    const isInCart = cartItems.some(item => item.id === product.id);
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const isWatched = useWatchlistStore(s => s.watchIds.has(product?.id));
    const toggleWatch = useWatchlistStore(s => s.toggleWatch);

    // Fetch seller profile for review count & positive %
    useEffect(() => {
        if (product?.sellerId) {
            api.get(`/api/Seller/${product.sellerId}`)
                .then(res => setSellerProfile(res.data.data))
                .catch(() => {});
        }
    }, [product?.sellerId]);

    const spamOpts = { threshold: 2, windowMs: 600, blockDurationMs: 2000, warningMsg: 'Vui lòng không nhấn quá nhanh!' };

    const { trigger: handleAddToCart, isBlocked: addBlocked } = useDebounceButton(async () => {
        await addItem(product, quantity);
        setIsModalOpen(true);
    }, spamOpts);

    const { trigger: handleBuyItNow, isBlocked: buyBlocked } = useDebounceButton(() => {
        if (isAuthenticated) {
            navigate(`/checkout?buyItNow=1&productId=${product.id}&quantity=${quantity}`);
        } else {
            setIsGuestModalOpen(true);
        }
    }, spamOpts);

    const formatCount = (n) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n?.toLocaleString() || '0';
    };

    return (
        <div className="w-full">
            {/* Modals */}
            <GuestCheckoutModal
                isOpen={isGuestModalOpen}
                onClose={() => setIsGuestModalOpen(false)}
                product={product}
                quantity={quantity}
            />
            <AddToCartModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={product}
                quantity={quantity}
            />
            <SellerFeedbackModal
                isOpen={isSellerModalOpen}
                onClose={() => setIsSellerModalOpen(false)}
                sellerId={product?.sellerId}
                productId={product?.id}
            />

            <div className="mb-6">
                <h1 className="text-[22px] font-bold text-gray-900 leading-[1.2] mb-4">
                    {product.title}
                </h1>

                {/* Seller Card Refined */}
                <div className="flex items-center gap-3 group cursor-pointer border-t border-gray-100 pt-4" onClick={() => setIsSellerModalOpen(true)}>
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                        <img src={sellerProfile?.avatarUrl || "https://i.ebayimg.com/images/g/2i4AAOSwAWZngDgE/s-l64.jpg"} alt="seller" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 hover:underline">{sellerProfile?.username || product.sellerName || 'Unknown'}</span>
                            <span className="text-gray-500 text-[13px]">({sellerProfile ? formatCount(sellerProfile.totalReviews) : '...'})</span>
                        </div>
                        <div className="text-[13px] flex items-center gap-3">
                            <span className="text-gray-900 underline underline-offset-2">{sellerProfile ? `${sellerProfile.positivePercent}% positive` : '...'}</span>
                            <Link to="#" className="text-gray-900 underline underline-offset-2" onClick={e => e.stopPropagation()}>Seller's other items</Link>
                            <Link to="#" className="text-gray-900 underline underline-offset-2" onClick={e => e.stopPropagation()}>Contact seller</Link>
                        </div>
                    </div>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400"><path fill="none" stroke="currentColor" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </div>
            </div>

            {/* Pricing & Buy Actions */}
            <div className="mt-6">
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[24px] font-bold text-gray-900">US ${product.price?.toLocaleString()}</span>
                </div>
                <div className="text-[14px] text-gray-500 flex items-center gap-2 mb-2">
                    <span>Approximately</span>
                    <span className="font-bold text-gray-800">{(product.price * 26231)?.toLocaleString('vi-VN')} VND</span>
                </div>
                <div className="flex items-center gap-2 text-[#248232] text-[15px] mb-4">
                    <span className="font-bold">{(product.price * 26231 - 15).toLocaleString('vi-VN')} ₫</span>
                    <span className="text-gray-500 font-normal">with coupon code</span>
                    <Link to="#" className="text-gray-500 underline text-[13px]">Price details</Link>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-4">
                        <span className="w-20 text-[14px] text-gray-600">Condition:</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[14px] font-bold text-gray-900">Excellent - Refurbished</span>
                            <Info size={16} className="text-gray-400" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="w-20 text-[14px] text-gray-600">Quantity:</span>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="1"
                                max={product.stock > 0 ? product.stock : 1}
                                value={quantity}
                                onChange={(e) => setQuantity(Math.min(product.stock > 0 ? product.stock : 1, Math.max(1, parseInt(e.target.value) || 1)))}
                                className="w-[60px] h-10 border border-gray-300 rounded px-3 text-center"
                            />
                            <span className="text-[14px] text-gray-500">
                                {product.stock > 0 ? (
                                    <>
                                        {product.stock} available {product.soldCount > 0 && <span>&middot; {product.soldCount} sold</span>}
                                    </>
                                ) : (
                                    <span className="text-[#dd1e31] font-bold">Out of stock</span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={handleBuyItNow}
                        disabled={buyBlocked}
                        className="w-full bg-[#3665f3] hover:bg-blue-700 h-[50px] rounded-full font-bold text-[16px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Buy It Now
                    </Button>
                    <Button
                        onClick={isInCart ? () => navigate('/cart') : handleAddToCart}
                        disabled={!isInCart && addBlocked}
                        className="w-full bg-white border border-[#3665f3] text-[#3665f3] hover:bg-blue-50 h-[50px] rounded-full font-bold text-[16px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isInCart ? 'See in cart' : 'Add to cart'}
                    </Button>
                    <Button
                        onClick={() => {
                            if (!isAuthenticated) {
                                navigate(`/login?redirect=/products/${product.id}`);
                                return;
                            }
                            toggleWatch(product.id);
                        }}
                        className={`w-full border h-[50px] rounded-full font-bold text-[16px] flex items-center justify-center gap-2 transition-colors ${
                            isWatched
                                ? 'bg-red-50 border-red-400 text-red-500 hover:bg-red-100'
                                : 'bg-white border-[#3665f3] text-[#3665f3] hover:bg-blue-50'
                        }`}
                    >
                        <Heart size={20} className={isWatched ? 'fill-red-500 text-red-500' : ''} />
                        <span>{isWatched ? 'Watching' : 'Add to Watchlist'}</span>
                    </Button>
                </div>


                {/* Trust Signals */}
                {(product.soldCount > 0 || product.savedCount > 0) && (
                    <div className="mt-6 bg-[#f7f7f7] rounded-lg p-4 flex flex-col gap-3">
                        {product.soldCount > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 flex items-center justify-center mt-0.5 shrink-0">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                                </div>
                                <p className="text-[14px] text-gray-900 leading-tight pt-0.5">
                                    <span className="font-bold">{product.soldCount > 5 ? "This one's trending." : "Good choice."}</span> {product.soldCount} have already sold.
                                </p>
                            </div>
                        )}
                        {product.savedCount > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 flex items-center justify-center mt-0.5 shrink-0">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                                </div>
                                <p className="text-[14px] text-gray-900 leading-tight pt-0.5">
                                    <span className="font-bold">People want this.</span> {product.savedCount} people are watching this.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Summary Details */}
                <div className="mt-8 space-y-4 text-[13px] border-t border-gray-100 pt-6">
                    <div className="flex gap-4">
                        <span className="w-20 text-gray-500">Shipping:</span>
                        <div className="flex-1">
                            <p className="font-bold text-gray-900">US $312.97 (approx 8,204,195.58 VND) <span className="font-normal text-gray-500 italic">eBay International Shipping</span></p>
                            <Link to="#" className="text-gray-900 underline">See details</Link>
                            <p className="text-gray-500 mt-1">Located in: Seattle, WA, United States</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <span className="w-20 text-gray-500">Import fees:</span>
                        <p className="text-gray-900">Import fees may apply on delivery <Info size={14} className="inline ml-1" /></p>
                    </div>
                    <div className="flex gap-4">
                        <span className="w-20 text-gray-500">Delivery:</span>
                        <p className="text-gray-900">Estimated between <span className="font-bold">Mon, Apr 20</span> and <span className="font-bold">Fri, May 15</span></p>
                    </div>
                    <div className="flex gap-4">
                        <span className="w-20 text-gray-500">Returns:</span>
                        <p className="text-gray-900">30 days returns. Buyer pays for return shipping. <Link to="#" className="text-gray-900 underline">See details</Link></p>
                    </div>
                    <div className="flex gap-4">
                        <span className="w-20 text-gray-500 pt-1">Payments:</span>
                        <div className="flex flex-wrap gap-2 items-center">
                            <img src="https://ir.ebaystatic.com/cr/v/c1/pa-p-pp-32px.svg" alt="PayPal" className="h-5" title="PayPal" />
                            <img src="https://ir.ebaystatic.com/cr/v/c1/pa-p-gp-32px.svg" alt="Google Pay" className="h-5" title="Google Pay" />
                            <img src="https://ir.ebaystatic.com/cr/v/c1/pa-p-vi-32px.svg" alt="Visa" className="h-5" title="Visa" />
                            <img src="https://ir.ebaystatic.com/cr/v/c1/pa-p-mc-32px.svg" alt="Mastercard" className="h-5" title="Mastercard" />
                            <img src="https://ir.ebaystatic.com/cr/v/c1/pa-p-ds-32px.svg" alt="Discover" className="h-5" title="Discover" />
                            <img src="https://ir.ebaystatic.com/cr/v/c1/pa-p-dc-32px.svg" alt="Diners Club" className="h-5" title="Diners Club" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
