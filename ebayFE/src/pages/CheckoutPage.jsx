import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useCheckout } from '../features/checkout/hooks/useCheckout';
import ShippingAddress from '../features/checkout/components/ShippingAddress';
import PaymentMethod from '../features/checkout/components/PaymentMethod';

export default function CheckoutPage() {
    const {
        items,
        subtotal,
        isLoading,
        error,
        addresses,
        selectedAddressId,
        setSelectedAddressId,
        selectedAddress,
        paymentMethod,
        setPaymentMethod,
        updateQuantity,
        handlePlaceOrder
    } = useCheckout();

    const shippingCost = items.length > 0 ? 145530 : 0;
    const total = subtotal + shippingCost;

    return (
        <div className="bg-[#f7f7f7] min-h-screen pb-12 w-full font-sans">
            {/* Header */}
            <header className="bg-white py-4 px-4 sm:px-8 shadow-sm">
                <div className="max-w-[1280px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-4xl font-bold flex tracking-tighter" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                            <span style={{ color: '#e53238' }}>e</span>
                            <span style={{ color: '#0064d2' }}>b</span>
                            <span style={{ color: '#f5af02' }}>a</span>
                            <span style={{ color: '#86b817' }}>y</span>
                        </Link>
                        {/* Removed "Checkout" text to match mockup */}
                    </div>
                    <div className="hidden sm:block text-sm text-gray-900">
                        How do you like our checkout? <Link to="/" className="text-blue-600 hover:underline">Give us feedback</Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[980px] mx-auto w-full px-4 sm:px-0 pt-8 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (Span 8) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Review Order Section */}
                    <div className="bg-white p-6 border border-gray-200 shadow-sm relative">
                        <h2 className="text-[18px] font-bold text-gray-900 mb-6">Review order</h2>
                        
                        {items.length === 0 ? (
                            <p className="text-gray-500 h-24 flex items-center justify-center">Your order is empty.</p>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className="mb-8 border-b border-gray-200 pb-8 last:border-b-0 last:pb-0 last:mb-0">
                                    <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
                                        <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-700 bg-gray-50 overflow-hidden">
                                            {item.seller ? item.seller[0].toUpperCase() : 'S'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[14px] text-gray-900">{item.seller || 'ebay_seller'}</p>
                                            <p className="text-[12px] text-gray-500">99.9% positive feedback</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-[150px_1fr] gap-6">
                                        <div className="relative">
                                            <div className="w-full aspect-square bg-gray-50 border border-gray-100 p-2">
                                                <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            {item.soldCount > 0 && (
                                                <span className="inline-block self-start border border-blue-600 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 uppercase hover:bg-blue-50">
                                                    {item.soldCount} SOLD
                                                </span>
                                            )}
                                            <h3 className="text-[15px] text-black leading-tight mb-2 hover:underline cursor-pointer">
                                                {item.title}
                                            </h3>
                                            <div className="flex items-baseline gap-2 mb-4">
                                                <span className="font-bold text-[16px] text-gray-900">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                                </span>
                                                <span className="text-sm text-gray-400 line-through">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * 1.5)}
                                                </span>
                                            </div>
                                            
                                            <div className="mb-6 w-32 relative">
                                                <select 
                                                    className="w-full appearance-none bg-white border border-gray-400 hover:border-gray-500 rounded py-2 pl-3 pr-8 text-[13px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                                >
                                                    {[...Array(10).keys()].map(n => (
                                                        <option key={n + 1} value={n + 1}>Quantity: {n + 1}</option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-[14px] text-gray-900 mb-1">Delivery</h4>
                                                <p className="text-[14px] text-gray-900">Est. delivery: <strong>May 4 - May 25</strong></p>
                                                <p className="text-[14px] text-gray-900">eBay International Shipping</p>
                                                <p className="text-[14px] text-gray-900">30 days returns accepted <span className="text-gray-400 border border-gray-300 rounded-full inline-flex items-center justify-center w-4 h-4 text-[10px] ml-1 cursor-pointer">i</span></p>
                                                <p className="font-bold text-[14px] text-gray-900 mt-2">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(145530)}
                                                </p>
                                                <p className="text-[13px] text-gray-500 mt-1">Import fees may apply on delivery</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <ShippingAddress
                        address={selectedAddress}
                        addresses={addresses}
                        selectedAddressId={selectedAddressId}
                        setSelectedAddressId={setSelectedAddressId}
                        isEditing={true} 
                        onEdit={() => {}}
                        onContinue={() => {}}
                    />

                    <PaymentMethod
                        method={paymentMethod}
                        isActive={true}
                        isEditing={true}
                        onEdit={() => {}}
                        onSelect={setPaymentMethod}
                        onContinue={() => {}}
                    />

                </div>

                {/* Right Column (Span 4) */}
                <div className="lg:col-span-4">
                    <div className="bg-white p-6 border border-gray-200 shadow-sm sticky top-6">
                        <h2 className="text-[20px] font-bold mb-6 text-gray-900">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-900 text-[14px]">
                                <span>Item ({items.reduce((sum, i) => sum + i.quantity, 0)})</span>
                                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-900 text-[14px]">
                                <span>Shipping</span>
                                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingCost)}</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-300 pt-4 flex justify-between items-center mb-6">
                            <span className="text-[16px] font-bold text-gray-900">Order total</span>
                            <span className="text-[18px] font-bold text-gray-900">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                            </span>
                        </div>

                        <Button
                            onClick={handlePlaceOrder}
                            disabled={isLoading || !selectedAddressId || items.length === 0}
                            className={`w-full font-bold text-[16px] py-3.5 mb-4 rounded-full ${isLoading || !selectedAddressId || items.length === 0 ? 'bg-gray-300 text-gray-500 pointer-events-none' : 'bg-[#e53238] hover:bg-[#c92025] text-white shadow-md'}`}
                        >
                            {isLoading ? 'Processing...' : 'Confirm and pay'}
                        </Button>
                        
                        {!selectedAddressId && (
                            <p className="text-center text-gray-900 font-bold text-[14px]">
                                Enter shipping address
                            </p>
                        )}

                        <div className="mt-6 flex items-start gap-2 pt-4">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L3 6v6.5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4z" />
                                <path fill="white" d="M10.8 14.8l-3.3-3.3 1.4-1.4 1.9 1.9 4.7-4.7 1.4 1.4-6.1 6.1z" />
                            </svg>
                            <p className="text-[13px] text-gray-800 leading-snug">
                                Purchase protected by <Link to="#" className="font-bold text-blue-600 hover:underline">eBay Money Back Guarantee</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
