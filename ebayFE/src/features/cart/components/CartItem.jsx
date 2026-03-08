import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, Info } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

export default function CartItem({ item, onRemove, onUpdateQuantity }) {
    // Mocked badges for visual similarity to screenshot
    const badges = {
        1: { text: "IN 1 OTHER CART", variant: "primary" },
        2: { text: "1843 SOLD", variant: "primary" }
    };
    const activeBadge = badges[item.id];

    return (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm mb-4 overflow-hidden">
            {/* Seller Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                        {item.sellerAvatar ? (
                            <img src={item.sellerAvatar} alt={item.seller} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-gray-400 text-xs font-bold">{item.seller?.charAt(0).toUpperCase() || 'S'}</span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-[15px] text-gray-900 leading-tight border-b border-black">{item.seller || 'lite_corp'}</span>
                        </div>
                        <p className="text-[13px] text-gray-500">{item.feedback || '99.6%'} positive feedback</p>
                    </div>
                </div>
                <button className="text-[#3665f3] hover:underline text-[14px] font-medium border-b border-blue-600">Pay only this seller</button>
            </div>

            {/* Item Content */}
            <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Image Section */}
                <div className="w-full md:w-44 flex-shrink-0">
                    <div className="aspect-square bg-white flex items-center justify-center overflow-hidden">
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-contain mix-blend-multiply"
                        />
                    </div>
                </div>

                {/* Details Section */}
                <div className="flex-1">
                    <div className="flex flex-col h-full">
                        <div className="mb-4">
                            {activeBadge && (
                                <Badge variant={activeBadge.variant} className="mb-2">
                                    {activeBadge.text}
                                </Badge>
                            )}
                            <Link to={`/products/${item.id}`} className="block font-medium text-[16px] text-gray-900 hover:text-[#3665f3] hover:underline leading-[1.3] mb-1">
                                {item.title}
                            </Link>
                            <p className="text-[14px] text-gray-600 mb-4">{item.condition || 'Open box'}</p>

                            <div className="mb-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[18px] font-bold text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 text-[13px] text-gray-700">
                                <span className="font-bold">+{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.shippingPrice || 0)} shipping</span>
                            </div>
                            <p className="text-[13px] text-gray-500 mb-1">eBay International Shipping</p>
                        </div>

                        {/* Actions & Quantity */}
                        <div className="mt-auto pt-6 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center bg-white border border-gray-300 rounded-full h-10 overflow-hidden px-1">
                                <button
                                    onClick={() => item.quantity > 1 ? onUpdateQuantity(item.id, item.quantity - 1) : onRemove(item.id)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition"
                                >
                                    {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                                </button>
                                <span className="w-8 text-center text-[15px] font-bold text-gray-900">{item.quantity}</span>
                                <button
                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className="flex items-center gap-6 text-[14px]">
                                <button className="text-gray-900 font-medium hover:underline border-b border-gray-400 leading-none pb-0.5">Buy it now</button>
                                <button className="text-gray-900 font-medium hover:underline border-b border-gray-400 leading-none pb-0.5">Save for later</button>
                                <button
                                    onClick={() => onRemove(item.id)}
                                    className="text-gray-900 font-medium hover:underline border-b border-gray-400 leading-none pb-0.5"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
