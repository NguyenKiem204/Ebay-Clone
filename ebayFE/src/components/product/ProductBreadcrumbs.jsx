import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';

export default function ProductBreadcrumbs({ product, images }) {
    const [sellerProfile, setSellerProfile] = useState(null);

    useEffect(() => {
        if (product?.sellerId) {
            api.get(`/api/Seller/${product.sellerId}`)
                .then(res => setSellerProfile(res.data.data))
                .catch(() => {});
        }
    }, [product?.sellerId]);

    const sellerName = sellerProfile?.username || product?.sellerName || 'jane_shop';
    const positivePercent = sellerProfile ? `${sellerProfile.positivePercent}% positive` : '100% positive';

    return (
        <>
            {/* Top Navigation Row (Find similar items) */}
            <div className="bg-[#f2f2f2] px-4 py-2 mb-2 flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-[12px]">Find similar items from</span>
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-900 underline hover:no-underline cursor-pointer">{sellerName}</span>
                        <span className="text-gray-500 font-normal">({positivePercent})</span>
                    </div>
                    <div className="flex gap-1 ml-4 items-center">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-8 h-8 bg-white p-0.5">
                                <img src={images[0]} alt="thumb" className="w-full h-full object-contain" />
                            </div>
                        ))}
                        <Link to="#" className="text-blue-600 hover:underline ml-2 font-bold">Shop store on eBay</Link>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-[10px] uppercase font-medium">SPONSORED</span>
                </div>
            </div>

            {/* Top Promo Banner */}
            <div className="flex items-center gap-2 mb-4 text-[12px] uppercase tracking-tight">
                <span className="text-[#dd1e31] font-bold">EXTRA $15 OFF</span>
                <span className="text-gray-900">EACH ITEM WITH CODE</span>
                <span className="font-bold text-gray-900">PRIMERENEWEDMAC</span>
                <Link to="#" className="text-gray-500 underline hover:no-underline ml-1 normal-case font-normal">See all eligible items and terms</Link>
                <span className="text-gray-400 text-[10px]">▶</span>
            </div>
        </>
    );
}
