import { Tag, Info, ChevronRight, Check } from 'lucide-react';
import { Badge } from '../ui/Badge';

export default function ProductCouponSection({ coupons }) {
    if (!coupons || coupons.length === 0) return null;

    const mainCoupon = coupons[0];

    return (
        <div className="mt-6 border-2 border-dashed border-secondary/20 rounded-xl p-4 bg-blue-50/10 relative overflow-hidden group hover:border-secondary/40 transition-colors">
            <div className="flex items-start gap-4">
                <div className="bg-secondary text-white p-2.5 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                    <Tag size={20} />
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">Tiết kiệm thêm với mã giảm giá</span>
                        <Badge variant="success" className="text-[10px] uppercase">Gói ưu đãi</Badge>
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-secondary">
                            {mainCoupon.discountType === 'percentage' ? `${mainCoupon.discountValue}% OFF` : `-${mainCoupon.discountValue.toLocaleString()}đ`}
                        </span>
                        <span className="text-xs text-gray-500">Mã: <span className="font-bold text-gray-700">{mainCoupon.code}</span></span>
                    </div>

                    <p className="text-[11px] text-gray-500 mt-1">
                        {mainCoupon.minOrderAmount > 0 
                            ? `Áp dụng cho đơn hàng từ ${mainCoupon.minOrderAmount.toLocaleString()}đ.` 
                            : 'Không giới hạn đơn hàng tối thiểu.'}
                        {' '}Kết thúc sau {new Date(mainCoupon.endDate).toLocaleDateString()}.
                    </p>

                    <div className="mt-3 flex gap-2">
                        <button className="text-[11px] font-bold text-secondary flex items-center gap-1 hover:underline">
                            <Info size={12} /> Điều khoản & Điều kiện
                        </button>
                    </div>
                </div>

                <div className="hidden md:flex flex-col items-end gap-2">
                   <div className="bg-white border border-gray-200 px-3 py-2 rounded-md shadow-sm">
                        <span className="text-[10px] text-gray-400 block uppercase font-bold text-center mb-1">Copy Code</span>
                        <div className="flex items-center gap-2 font-mono font-bold text-gray-800 text-sm">
                            {mainCoupon.code}
                            <div className="p-1 hover:bg-gray-100 rounded cursor-pointer">
                                <Check size={14} className="text-green-500" />
                            </div>
                        </div>
                   </div>
                </div>
            </div>

            {/* Decorative background element */}
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-secondary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
        </div>
    );
}
