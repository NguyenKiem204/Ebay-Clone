import { Link } from 'react-router-dom';
import { Info, ShieldCheck } from 'lucide-react';

export default function CartSummary({ subtotal, totalItems }) {
    // Mock shipping to match screenshot complexity
    const shipping = 7760848;
    const total = subtotal + shipping;

    return (
        <div className="bg-[#f2f2f2]/40 border border-gray-200 p-8 rounded-[16px] shadow-sm">
            <h2 className="text-[24px] font-bold mb-8 text-gray-900 leading-tight">Order summary</h2>

            <div className="space-y-6 mb-10">
                <div className="flex justify-between text-[15px] text-gray-900">
                    <span>Items ({totalItems})</span>
                    <span>{new Intl.NumberFormat('en-US').format(subtotal)}.00 VND</span>
                </div>
                <div className="flex justify-between text-[15px] text-gray-900">
                    <div className="flex items-center gap-1">
                        <span>Shipping</span>
                        <Info size={16} className="text-gray-400 cursor-pointer" />
                    </div>
                    <span>{new Intl.NumberFormat('en-US').format(shipping)}.00 VND</span>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mb-8 flex justify-between items-center">
                <span className="text-[18px] font-bold text-gray-900">Subtotal</span>
                <span className="text-[18px] font-bold text-gray-900">
                    {new Intl.NumberFormat('en-US').format(total)}.00 VND
                </span>
            </div>

            <Link
                to="/checkout"
                className="block w-full text-center py-3.5 bg-[#3665f3] text-white font-bold rounded-full hover:bg-blue-700 transition text-[16px] shadow-md shadow-blue-500/10 mb-8"
            >
                Go to checkout
            </Link>

            <div className="flex items-start gap-2 pt-2 border-t border-gray-100 mt-4">
                <ShieldCheck size={20} className="text-[#3665f3] flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-gray-600 leading-relaxed">
                    Purchase protected by <Link to="#" className="text-[#3665f3] underline">eBay Money Back Guarantee</Link>
                </p>
            </div>
        </div>
    );
}
