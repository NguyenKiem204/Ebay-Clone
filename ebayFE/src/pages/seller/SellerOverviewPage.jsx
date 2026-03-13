import { ChevronRight, Plus, Eye, DollarSign, ShoppingBag } from 'lucide-react';
import useStoreStore from '../../store/useStoreStore';
import useAuthStore from '../../store/useAuthStore';
import { Link } from 'react-router-dom';
import { BASE_URL } from '../../lib/axios';

export default function SellerOverviewPage() {
    const { store } = useStoreStore();
    const { user } = useAuthStore();

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${BASE_URL}${cleanUrl}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end -mt-2">
                <span className="text-[12px] text-gray-500 hover:underline cursor-pointer">Opt out of Seller Hub</span>
            </div>

            {/* Top Store Summary Card - Matching Image 1 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                        {store?.logoUrl ? (
                            <img 
                                src={getImageUrl(store.logoUrl)} 
                                alt="Store" 
                                className="w-full h-full object-cover" 
                            />
                        ) : (
                            <ShoppingBag className="text-gray-300" size={32} />
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {user?.role?.toLowerCase() === 'seller' 
                                ? (store?.storeName || user?.username) 
                                : (user?.username || 'Your Store')}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    <div className="text-center group cursor-pointer">
                        <div className="flex items-center gap-2 justify-center font-bold text-gray-900">
                            <Eye size={18} />
                            <span className="text-xl font-bold">0</span>
                        </div>
                        <p className="text-[12px] text-gray-500 flex items-center gap-1">Listing views (90d) <ChevronRight size={12} /></p>
                    </div>
                    <div className="text-center group cursor-pointer">
                        <div className="flex items-center gap-2 justify-center font-bold text-gray-900">
                            <span className="text-lg">$</span>
                            <span className="text-xl font-bold">0.00</span>
                        </div>
                        <p className="text-[12px] text-gray-500 flex items-center gap-1">Sales (90d) <ChevronRight size={12} /></p>
                    </div>
                    <div className="text-center group cursor-pointer">
                        <div className="flex items-center gap-2 justify-center font-bold text-gray-900">
                            <ShoppingBag size={18} />
                            <span className="text-xl font-bold">0</span>
                        </div>
                        <p className="text-[12px] text-gray-500 flex items-center gap-1">Orders (90d) <ChevronRight size={12} /></p>
                    </div>
                    <Link 
                        to="/seller/listings/create" 
                        className="bg-[#3665f3] text-white px-8 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Create listing
                    </Link>
                </div>
            </div>

            {/* Checkup Message */}
            <div className="bg-[#f7f7f7] p-5 rounded-lg border border-gray-200 flex items-start gap-3">
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-[10px]">✓</span>
                </div>
                <div>
                    <p className="font-bold text-sm text-gray-900">You're all caught up!</p>
                    <p className="text-sm text-gray-600 mt-0.5">New tasks, like orders to ship or offers to review, will show up here.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                {/* Keep existing cards but adjusted style */}
                {/* Tasks Card */}
                <div className="lg:col-span-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Tasks</h3>
                        <ChevronRight className="text-gray-400" size={20} />
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center text-gray-500 text-sm">
                            <span>0 unread messages</span>
                            <span>0</span>
                        </div>
                    </div>
                </div>

                {/* Sales Summary Card */}
                <div className="lg:col-span-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg">Sales</h3>
                        <ChevronRight className="text-gray-400" size={20} />
                    </div>
                    <div className="h-[180px] w-full bg-gray-50/50 rounded flex items-center justify-center text-sm text-gray-400 italic">
                        Chart for sales data across 31 days
                    </div>
                    <div className="flex justify-between mt-4 text-[12px] text-gray-400">
                        <span>$0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
