import { Link } from 'react-router-dom';
import useCurrencyStore from '../../store/useCurrencyStore';
import { resolveMediaUrl } from '../../lib/media';

export default function SimilarItemsList({ relatedProducts = [], productId }) {
    const formatPrice = useCurrencyStore(s => s.formatPrice);
    const displayItems = Array.isArray(relatedProducts)
        ? relatedProducts.filter((item) => item?.id !== productId).slice(0, 3)
        : [];

    if (displayItems.length === 0) {
        return null;
    }

    return (
        <div className="mt-12 border-t border-gray-200 pt-8">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                    <h2 className="text-[20px] font-bold text-gray-900">Similar Items</h2>
                    <span className="text-[11px] font-normal uppercase text-gray-400">Sponsored</span>
                </div>
                <Link to={`/products/related/${productId}`} className="text-[13px] font-bold text-blue-600 hover:underline">
                    See all
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                {displayItems.map((item) => (
                    <Link key={item.id} to={`/products/${item.id}`} className="group cursor-pointer">
                        <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl border border-gray-100 bg-white p-4 transition-all duration-300 group-hover:shadow-lg">
                            <img
                                src={resolveMediaUrl(item.thumbnail)}
                                alt={item.title}
                                className="h-full w-full object-contain transition-transform group-hover:scale-105"
                            />
                        </div>

                        <div className="space-y-1">
                            {item.isAuction ? (
                                <span className="block text-[10px] font-bold uppercase tracking-tight text-[#dd1e31]">
                                    Auction
                                </span>
                            ) : null}
                            <h3 className="line-clamp-2 text-[14px] leading-[1.3] text-gray-800 transition-colors group-hover:text-blue-600">
                                {item.title}
                            </h3>
                            <div className="pt-1">
                                <p className="text-[16px] font-bold text-gray-900">{formatPrice(item.price)}</p>
                                <p className="text-[12px] text-gray-900">
                                    {Number(item.shippingFee || 0) === 0 ? 'Free delivery' : `+ ${formatPrice(item.shippingFee)} delivery`}
                                </p>
                                <p className="text-[12px] text-gray-500">Seller {item.sellerName || 'Marketplace seller'}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
