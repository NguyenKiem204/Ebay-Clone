import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';

export default function SellerOtherItems({ product }) {
    // Mock data for other items from the same store
    const otherItems = [
        {
            id: 'item-1',
            title: 'Apple iPhone 15 128GB Factory Unlocked AT&T T-Mobile Verizon Excellent Condition',
            price: 10589145,
            image: product.thumbnail || 'https://via.placeholder.com/200'
        },
        {
            id: 'item-2',
            title: 'Apple iPhone 14 Plus 128GB Unlocked AT&T T-Mobile Verizon Very Good Condition',
            price: 7915317,
            image: product.thumbnail || 'https://via.placeholder.com/200'
        },
        {
            id: 'item-3',
            title: 'Apple iPhone 15 128GB Factory Unlocked AT&T T-Mobile Verizon Very Good Condition',
            price: 10222149,
            image: product.thumbnail || 'https://via.placeholder.com/200'
        },
        {
            id: 'item-4',
            title: 'Apple iPhone 13 mini 128GB Factory Unlocked AT&T T-Mobile Verizon Very Good',
            price: 6054123,
            image: product.thumbnail || 'https://via.placeholder.com/200'
        },
        {
            id: 'item-5',
            title: 'Apple iPhone 15 Pro 128GB Factory Unlocked AT&T T-Mobile Verizon Condition',
            price: 18461000,
            image: product.thumbnail || 'https://via.placeholder.com/200'
        }
    ];

    return (
        <div className="w-full">
            <div className="max-w-[1280px] mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[18px] font-bold text-gray-900">Seller's items from Pro Store</h2>
                </div>

                <div className="flex gap-4 items-stretch">
                    {/* Promo Card */}
                    <div className="w-[280px] flex-shrink-0 bg-black text-white p-6 rounded-xl flex flex-col justify-between">
                        <div>
                            <h3 className="text-[20px] font-bold leading-tight mb-2">Extra $5 off 2 or more items with code 5OFF2PHONES</h3>
                            <p className="text-[12px] text-gray-400 mb-1">Expires March 31, 2026. Max discount $5.</p>
                            <Link to="#" className="text-[12px] text-white underline hover:no-underline">Terms & Conditions</Link>
                        </div>
                        <Button variant="ghost" className="bg-white text-black hover:bg-gray-200 rounded-full w-fit px-6 h-10 mt-6 font-bold">
                            Shop All
                        </Button>
                    </div>

                    {/* Horizontal Scrollable Items */}
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar flex-1">
                        {otherItems.map((item) => (
                            <Link key={item.id} to={`/product/${item.id}`} className="min-w-[220px] w-[220px] group cursor-pointer bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                                <div className="aspect-square bg-white mb-4 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-[13px] text-gray-800 line-clamp-2 leading-[1.3] group-hover:underline group-hover:text-blue-600">
                                        {item.title}
                                    </h4>
                                    <p className="text-[15px] font-bold text-gray-900">
                                        {item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VND
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
