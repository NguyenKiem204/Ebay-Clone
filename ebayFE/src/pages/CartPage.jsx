import { useCart } from '../features/cart/hooks/useCart';
import CartItem from '../features/cart/components/CartItem';
import CartSummary from '../features/cart/components/CartSummary';
import { mockProducts } from '../lib/mockData';
import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { Link } from 'react-router-dom';

export default function CartPage() {
    const { items, subtotal, totalItems, removeItem, updateQuantity, addItem } = useCart();
    const { isAuthenticated } = useAuthStore();

    // TEMPORARY: Seed cart with mock data if empty for demonstration
    useEffect(() => {
        if (items.length === 0) {
            mockProducts.slice(0, 2).forEach(product => {
                addItem(product, 1);
            });
        }
    }, [addItem, items.length]);

    return (
        <div className="bg-[#f7f7f7] min-h-screen pb-12">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="flex justify-between items-end mb-6">
                    <h1 className="text-[32px] font-bold text-gray-900 leading-none">Cart</h1>
                    <button className="text-[#3665f3] hover:underline text-[13px]">Send Us Your Comments</button>
                </div>

                {!isAuthenticated && (
                    <div className="bg-[#3665f3] text-white p-3 rounded-md mb-6 flex items-center gap-3 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                        <p className="text-[15px]">
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
