import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { useCart } from "../features/cart/hooks/useCart";
import useAuthStore from "../store/useAuthStore";
import CartItem from "../features/cart/components/CartItem";
import CartSummary from "../features/cart/components/CartSummary";

export default function CartPage() {
    const { items, subtotal, totalItems, removeItem, updateQuantity } = useCart();
    const { isAuthenticated } = useAuthStore();

    return (
        <div className="bg-white min-h-screen pb-12">
            <div className="container mx-auto px-4 py-8 max-w-[1248px]">
                <div className="flex justify-between items-baseline mb-6">
                    <h1 className="text-[32px] font-bold text-[#191919]">Cart</h1>
                    <button className="text-[#0654ba] hover:underline text-[13px] font-normal">Send Us Your Comments</button>
                </div>

                {!isAuthenticated && (
                    <div className="bg-[#3665f3] text-white p-3.5 rounded-sm mb-8 flex items-center gap-3 shadow-sm">
                        <div className="bg-white/20 p-1 rounded-full">
                            <Info size={18} className="text-white" />
                        </div>
                        <p className="text-[14px] font-medium">
                            You're signed out right now. To save these items or see your previously saved items, <Link to="/login" className="underline font-bold">sign in</Link>.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 space-y-4">
                        {items.length > 0 ? (
                            items.map((item) => (
                                <CartItem
                                    key={item.id}
                                    item={item}
                                    onRemove={removeItem}
                                    onUpdateQuantity={updateQuantity}
                                />
                            ))
                        ) : (
                            <div className="bg-white rounded-lg border border-gray-200 p-16 text-center shadow-sm">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-14 h-14">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-[22px] font-bold text-gray-900 mb-2">You don't have any items in your cart.</h2>
                                <p className="text-gray-600 mb-8 max-w-sm mx-auto text-[15px]">Have an account? Sign in to see your items.</p>
                                <Link
                                    to="/"
                                    className="inline-block px-10 py-3 bg-[#e53238] text-white font-bold rounded-full hover:bg-[#c02a2f] transition text-[16px]"
                                >
                                    Start shopping
                                </Link>
                            </div>
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="lg:col-span-4 lg:sticky lg:top-24">
                            <CartSummary subtotal={subtotal} totalItems={totalItems} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
