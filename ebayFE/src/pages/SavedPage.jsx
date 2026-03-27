import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Loader2 } from 'lucide-react';
import useSavedStore from '../features/saved/useSavedStore';
import useAuthStore from '../store/useAuthStore';

export default function SavedPage() {
    const { isAuthenticated } = useAuthStore();
    const savedItems = useSavedStore(s => s.savedItems);
    const loading = useSavedStore(s => s.loading);
    const toggleSaved = useSavedStore(s => s.toggleSaved);

    if (!isAuthenticated) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-gray-600">
                <Heart size={56} className="text-gray-300" />
                <h2 className="text-xl font-bold text-gray-800">Sign in to see your saved items</h2>
                <Link to="/login?redirect=/saved" className="px-8 py-3 bg-[#3665f3] text-white font-bold rounded-full hover:bg-blue-700 transition">
                    Sign in
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen pb-12">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex items-center gap-3 mb-8">
                    <Heart size={28} className="text-red-500 fill-red-500" />
                    <h1 className="text-[28px] font-bold text-gray-900">Saved items</h1>
                    <span className="text-[16px] text-gray-500 font-normal">({savedItems.length})</span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-[#3665f3]" />
                    </div>
                ) : savedItems.length === 0 ? (
                    <div className="text-center py-20">
                        <Heart size={64} className="mx-auto mb-4 text-gray-200" />
                        <h2 className="text-xl font-bold text-gray-700 mb-2">No saved items yet</h2>
                        <p className="text-gray-500 mb-6">Click the â¤ï¸ icon on any product to save it here.</p>
                        <Link to="/" className="px-8 py-3 bg-[#3665f3] text-white font-bold rounded-full hover:bg-blue-700 transition">
                            Start shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {savedItems.map(item => (
                            <div key={item.productId} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white group">
                                <Link to={`/products/${item.productId}`} className="block relative pt-[80%] bg-gray-50 overflow-hidden">
                                    {item.productImage ? (
                                        <img
                                            src={item.productImage}
                                            alt={item.productName}
                                            className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-200">
                                            <ShoppingCart size={48} />
                                        </div>
                                    )}
                                </Link>
                                <div className="p-4">
                                    <Link to={`/products/${item.productId}`} className="text-[14px] text-gray-900 font-medium line-clamp-2 hover:underline leading-tight mb-2 block">
                                        {item.productName}
                                    </Link>
                                    <div className="text-[18px] font-bold text-gray-900 mb-1">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}
                                    </div>
                                    <div className="text-[12px] text-blue-600">
                                        {item.shippingFee === 0 ? 'Free shipping' : `+${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.shippingFee)} shipping`}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <Link
                                            to={`/products/${item.productId}`}
                                            className="flex-1 text-center py-2 bg-[#3665f3] text-white text-[13px] font-bold rounded-full hover:bg-blue-700 transition"
                                        >
                                            View item
                                        </Link>
                                        <button
                                            onClick={() => toggleSaved(item.productId)}
                                            className="w-9 h-9 flex items-center justify-center border border-red-300 rounded-full text-red-400 hover:bg-red-50 transition"
                                            title="Remove from saved"
                                        >
                                            <Heart size={16} className="fill-red-400 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
