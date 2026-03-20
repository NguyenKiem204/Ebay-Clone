import { Link } from 'react-router-dom';
import { PayPalButtons } from '@paypal/react-paypal-js';
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
        addresses,
        selectedAddressId,
        setSelectedAddressId,
        selectedAddress,
        paymentMethod,
        setPaymentMethod,
        handlePlaceOrder,
        // PayPal specific
        showPayPalConfirm,
        setShowPayPalConfirm,
        paypalReady,
        handlePayPalConfirm,
        handlePayPalCreateOrder,
        handlePayPalApprove,
        handlePayPalCancel,
        handlePayPalError,
        // Coupon specific
        couponCode,
        setCouponCode,
        appliedCoupon,
        discount,
        couponMessage,
        couponLoading,
        handleApplyCoupon,
        handleRemoveCoupon,
    } = useCheckout();

    const total = subtotal - discount;

    const formatVND = (value) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

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
                        address={selectedAddress}
                        addresses={addresses}
                        selectedAddressId={selectedAddressId}
                        setSelectedAddressId={setSelectedAddressId}
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
                        isActive={step >= 3}
                    />
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
                        <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Order Summary</h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Items ({items.length})</span>
                                <span>{formatVND(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Shipping</span>
                                <span className="text-green-600 font-medium">Free</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-600">Discount</span>
                                    <span className="text-green-600 font-medium">-{formatVND(discount)}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200 pt-4 flex justify-between items-end mb-6">
                            <span className="text-lg font-bold">Order Total</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-gray-900">
                                    {formatVND(total)}
                                </span>
                            </div>
                        </div>

                        {/* PayPal Buttons: hiện khi đã tạo order và sẵn sàng thanh toán */}
                        {paypalReady ? (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 text-center">
                                    Order created! Please complete your payment:
                                </p>
                                <PayPalButtons
                                    style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' }}
                                    createOrder={handlePayPalCreateOrder}
                                    onApprove={handlePayPalApprove}
                                    onCancel={handlePayPalCancel}
                                    onError={handlePayPalError}
                                    disabled={isLoading}
                                />
                            </div>
                        ) : (
                            <Button
                                onClick={handlePlaceOrder}
                                disabled={step < 2 || isLoading || !selectedAddressId}
                                size="lg"
                                className={`w-full font-bold text-lg py-4 shadow-md ${step < 2 || isLoading || !selectedAddressId ? 'bg-gray-300 pointer-events-none' : 'shadow-blue-500/20 bg-secondary hover:bg-blue-700'}`}
                            >
                                {isLoading ? 'Processing...' : 'Confirm and pay'}
                            </Button>
                        )}

                        {/* Coupon Section */}
                        <div className="mt-8 pt-6 border-t border-gray-200 text-sm">
                            <label className="block font-bold text-gray-900 mb-2">Gift cards, coupons, eBay Bucks</label>

                            {appliedCoupon ? (
                                /* Coupon đã áp dụng: hiện badge + nút xóa */
                                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        <span className="text-green-700 font-medium">{appliedCoupon.code}</span>
                                        <span className="text-green-600">— {appliedCoupon.description}</span>
                                    </div>
                                    <button
                                        onClick={handleRemoveCoupon}
                                        className="text-gray-400 hover:text-red-500 transition ml-2"
                                        title="Xóa mã giảm giá"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                /* Chưa áp dụng: hiện ô input + nút Apply */
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-secondary focus:border-secondary"
                                        disabled={couponLoading}
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={couponLoading}
                                        className="px-4 py-2 border border-secondary text-secondary font-bold rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {couponLoading ? '...' : 'Apply'}
                                    </button>
                                </div>
                            )}

                            {/* Coupon message (success/error) */}
                            {couponMessage && (
                                <p className={`mt-2 text-xs ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                    {couponMessage.text}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* PayPal Confirmation Modal */}
            {showPayPalConfirm && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Confirm PayPal Payment</h3>
                        </div>

                        <div className="text-sm text-gray-600 space-y-2">
                            <p>By confirming, the system will:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Create your order in the system</li>
                                <li>Remove items from your cart</li>
                                <li>Redirect you to PayPal for payment</li>
                            </ul>
                            <p className="text-yellow-700 font-medium mt-3">
                                ⚠️ If you cancel during PayPal payment, your order will remain unpaid and your cart will be cleared.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowPayPalConfirm(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePayPalConfirm}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                            >
                                Agree & Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
