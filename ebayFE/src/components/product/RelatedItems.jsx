import { Link } from 'react-router-dom';

export default function RelatedItems({ relatedProducts }) {
    return (
        <div className="mt-12 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[20px] font-bold text-gray-900">Explore related items</h2>
                <Link to="#" className="text-blue-600 hover:underline font-bold text-[14px]">See all</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                {relatedProducts.length > 0 ? (
                    relatedProducts.map((item) => (
                        <Link key={item.id} to={`/product/${item.id}`} className="min-w-[200px] w-[200px] group cursor-pointer">
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
    );
}
