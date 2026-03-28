import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/axios';
import ProductCard from '../components/ui/ProductCard';
import { Tag, ChevronLeft, LayoutGrid, Info } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export default function CouponProductsPage() {
    const { id } = useParams();
    const [coupon, setCoupon] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [couponRes, productsRes] = await Promise.all([
                    api.get(`/api/Coupon/${id}`),
                    api.get(`/api/Coupon/${id}/products`)
                ]);
                setCoupon(couponRes.data);
                setProducts(productsRes.data.data);
            } catch (error) {
                console.error('Failed to fetch coupon details', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!coupon) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Coupon not found</h2>
                <Link to="/" className="text-blue-600 hover:underline mt-4 block">Back to home</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-[1280px]">
            {/* Header */}
            <div className="mb-8">
                <Link to="/" className="text-sm font-medium text-gray-500 hover:text-secondary flex items-center gap-1 mb-6 transition-colors group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to shopping
                </Link>
                
                <div className="bg-gradient-to-r from-secondary/5 to-transparent p-8 rounded-2xl border border-secondary/10 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-secondary text-white p-2 rounded-lg shadow-lg">
                                    <Tag size={24} />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                    Extra {coupon.discountType === 'percentage'
                                        ? `${coupon.discountValue}%`
                                        : `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(coupon.discountValue)}`} OFF
                                </h1>
                            </div>
                            <p className="text-gray-600 max-w-2xl font-medium">
                                {coupon.description || `Use code ${coupon.code} to get discounts on the products below.`}
                            </p>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <div className="bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Code:</span>
                                    <span className="font-mono font-bold text-secondary text-lg leading-none">{coupon.code}</span>
                                </div>
                                {coupon.minOrderAmount > 0 && (
                                    <div className="bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
                                        <Info size={14} className="text-gray-400" />
                                        <span className="text-xs font-bold text-gray-700">
                                            Min spend: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(coupon.minOrderAmount)}
                                        </span>
                                    </div>
                                )}
                                <div className="bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
                                    <Badge variant="neutral" className="text-[10px] py-1">Ends {new Date(coupon.endDate).toLocaleDateString()}</Badge>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Eligible across</p>
                            <p className="text-2xl font-bold text-gray-900">{products.length} Items</p>
                        </div>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
                </div>
            </div>

            {/* Product Grid */}
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                        <LayoutGrid size={18} />
                        <span className="text-sm font-bold">Showing all eligible items</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                    {products.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border border-gray-100">
                            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">No items found for this coupon</h3>
                            <p className="text-sm text-gray-500">The associated items might be out of stock or inactive.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
