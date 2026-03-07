import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useCheckout } from '../features/checkout/hooks/useCheckout';
import ShippingAddress from '../features/checkout/components/ShippingAddress';
import PaymentMethod from '../features/checkout/components/PaymentMethod';
import CheckoutReview from '../features/checkout/components/CheckoutReview';

export default function CheckoutPage() {
    const {
        step,
        setStep,
        items,
        subtotal,
        isLoading,
        error,
        shippingAddress,
        paymentMethod,
        setPaymentMethod,
        handlePlaceOrder
    } = useCheckout();

    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            {/* Checkout Minimal Header */}
            <header className="bg-white border-b border-gray-200 py-4 px-4 sm:px-8 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-3xl font-bold flex tracking-tighter cursor-pointer">
                            <span className="text-primary">e</span>
                            <span className="text-secondary">b</span>
                            <span className="text-yellow-500">a</span>
                            <span className="text-green-600">y</span>
                        </Link>
                        <h1 className="text-2xl font-normal text-gray-900 hidden md:block">Checkout</h1>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        <span>Secure Checkout</span>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 pt-8 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <ShippingAddress
                        address={shippingAddress}
                        isEditing={step === 1}
                        onEdit={() => setStep(1)}
                        onContinue={() => setStep(2)}
                    />

                    <PaymentMethod
                        method={paymentMethod}
                        isActive={step >= 2}
                        isEditing={step === 2}
                        onEdit={() => setStep(2)}
                        onSelect={setPaymentMethod}
                        onContinue={() => setStep(3)}
                    />

                    <CheckoutReview
                        items={items}
                        isActive={step === 3}
                    />
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
                        <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Order Summary</h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Items ({items.length})</span>
                                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Shipping</span>
                                <span className="text-green-600">Free</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Estimated Tax</span>
                                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tax)}</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 flex justify-between items-end mb-6">
                            <span className="text-lg font-bold">Order Total</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-gray-900">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)}
                                </span>
                            </div>
                        </div>

                        <Button
                            onClick={handlePlaceOrder}
                            disabled={step !== 3 || isLoading}
                            size="lg"
                            className={`w-full font-bold text-lg py-4 shadow-md ${step !== 3 || isLoading ? 'bg-gray-300 pointer-events-none' : 'shadow-blue-500/20 bg-secondary hover:bg-blue-700'}`}
                        >
                            {isLoading ? 'Processing...' : 'Confirm and pay'}
                        </Button>

                        <div className="mt-8 pt-6 border-t border-gray-200 text-sm">
                            <label className="block font-bold text-gray-900 mb-2">Gift cards, coupons, eBay Bucks</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Enter code" className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-secondary focus:border-secondary" />
                                <button className="px-4 py-2 border border-secondary text-secondary font-bold rounded-md hover:bg-blue-50">Apply</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
