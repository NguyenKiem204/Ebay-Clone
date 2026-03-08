import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import Countdown from '../features/auction/components/Countdown';
import { Heart, Share2, Info, MessageCircle, ShoppingBag, Clock } from 'lucide-react';
import useProductStore from '../store/useProductStore';
import useAuctionStore from '../store/useAuctionStore';
import useAuthStore from '../store/useAuthStore';

export default function ProductDetailsPage() {
    const { id } = useParams();
    const { currentProduct: product, loading, error, fetchProductById } = useProductStore();

    const [activeImage, setActiveImage] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [bidAmount, setBidAmount] = useState('');

    const { placeBid, error: bidError, isLoading: isBidding } = useAuctionStore();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (id) {
            fetchProductById(id);
        }
    }, [id, fetchProductById]);

    // Polling for auction updates
    useEffect(() => {
        let interval;
        if (product?.isAuction && !loading) {
            interval = setInterval(() => {
                fetchProductById(id);
            }, 10000); // 10 seconds
        }
        return () => clearInterval(interval);
    }, [id, product?.isAuction, loading, fetchProductById]);

    if (loading && !product) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Product not found</h2>
                <Link to="/products" className="text-blue-600 hover:underline mt-4 block">Back to products</Link>
            </div>
        );
    }

    const isAuction = product.isAuction;
    const images = product.images && product.images.length > 0
        ? product.images.map(img => img.imageUrl)
        : [product.thumbnail || product.imageUrl];

    const handlePlaceBid = async () => {
        if (!isAuthenticated) {
            alert('Please login to place a bid');
            return;
        }

        if (!bidAmount || isNaN(bidAmount)) {
            alert('Please enter a valid bid amount');
            return;
        }
        const amount = parseFloat(bidAmount);
        const minBid = (product.currentBid || product.price || 0) + 10000; // Minimal increment 10k VND

        if (amount < minBid) {
            alert(`Your bid must be at least ₫${minBid.toLocaleString('vi-VN')}`);
            return;
        }

        const result = await placeBid(product.id, amount);
        if (result.success) {
            alert(`Bid of ₫${amount.toLocaleString('vi-VN')} placed successfully!`);
            setBidAmount('');
            fetchProductById(id); // Final refresh
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-[1280px]">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                <Link to="/" className="hover:underline">Home</Link>
                <span className="text-gray-400">&gt;</span>
                <Link to={`/products?category=${product.categorySlug}`} className="hover:underline">{product.categoryName || 'Category'}</Link>
                <span className="text-gray-400">&gt;</span>
                <span className="text-gray-900 font-medium line-clamp-1">{product.title}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Image Gallery (Span 5) */}
                <div className="lg:col-span-5">
                    <div className="sticky top-24">
                        <div className="relative aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 mb-4 flex items-center justify-center cursor-zoom-in">
                            <img
                                src={images[activeImage]}
                                alt={product.title}
                                className="w-[90%] h-[90%] object-contain mix-blend-multiply"
                            />
                        </div>

                        {images.length > 1 && (
                            <div className="grid grid-cols-5 gap-2">
                                {images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`aspect-square rounded-md overflow-hidden p-1 cursor-pointer border-2 transition-colors ${activeImage === idx ? 'border-secondary' : 'border-transparent hover:border-gray-200'}`}
                                    >
                                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover rounded" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle Column: Info & Bidding (Span 7) */}
                <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-11 gap-8">
                    {/* Product Basic Info & Bidding (Middle Left) */}
                    <div className="md:col-span-7">
                        <div className="mb-6">
                            <h1 className="text-xl md:text-2xl font-bold mb-2 leading-[1.2] text-gray-900">
                                {product.title}
                            </h1>
                            <div className="flex items-center gap-4 text-[14px] mt-3">
                                <span className="text-gray-600">
                                    Condition: <span className="font-bold text-gray-900">{product.condition || 'New'}</span>
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="text-secondary underline hover:text-blue-700 cursor-pointer">
                                    {product.reviewCount || 0} reviews
                                </span>
                            </div>
                        </div>

                        {isAuction ? (
                            /* Auction Box */
                            <div className="bg-[#f7f7f7] rounded-xl p-6 border border-gray-200 mb-8">
                                <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm mb-6 text-center">
                                    <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
                                        <Clock size={16} />
                                        TIME LEFT:
                                    </div>
                                    <Countdown endTime={product.auctionEndTime} variant="detailed" />
                                </div>

                                <div className="mb-6">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Current bid:</p>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-[28px] font-bold text-gray-900">
                                            ₫{(product.currentBid || product.price)?.toLocaleString('vi-VN')}
                                        </span>
                                        <span className="text-secondary font-medium tracking-tight text-[15px] cursor-pointer hover:underline">
                                            [ {product.bidCount || 0} {product.bidCount === 1 ? 'bid' : 'bids'} ]
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {product.shippingFee === 0 ? 'Free shipping' : `+₫${product.shippingFee?.toLocaleString('vi-VN')} shipping`}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <label className="font-bold text-gray-800">Place your bid</label>
                                        <span className="text-gray-500">
                                            Enter ₫{((product.currentBid || product.price || 0) + 10000).toLocaleString('vi-VN')} or more
                                        </span>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="relative flex-grow">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-800 font-medium">₫</div>
                                            <input
                                                type="text"
                                                value={bidAmount}
                                                placeholder={((product.currentBid || product.price || 0) + 10000).toString()}
                                                onChange={(e) => setBidAmount(e.target.value)}
                                                className="w-full pl-10 pr-4 py-[12px] border border-gray-400 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all font-bold text-base"
                                            />
                                        </div>
                                        <Button
                                            onClick={handlePlaceBid}
                                            disabled={isBidding}
                                            size="lg"
                                            className="px-6 h-[50px] rounded-full text-base font-bold whitespace-nowrap"
                                        >
                                            {isBidding ? 'Placing...' : 'Place bid'}
                                        </Button>
                                    </div>
                                    {bidError && <p className="text-red-600 text-xs font-medium">{bidError}</p>}
                                </div>
                            </div>
                        ) : (
                            /* Standard Pricing */
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                                <div className="flex items-baseline gap-3 mb-2">
                                    <span className="text-3xl font-bold text-gray-900">
                                        ₫{product.price?.toLocaleString('vi-VN')}
                                    </span>
                                    {product.originalPrice && product.originalPrice > product.price && (
                                        <>
                                            <span className="text-gray-500 line-through text-lg">
                                                ₫{product.originalPrice.toLocaleString('vi-VN')}
                                            </span>
                                            <span className="text-primary font-bold bg-red-50 px-2 py-0.5 rounded text-sm">
                                                {((1 - product.price / product.originalPrice) * 100).toFixed(0)}% OFF
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-6 font-medium">
                                    <span>Quantity:</span>
                                    <div className="flex items-center border border-gray-300 rounded overflow-hidden w-28 bg-white h-10">
                                        <button className="px-4 py-1 hover:bg-gray-100 transition-colors text-xl font-medium">-</button>
                                        <input type="text" value="1" className="w-full text-center border-none focus:ring-0 text-[15px] font-bold" readOnly />
                                        <button className="px-4 py-1 hover:bg-gray-100 transition-colors text-xl font-medium">+</button>
                                    </div>
                                    <span className="text-xs text-gray-500 ml-2">{product.stockQuantity || 0} available</span>
                                </div>
                                <div className="flex flex-col gap-3 mt-8">
                                    <Button size="lg" className="w-full h-12 rounded-full font-bold text-lg bg-secondary hover:bg-blue-700 text-white border-none">Buy It Now</Button>
                                    <Button size="lg" variant="outline" className="w-full h-12 rounded-full font-bold text-lg border-secondary text-secondary hover:bg-blue-50">Add to cart</Button>
                                </div>
                            </div>
                        )}

                        {/* Shipping & Returns Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border border-gray-200 rounded-xl bg-white">
                                <span className="text-[12px] text-gray-500 block mb-1">Shipping:</span>
                                <p className="text-[14px] font-bold text-gray-900">
                                    {product.shippingFee === 0 ? 'FREE Shipping' : `₫${product.shippingFee?.toLocaleString('vi-VN')} Shipping`}
                                </p>
                                <p className="text-[12px] text-gray-500">Ships from: {product.shipsFrom || 'Vietnam'}</p>
                            </div>
                            <div className="p-4 border border-gray-200 rounded-xl bg-white">
                                <span className="text-[12px] text-gray-500 block mb-1">Returns:</span>
                                <p className="text-[14px] font-bold text-gray-900">30-day returns</p>
                                <p className="text-[12px] text-green-600 font-medium">Seller pays for return shipping</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="md:col-span-4 space-y-4">
                        {/* Seller Information Box */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="font-bold text-[14px] text-gray-900 mb-4">Seller Information</h3>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center font-bold text-lg border border-gray-200">
                                    {(product.sellerName || 'EB').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-[15px] text-gray-900 leading-tight hover:underline cursor-pointer truncate">
                                        {product.sellerName || 'ebay_seller'}
                                    </p>
                                    <p className="text-[12px] text-gray-500">99.8% positive feedback</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <button className="w-full border border-secondary text-secondary font-bold py-2 rounded-full text-sm hover:bg-blue-50 transition-colors">
                                    Contact seller
                                </button>
                                <button className="w-full border border-gray-200 text-gray-800 font-bold py-2 rounded-full text-sm hover:bg-gray-50 transition-colors">
                                    See other items
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <button className="w-full py-3 bg-white border border-gray-200 rounded-full flex items-center justify-center gap-2 font-bold text-[15px] text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
                                <Heart size={20} className="text-gray-900" />
                                Add to Watchlist
                            </button>
                            <button className="w-full py-3 bg-white border border-gray-200 rounded-full flex items-center justify-center gap-2 font-bold text-[15px] text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
                                <Share2 size={20} className="text-gray-900" />
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Tabs */}
            <div className="mt-16 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex border-b border-gray-200 overflow-x-auto scbar-none">
                    {['description', 'specifications', 'shipping', 'reviews'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-10 py-5 whitespace-nowrap text-[15px] font-bold transition-colors ${activeTab === tab
                                ? 'border-b-4 border-secondary text-secondary bg-blue-50/30'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab === 'reviews' && `(${product.reviewCount || 0})`}
                        </button>
                    ))}
                </div>

                <div className="p-10">
                    {activeTab === 'description' && (
                        <div className="prose max-w-none text-gray-800">
                            <h3 className="text-xl font-bold mb-6">Product Description</h3>
                            <div
                                className="leading-relaxed whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: product.description || 'No description provided.' }}
                            />
                        </div>
                    )}
                    {activeTab === 'specifications' && (
                        <div className="max-w-4xl">
                            <h3 className="text-xl font-bold mb-6">Item specifics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                                <div className="flex border-b border-gray-100 py-2">
                                    <span className="w-1/3 text-gray-500 text-sm">Condition:</span>
                                    <span className="w-2/3 text-sm font-medium">{product.condition || 'New'}</span>
                                </div>
                                <div className="flex border-b border-gray-100 py-2">
                                    <span className="w-1/3 text-gray-500 text-sm">Brand:</span>
                                    <span className="w-2/3 text-sm font-medium">{product.brand || 'Unbranded'}</span>
                                </div>
                                <div className="flex border-b border-gray-100 py-2">
                                    <span className="w-1/3 text-gray-500 text-sm">Category:</span>
                                    <span className="w-2/3 text-sm font-medium">{product.categoryName}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
