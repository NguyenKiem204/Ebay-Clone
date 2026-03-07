export default function SellerMarketingPage() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-[1200px] mx-auto">
            {/* Sidebar Controls */}
            <div className="md:col-span-3 space-y-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 text-lg">Promotions</h3>
                    <div className="space-y-4">
                        <button className="text-sm font-bold text-gray-900 block border-l-4 border-secondary -ml-6 pl-5 py-1">Create a promotion</button>
                        <button className="text-sm text-gray-500 hover:text-secondary hover:underline block transition-colors">Promotions manager</button>
                        <button className="text-sm text-gray-500 hover:text-secondary hover:underline block transition-colors">Promoted listings</button>
                        <button className="text-sm text-gray-500 hover:text-secondary hover:underline block transition-colors">Social share</button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-[13px] text-gray-900 mb-6 uppercase tracking-wider uppercase">Active Promotions (3)</h3>
                    <div className="space-y-6">
                        <div>
                            <p className="text-sm font-bold text-secondary">SAVE20JULY</p>
                            <p className="text-[11px] text-gray-400">Ends in 5 days</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-secondary">SUMMER-VIBES</p>
                            <p className="text-[11px] text-gray-400">Ends in 12 days</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-secondary">BOGO-ACCESSORIES</p>
                            <p className="text-[11px] text-gray-400">No end date</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content: Create Coupon */}
            <div className="md:col-span-9 bg-white p-10 rounded-lg border border-gray-200 shadow-sm space-y-12">
                <div className="pb-8 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Create a coupon</h2>
                    <p className="text-sm text-gray-500">Drive more sales by offering discounts with a custom coupon code.</p>
                </div>

                {/* Step 1 */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900">1. Set your coupon details</h3>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">Coupon code name <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="e.g. SAVE10" className="w-full md:w-2/3 border border-gray-300 rounded-md px-4 py-3 outline-none focus:border-secondary transition-all" />
                        <p className="text-[11px] text-gray-400">This is the code your buyers will enter at checkout.</p>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900">2. Discount type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="border-2 border-secondary rounded-lg p-5 flex items-center gap-4 cursor-pointer bg-blue-50/10">
                            <input type="radio" checked className="w-5 h-5 text-secondary focus:ring-secondary/20 transition-all cursor-pointer" />
                            <div>
                                <p className="text-sm font-bold text-gray-900">Percentage off</p>
                                <p className="text-xs text-gray-500">e.g. 20% off</p>
                            </div>
                        </label>
                        <label className="border border-gray-200 rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="radio" className="w-5 h-5 text-secondary focus:ring-secondary/20 transition-all cursor-pointer" />
                            <div>
                                <p className="text-sm font-bold text-gray-900">Fixed amount off</p>
                                <p className="text-xs text-gray-500">e.g. $10 off</p>
                            </div>
                        </label>
                    </div>
                    <div className="relative md:w-1/3">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-800">%</span>
                        <input type="text" defaultValue="0" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md outline-none focus:border-secondary font-bold text-lg" />
                    </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900">3. Minimum purchase</h3>
                    <div className="flex flex-wrap gap-8">
                        {['No minimum', 'Min. quantity', 'Min. amount spend'].map((option, i) => (
                            <label key={option} className="flex items-center gap-3 cursor-pointer group">
                                <input type="radio" name="min-p" checked={i === 0} className="w-5 h-5 text-secondary border-gray-300 cursor-pointer" />
                                <span className={`text-sm transition-colors ${i === 0 ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium group-hover:text-gray-700'}`}>{option}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Step 4 */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900">4. Product selection criteria</h3>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center gap-4 bg-gray-50/30">
                        <div className="text-center">
                            <p className="text-sm font-bold text-gray-800">Select inventory</p>
                            <p className="text-xs text-gray-400">Choose which items this coupon applies to.</p>
                        </div>
                        <button className="px-8 py-2 border-2 border-secondary text-secondary font-bold rounded-full hover:bg-blue-50 transition-colors">Add Items</button>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-secondary" />
                        <span className="text-xs font-bold text-gray-700">Apply to all eligible listings</span>
                    </label>
                </div>

                <div className="pt-12 border-t border-gray-100 flex justify-end gap-6 items-center">
                    <button className="text-secondary font-bold hover:underline text-[15px]">Save as draft</button>
                    <button className="bg-primary text-white font-bold py-3 px-12 rounded-full hover:opacity-90 shadow-lg shadow-red-200 transition-all">Launch Coupon</button>
                </div>
            </div>
        </div>
    );
}
