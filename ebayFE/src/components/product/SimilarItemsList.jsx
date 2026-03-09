import { Link } from 'react-router-dom';

export default function SimilarItemsList({ images }) {
    return (
        <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-baseline gap-2">
                    <h2 className="text-[20px] font-bold text-gray-900">Similar Items</h2>
                    <span className="text-gray-400 text-[11px] font-normal uppercase">SPONSORED</span>
                </div>
                <Link to="#" className="text-blue-600 font-bold hover:underline text-[13px]">See all</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                    { title: 'Apple MacBook Pro 15" 512GB SSD 16GB 4.1Ghz TURBO i7 SEQUOIA - 1 YEAR WARRANTY', price: '12,451,650.00 VND', delivery: 'Free delivery', seller: '46 sold', signal: '51% OFF' },
                    { title: 'MacBook Pro 16” M3 Max 16-Core, 40 Core GPU. 64gb Unified Memory, 2TB Storage', price: '52,165,860.00 VND', delivery: 'Free delivery', seller: 'Popular', signal: '' },
                    { title: 'Apple MacBook Pro 16" 512GB SSD 16GB A2141 4.5Ghz i7 OS Tahoe - 1 Year Warranty', price: '14,129,346.00 VND', delivery: 'Free delivery', seller: '135 sold', signal: 'LAST ONE' },
                ].map((item, idx) => (
                    <div key={idx} className="group cursor-pointer">
                        <div className="aspect-[4/3] bg-white rounded-xl overflow-hidden border border-gray-100 mb-4 relative p-4 group-hover:shadow-lg transition-all duration-300">
                            <img src={images[0]} alt="similar" className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" />
                        </div>
                        <div className="space-y-1">
                            {item.signal && (
                                <span className="text-[#dd1e31] text-[10px] font-bold uppercase tracking-tight block">
                                    {item.signal}
                                </span>
                            )}
                            <h3 className="text-[14px] text-gray-800 line-clamp-2 leading-[1.3] group-hover:text-blue-600 transition-colors">{item.title}</h3>
                            <div className="pt-1">
                                <p className="text-[16px] font-bold text-gray-900">{item.price}</p>
                                <p className="text-[12px] text-gray-900">{item.delivery}</p>
                                <p className="text-[12px] text-gray-500">Seller {item.seller}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
