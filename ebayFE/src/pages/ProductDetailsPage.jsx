import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { mockProducts, mockAuctions } from '../lib/mockData';
import { Button } from '../components/ui/Button';
import Countdown from '../features/auction/components/Countdown';
import { Heart, Share2, Info, MessageCircle, ShoppingBag, Clock } from 'lucide-react';

export default function ProductDetailsPage() {
    const { id } = useParams();

    // Find item in products or auctions
    const baseProduct = mockProducts.find(p => p.id === Number(id));
    const auctionProduct = mockAuctions.find(p => p.id === Number(id));

    const product = auctionProduct || baseProduct || mockProducts[0];
    const isAuction = !!auctionProduct;

    const [activeImage, setActiveImage] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [bidAmount, setBidAmount] = useState('');

    // Fake thumbnails
    const images = [
        product.image,
        'https://images.unsplash.com/photo-1593640495253-23196b27a87f?q=80&w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?q=80&w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1550009158-9effb64fda5e?q=80&w=400&h=400&fit=crop',
    ];

    const handlePlaceBid = () => {
        if (!bidAmount || isNaN(bidAmount)) {
            alert('Please enter a valid bid amount');
            return;
        }
        const amount = parseFloat(bidAmount);
        if (amount <= (product.currentBid || 0)) {
            alert(`Your bid must be higher than the current bid of US $${product.currentBid}`);
            return;
        }
        alert(`Bid of $${amount} placed successfully!`);
        setBidAmount('');
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-[1280px]">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                <Link to="/" className="hover:underline">Home</Link>
                <span className="text-gray-400">&gt;</span>
                <Link to="/products" className="hover:underline">Electronics</Link>
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
                    </div>
                </div>

                {/* Middle Column: Info & Bidding (Span 7 or split further) */}
                <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-11 gap-8">
                    {/* Product Basic Info & Bidding (Middle Left) */}
                    <div className="md:col-span-7">
                        <div className="mb-6">
                            <h1 className="text-xl md:text-2xl font-bold mb-2 leading-[1.2] text-gray-900">
                                {product.title}
                            </h1>
                            <div className="flex items-center gap-4 text-[14px] mt-3">
                                <span className="text-gray-600">
                                    Condition: <span className="font-bold text-gray-900">{product.condition || 'New / Factory Sealed'}</span>
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="text-secondary underline hover:text-blue-700 cursor-pointer">{product.watchers || 0} watchers</span>
                            </div>
                        </div>

                        {isAuction ? (
                            /* Advanced Bidding Box */
                            <div className="bg-[#f7f7f7] rounded-xl p-6 border border-gray-200 mb-8">
                                {/* Time Left Section */}
                                <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm mb-6 text-center">
                                    <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
                                        <Clock size={16} />
                                        TIME LEFT:
                                    </div>
                                    <Countdown endTime={product.endTime} variant="detailed" />
                                </div>

                                {/* Price Section */}
                                <div className="mb-6">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Current bid:</p>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-[28px] font-bold text-gray-900">
                                            US ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(product.currentBid)}
                                        </span>
                                        <span className="text-secondary font-medium tracking-tight text-[15px] cursor-pointer hover:underline">
                                            [ {product.bids} bids ]
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Free shipping from USA</p>
                                </div>

                                {/* Place Bid Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <label className="font-bold text-gray-800">Place your bid</label>
                                        <span className="text-gray-500">Enter US ${(product.currentBid + 25).toFixed(2)} or more</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="relative flex-grow">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-800 font-medium">US $</div>
                                            <input
                                                type="text"
                                                value={bidAmount || (product.currentBid + 25).toFixed(2)}
                                                onChange={(e) => setBidAmount(e.target.value)}
                                                className="w-full pl-14 pr-4 py-[12px] border border-gray-400 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all font-bold text-base"
                                            />
                                        </div>
                                        <Button onClick={handlePlaceBid} size="lg" className="px-6 h-[50px] rounded-full text-base font-bold whitespace-nowrap">
                                            Place bid
                                        </Button>
                                    </div>

                                    {/* Quick Bid Buttons */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setBidAmount((product.currentBid + 10).toFixed(2))}
                                            className="bg-white border border-gray-200 py-2 rounded-full text-gray-800 font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm"
                                        >
                                            + $10
                                        </button>
                                        <button
                                            onClick={() => setBidAmount((product.currentBid + 50).toFixed(2))}
                                            className="bg-white border border-gray-200 py-2 rounded-full text-gray-800 font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm"
                                        >
                                            + $50
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Standard Pricing */
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                                <div className="flex items-baseline gap-3 mb-2">
                                    <span className="text-3xl font-bold text-gray-900">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}
                                    </span>
                                    {product.originalPrice && (
                                        <>
                                            <span className="text-gray-500 line-through text-lg">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.originalPrice)}
                                            </span>
                                            <span className="text-primary font-bold bg-red-50 px-2 py-0.5 rounded text-sm">
                                                {(100 - (product.price / product.originalPrice) * 100).toFixed(0)}% OFF
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
                                </div>
                                <div className="flex flex-col gap-3 mt-8">
                                    <Button size="lg" className="w-full h-12 rounded-full font-bold text-lg">Buy It Now</Button>
                                    <Button size="lg" variant="secondary" className="w-full h-12 rounded-full font-bold text-lg text-white">Add to cart</Button>
                                </div>
                            </div>
                        )}

                        {/* Shipping & Returns Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border border-gray-200 rounded-xl bg-white">
                                <span className="text-[12px] text-gray-500 block mb-1">Shipping:</span>
                                <p className="text-[14px] font-bold text-gray-900">FREE Economy Shipping</p>
                                <p className="text-[12px] text-gray-500">Ships from: California, United States</p>
                            </div>
                            <div className="p-4 border border-gray-200 rounded-xl bg-white">
                                <span className="text-[12px] text-gray-500 block mb-1">Returns:</span>
                                <p className="text-[14px] font-bold text-gray-900">30-day returns</p>
                                <p className="text-[12px] text-green-600 font-medium">Seller pays for return shipping</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar (Md:Col-span-4) */}
                    <div className="md:col-span-4 space-y-4">
                        {/* Recent Bidders Box */}
                        {isAuction && product.recentBids?.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="font-bold text-[14px] text-gray-900">Recent Bidders</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {product.recentBids.map((bid) => (
                                        <div key={bid.id} className="px-4 py-3 flex items-center justify-between text-xs">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-800">{bid.user} ({bid.rating})</span>
                                                <span className="text-gray-400 text-[10px]">{bid.time}</span>
                                            </div>
                                            <span className="font-bold text-gray-900">
                                                US ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(bid.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-4 py-3 flex items-center justify-between mt-1">
                                    <span className="text-[10px] text-gray-500">... (10 more)</span>
                                    <button className="text-secondary text-[12px] font-bold hover:underline">View all</button>
                                </div>
                            </div>
                        )}

                        {/* Seller Information Box */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="font-bold text-[14px] text-gray-900 mb-4">Seller Information</h3>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center font-bold text-lg border border-gray-200">
                                    {(product.seller || 'TD').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-[15px] text-gray-900 leading-tight hover:underline cursor-pointer">{product.seller || 'TechDirect_Official'}</p>
                                    <p className="text-[12px] text-gray-500">{product.sellerFeedback || '99.8%'} positive feedback</p>
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

            {/* Bottom Tabs (Full Width) */}
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
                            {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab === 'reviews' && `(${product.reviews || 120})`}
                        </button>
                    ))}
                </div>

                <div className="p-10">
                    {activeTab === 'description' && (
                        <div className="prose max-w-none text-gray-800">
                            <h3 className="text-xl font-bold mb-6">Product Overview</h3>
                            <p className="mb-6 leading-relaxed">
                                {product.title} is designed for professionals and creators.
                                It features cutting-edge technology and a premium build quality.
                            </p>
                            <ul className="list-disc pl-5 space-y-3 mb-8 text-gray-600">
                                <li>Powerful performance with the latest generation components</li>
                                <li>Stunning display with industry-leading color accuracy</li>
                                <li>Long-lasting battery life for all-day productivity</li>
                                <li>Compact and durable aerospace-grade design</li>
                            </ul>
                        </div>
                    )}
                    {/* Other tabs... */}
                </div>
            </div>
        </div>
    );
}
