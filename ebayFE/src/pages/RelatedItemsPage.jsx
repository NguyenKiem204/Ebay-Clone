import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart } from 'lucide-react';
import useProductStore from '../store/useProductStore';
import useSavedStore from '../features/saved/useSavedStore';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export default function RelatedItemsPage() {
    const { id } = useParams();
    const { relatedProducts, loading, fetchRelatedProducts } = useProductStore();
    const navigate = useNavigate();
    
    // Heart/Save functionality
    const savedIds = useSavedStore(s => s.savedIds);
    const toggleSaved = useSavedStore(s => s.toggleSaved);
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (id) {
            fetchRelatedProducts(id);
        }
    }, [id, fetchRelatedProducts]);

    const handleSaveToggle = (e, productId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            const isVerified = sessionStorage.getItem('verified') === 'true';
            navigate(isVerified
                ? `/login?redirect=/products/related/${id}`
                : `/verify?redirect=/products/related/${id}`);
            return;
        }
        toggleSaved(productId);
    };

    if (loading && relatedProducts.length === 0) {
        return (
            <div className="container mx-auto max-w-[1280px] px-4 py-20 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-[1280px] px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2">
                <div>
                    <h1 className="text-[24px] font-bold text-gray-900 leading-tight">Explore related items</h1>
                    <span className="text-[14px] text-gray-500">Sponsored</span>
                </div>
                <Link to="#" className="text-[13px] text-gray-600 hover:underline">
                    Feedback on our suggestions
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {relatedProducts.map((item) => {
                    const isSaved = savedIds.has(item.id);
                    
                    return (
                        <Link 
                            key={item.id} 
                            to={`/products/${item.id}`} 
                            className="flex flex-col group cursor-pointer bg-white"
                        >
                            <div className="relative aspect-square bg-[#f5f5f5] rounded-xl mb-3 overflow-hidden flex items-center justify-center p-4">
                                <button
                                    onClick={(e) => handleSaveToggle(e, item.id)}
                                    className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 hover:bg-white backdrop-blur rounded-full flex items-center justify-center transition-colors border border-gray-100 shadow-sm"
                                    title={isSaved ? 'Remove from saved' : 'Save'}
                                >
                                    <Heart
                                        size={18}
                                        strokeWidth={1.5}
                                        className={isSaved ? 'text-red-500 fill-red-500' : 'text-gray-900 hover:text-red-500'}
                                    />
                                </button>
                                <img 
                                    src={item.thumbnail || 'https://via.placeholder.com/200'} 
                                    alt={item.title} 
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                                />
                            </div>
                            
                            <div className="flex flex-col flex-grow space-y-1">
                                <h3 className="text-[14px] text-gray-900 leading-[1.3] line-clamp-2 h-[2.6em] group-hover:underline">
                                    {item.title}
                                </h3>
                                
                                <div className="text-[13px] text-gray-600 capitalize mt-1">
                                    {item.condition}
                                </div>
                                
                                <div className="text-[16px] font-bold text-gray-900 mt-1">
                                    {item.price.toLocaleString()} VND
                                </div>
                                
                                {item.discountPrice && item.discountPrice > item.price && (
                                    <div className="text-[13px] text-gray-500 flex items-center gap-1">
                                        <span className="line-through">{item.discountPrice.toLocaleString()} VND</span>
                                        <span className="font-medium text-gray-900">
                                            {Math.round((1 - item.price / item.discountPrice) * 100)}% off
                                        </span>
                                    </div>
                                )}
                                
                                <div className="text-[13px] text-gray-500">
                                    {item.shippingFee === 0 ? 'Free delivery' : `+ ${item.shippingFee.toLocaleString()} VND delivery`}
                                </div>
                                
                                {/* Top Rated Plus Mock Badge - added because screenshot had it */}
                                <div className="flex items-center gap-1 text-[13px] text-blue-700 font-medium mt-1">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                                    </svg>
                                    Top Rated Plus
                                </div>
                                
                                <div className="text-[12px] text-gray-500 mt-auto pt-1">
                                    Seller {item.sellerName}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
