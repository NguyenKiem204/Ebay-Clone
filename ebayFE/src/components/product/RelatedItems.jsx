import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function RelatedItems({ relatedProducts, productId }) {
    const scrollRef = useRef(null);

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir * 220, behavior: 'smooth' });
        }
    };

    return (
        <div className="mt-12 mb-8 relative group">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[20px] font-bold text-gray-900">Explore related items</h2>
                <Link to={`/products/related/${productId}`} className="text-blue-600 hover:underline font-bold text-[14px]">See all</Link>
            </div>
            {/* Scrollable Container with custom scrollbar padding */}
            <div className="relative group/carousel">
                <button
                    onClick={() => scroll(-1)}
                    className="absolute left-0 top-[40%] -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center text-gray-800 hover:scale-105 transition-transform opacity-0 group-hover/carousel:opacity-100"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={() => scroll(1)}
                    className="absolute right-0 top-[40%] -translate-y-1/2 translate-x-3 z-10 w-10 h-10 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center text-gray-800 hover:scale-105 transition-transform opacity-0 group-hover/carousel:opacity-100"
                >
                    <ChevronRight size={24} />
                </button>
                <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
                {relatedProducts.length > 0 ? (
                    relatedProducts.map((item) => (
                        <Link key={item.id} to={`/products/${item.id}`} className="min-w-[200px] w-[200px] group cursor-pointer">
                            <div className="aspect-square bg-[#f5f5f5] rounded-lg mb-2 overflow-hidden flex items-center justify-center p-4">
                                <img src={item.thumbnail || 'https://via.placeholder.com/200'} alt={item.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-[13px] leading-tight text-gray-800 line-clamp-2 group-hover:underline group-hover:text-blue-600">{item.title}</h3>
                                <div className="text-[12px] text-gray-500 capitalize">{item.condition}</div>
                                <div className="text-[16px] font-bold text-gray-900">{item.price.toLocaleString()} VND</div>
                                {item.discountPrice && item.discountPrice > item.price && (
                                    <div className="text-[12px] text-gray-500">
                                        <span className="line-through">{item.discountPrice.toLocaleString()} VND</span>
                                        <span className="ml-1 font-bold text-gray-900 text-[#dd1e31]">
                                            {Math.round((1 - item.price / item.discountPrice) * 100)}% off
                                        </span>
                                    </div>
                                )}
                                <div className="text-[12px] text-gray-500">
                                    {item.shippingFee === 0 ? 'Free delivery' : `+ ${item.shippingFee.toLocaleString()} VND delivery`}
                                </div>
                                <div className="text-[11px] text-gray-400">Seller {item.sellerName}</div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="h-40 flex items-center justify-center w-full text-gray-400">
                        No related items found
                    </div>
                )}
            </div>
        </div>
        </div>
    );
}
