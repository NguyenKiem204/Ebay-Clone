import { useState } from 'react';

export default function CouponSection({
    isAuthenticated,
    couponCode,
    onCouponCodeChange,
    appliedCoupon,
    couponError,
    isApplyingCoupon,
    onApplyCoupon,
    onRemoveCoupon
}) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-white border border-gray-200 shadow-sm">
            <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
            >
                <span className="text-[18px] font-bold text-gray-700">Add coupons</span>
                <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {isExpanded && (
                <div className="border-t border-gray-100 px-6 py-5">
                    {isAuthenticated ? (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
                                    placeholder="Enter coupon code"
                                    className="flex-1 rounded-md border border-gray-300 px-4 py-3 text-sm uppercase tracking-[0.18em] outline-none focus:border-blue-500"
                                />
                                {appliedCoupon ? (
                                    <button
                                        type="button"
                                        onClick={onRemoveCoupon}
                                        className="rounded-full border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
                                    >
                                        Remove
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={onApplyCoupon}
                                        disabled={isApplyingCoupon}
                                        className="rounded-full bg-[#3665f3] px-5 py-3 text-sm font-bold text-white hover:bg-[#274bcc] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isApplyingCoupon ? 'Applying...' : 'Apply'}
                                    </button>
                                )}
                            </div>

                            {appliedCoupon && (
                                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm">
                                    <p className="font-bold text-green-800">
                                        Coupon {appliedCoupon.code} applied
                                    </p>
                                    {appliedCoupon.description && (
                                        <p className="mt-1 text-green-700">{appliedCoupon.description}</p>
                                    )}
                                </div>
                            )}

                            {!appliedCoupon && couponError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {couponError}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                            Sign in to apply coupons during checkout.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
