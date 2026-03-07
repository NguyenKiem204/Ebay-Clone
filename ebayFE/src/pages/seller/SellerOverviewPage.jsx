export default function SellerOverviewPage() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
                <div className="text-sm text-gray-500">Last updated: Today, 8:45 AM</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                {/* Tasks Card */}
                <div className="lg:col-span-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-6">Tasks</h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-secondary hover:underline cursor-pointer">2 items to ship</span>
                            <span className="bg-secondary text-white text-xs font-bold px-2 py-0.5 rounded-full">2</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-500">
                            <span>0 unread messages</span>
                            <span>0</span>
                        </div>
                    </div>
                </div>

                {/* Sales Summary Card */}
                <div className="lg:col-span-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-2">Sales Summary (Last 31 Days)</h3>
                    <div className="flex items-baseline gap-4 mb-8">
                        <span className="text-[36px] font-bold text-gray-900">$4,821.50</span>
                        <span className="text-green-600 font-bold flex items-center gap-1">
                            <span className="text-lg">↗</span> 12.4% vs prev. 31 days
                        </span>
                    </div>
                    {/* Placeholder for Chart */}
                    <div className="h-[200px] w-full bg-blue-50/30 rounded flex items-end justify-between px-4 pb-4">
                        {[40, 60, 80, 50, 90, 100, 110, 80].map((h, idx) => (
                            <div key={idx} className="w-[10%] bg-blue-500 rounded-t" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                </div>

                {/* Active Listings Card */}
                <div className="lg:col-span-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Active Listings</h3>
                        <span className="text-secondary text-sm hover:underline cursor-pointer">Manage</span>
                    </div>
                    <div className="text-[48px] font-bold text-gray-900 leading-tight mb-8">124</div>
                    <div className="grid grid-cols-2 border-t border-gray-100 pt-6">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PROMOTED</p>
                            <p className="text-xl font-bold">42</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">WITH OFFERS</p>
                            <p className="text-xl font-bold">5</p>
                        </div>
                    </div>
                </div>

                {/* Listing Performance Card */}
                <div className="lg:col-span-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Listing Performance</h3>
                        <span className="text-secondary text-sm hover:underline cursor-pointer">View report</span>
                    </div>
                    <table className="w-full">
                        <thead className="text-[11px] text-gray-400 font-bold border-b border-gray-100 uppercase tracking-widest">
                            <tr>
                                <th className="text-left py-2 font-bold">METRIC</th>
                                <th className="text-right py-2 font-bold">VALUE</th>
                                <th className="text-right py-2 font-bold">TREND</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <tr className="border-b border-gray-50">
                                <td className="py-4 text-gray-700">Total Impressions</td>
                                <td className="text-right font-bold">1.2M</td>
                                <td className="text-right text-green-600 font-bold">+8.2%</td>
                            </tr>
                            <tr className="border-b border-gray-50">
                                <td className="py-4 text-gray-700">Click-through Rate (CTR)</td>
                                <td className="text-right font-bold">0.9%</td>
                                <td className="text-right text-red-500 font-bold">-0.2%</td>
                            </tr>
                            <tr>
                                <td className="py-4 text-gray-700">Conversion Rate</td>
                                <td className="text-right font-bold">2.4%</td>
                                <td className="text-right text-green-600 font-bold">+0.5%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
