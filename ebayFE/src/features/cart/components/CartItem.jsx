import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, Info, Check } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import api from '../../../lib/axios';
import useCurrencyStore from '../../../store/useCurrencyStore';

export default function CartItem({ item, onRemove, onUpdateQuantity }) {
    const [sellerProfile, setSellerProfile] = useState(null);
    const stockLeft = Math.max(0, Number(item.stock ?? 0));
    const canIncrease = stockLeft <= 0 ? false : item.quantity < stockLeft;

    useEffect(() => {
        if (item.sellerId) {
            api.get(`/api/Seller/${item.sellerId}`)
                .then(res => setSellerProfile(res.data.data))
                .catch(() => { });
        }
    }, [item.sellerId]);

    // Mocked badges for visual similarity to screenshot
    const badges = {
        1: { text: "IN 1 OTHER CART", variant: "primary" },
        2: { text: "1843 SOLD", variant: "primary" }
    };
    const activeBadge = badges[item.id];

    const { isVietnamese, formatVnd } = useCurrencyStore();

    const sellerName = sellerProfile?.username || item.sellerName || item.seller || 'Unknown';
    const positivePercent = sellerProfile ? `${sellerProfile.positivePercent}%` : (item.feedback || '99.9%');
    const avatarUrl = sellerProfile?.avatarUrl || item.sellerAvatar;

    return (
        <div className="bg-white rounded-[8px] border border-gray-200 shadow-sm mb-6 overflow-hidden">
            {/* Seller Header */}
            <div className="px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-sm bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 p-0.5">
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" 
                            alt="Logo" 
                            className="w-full h-full object-contain opacity-80" 
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 leading-tight">
                            <span className="font-bold text-[15px] text-[#191919] hover:underline cursor-pointer decoration-2">{sellerName}</span>
                            <span className="text-[13px] text-gray-500 font-normal">{positivePercent} positive feedback</span>
                        </div>
                    </div>
                </div>
                <button className="text-[#0654ba] hover:underline text-[13px] font-normal leading-tight">Pay only this seller</button>
            </div>

            {/* Warning Message */}
            <div className="px-6 pb-4 flex items-start gap-2.5">
                <div className="text-[#e53238] animate-pulse">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                </div>
                <p className="text-[13.5px] text-[#191919] leading-snug">
                    To complete your order, go to checkout and update your shipping address or ask the seller if they can ship to your location.
                </p>
            </div>


            {/* Item Content */}
            <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Image Section */}
                <div className="w-full md:w-44 flex-shrink-0">
                    <div className="aspect-square bg-white flex items-center justify-center overflow-hidden">
                        <img
                            src={item.thumbnail || item.imageUrl || (item.images && item.images[0]?.imageUrl) || item.image || 'https://via.placeholder.com/150'}
                            alt={item.title}
                            className={`w-full h-full object-contain ${!item.thumbnail && !item.imageUrl && !(item.images?.[0]?.imageUrl) && !item.image ? 'opacity-20' : ''}`}
                        />
                    </div>
                </div>

                {/* Details Section */}
                <div className="flex-1">
                    <div className="flex flex-col h-full">
                        <div className="mb-4">
                            {stockLeft === 1 && (
                                <div className="bg-white border border-[#e53238] text-[#191919] px-2.5 py-0.5 rounded-full inline-block mb-3">
                                    <span className="text-[11px] font-bold uppercase tracking-wider">LAST ONE</span>
                                </div>
                            )}
                            <Link to={`/products/${item.id}`} className="block font-medium text-[16px] text-[#191919] hover:underline leading-[1.25] mb-1">
                                {item.title}
                            </Link>
                            <p className="text-[13.5px] text-gray-500 mb-3">{item.condition || 'Used'}</p>

                            <div className="mb-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[18px] font-bold text-[#191919]">
                                        US {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}
                                    </span>
                                    {isVietnamese && (
                                        <span className="text-[14px] text-gray-500 font-normal">
                                            ({formatVnd(item.price)})
                                        </span>
                                    )}
                                    {item.originalPrice && (
                                        <span className="text-[13px] text-gray-400 line-through">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.originalPrice)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 mt-4">
                                <div className="flex items-center bg-white border border-gray-300 rounded-[4px] w-fit h-9 overflow-hidden">
                                    <button
                                        onClick={() => item.quantity > 1 ? onUpdateQuantity(item.id, item.quantity - 1) : onRemove(item.id)}
                                        className="px-2.5 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
                                    >
                                        {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                                    </button>
                                    <span className="px-3 text-center text-[15px] font-bold text-[#191919] border-x border-gray-300 h-full flex items-center">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                        disabled={!canIncrease}
                                        className={`px-2.5 h-full flex items-center justify-center transition ${
                                            canIncrease ? 'text-gray-600 hover:bg-gray-50' : 'cursor-not-allowed text-gray-200'
                                        }`}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-7 mt-3">
                                    <button className="text-[13px] text-[#0654ba] hover:underline font-normal">Save for later</button>
                                    <button
                                        onClick={() => onRemove(item.id)}
                                        className="text-[13px] text-[#0654ba] hover:underline font-normal"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Promotion Footer */}
            <div className="bg-gray-50/30 px-6 py-3.5 border-t border-gray-50 flex items-center justify-between group cursor-pointer hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border border-green-600 flex items-center justify-center text-green-600">
                        <Check size={12} strokeWidth={3} />
                    </div>
                    <div className="leading-tight">
                        <span className="text-[14px] font-bold text-[#191919]">Offer applied</span>
                        <p className="text-[13px] text-gray-500">Save up to 50%</p>
                    </div>
                </div>
                <div className="text-gray-400 group-hover:text-gray-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
