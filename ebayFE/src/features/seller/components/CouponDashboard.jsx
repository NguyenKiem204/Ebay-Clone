import { useMemo } from 'react';
import { TrendingUp, Info, Tag, Globe, Grid2x2 } from 'lucide-react';

export default function CouponDashboard({ coupons = [] }) {
    const stats = useMemo(() => {
        const activeCoupons = coupons.filter(c => c.isActive);
        const totalUsed = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

        // Average discount value across all coupons (flat + percentage kept separate; show count)
        const percentageCoupons = coupons.filter(c => c.discountType === 'percentage');
        const avgDiscount = percentageCoupons.length > 0
            ? (percentageCoupons.reduce((sum, c) => sum + (c.discountValue || 0), 0) / percentageCoupons.length).toFixed(1)
            : 0;

        return {
            activeCoupons: activeCoupons.length,
            totalCoupons: coupons.length,
            totalUsed,
            avgDiscount,
        };
    }, [coupons]);

    // Build a simple usage bar chart: last 12 coupons sorted by usedCount
    const chartData = useMemo(() => {
        if (coupons.length === 0) return Array(12).fill(0);
        const sorted = [...coupons].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const counts = sorted.map(c => c.usedCount || 0);
        const max = Math.max(...counts, 1);
        return counts.map(v => (v / max) * 100).slice(-12);
    }, [coupons]);

    const hasData = chartData.some(v => v > 0);

    return (
        <div className="space-y-8">
            {/* Performance Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Performance</h3>
                        <p className="text-sm text-gray-500 mt-1">Check how your discounts are impacting orders and sales.</p>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-md">
                        <span className="font-medium">{stats.activeCoupons} active</span>
                        <span>/</span>
                        <span>{stats.totalCoupons} total promotions</span>
                    </div>
                </div>

                <div className="relative h-64 w-full">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 h-full flex flex-col justify-between text-[11px] text-gray-400 pb-6 pr-4">
                        <span>100%</span>
                        <span>75%</span>
                        <span>50%</span>
                        <span>25%</span>
                        <span>0%</span>
                    </div>

                    {/* SVG Chart */}
                    <div className="ml-16 h-full border-b border-l border-gray-100 relative">
                        {hasData ? (
                            <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                                {[25, 50, 75].map(y => (
                                    <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#f3f4f6" strokeWidth="1" />
                                ))}
                                <path
                                    d={`M ${chartData.map((v, i) => `${(i * 1000) / (Math.max(chartData.length - 1, 1))} ${100 - v}`).join(' L ')}`}
                                    fill="none"
                                    stroke="#3665f3"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d={`M 0 100 L ${chartData.map((v, i) => `${(i * 1000) / (Math.max(chartData.length - 1, 1))} ${100 - v}`).join(' L ')} L 1000 100 Z`}
                                    fill="url(#chart-gradient)"
                                    opacity="0.15"
                                />
                                <defs>
                                    <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3665f3" />
                                        <stop offset="100%" stopColor="#3665f3" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white/90 border border-gray-200 p-6 rounded-lg shadow-xl text-center max-w-sm">
                                    <Info className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                    <p className="font-bold text-gray-900 text-sm">No coupon usage recorded yet</p>
                                    <p className="text-xs text-gray-500 mt-1">Usage data will appear here once buyers redeem your coupons.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        label: 'Active Promotions',
                        value: stats.activeCoupons,
                        sub: `out of ${stats.totalCoupons} total`,
                        icon: <Tag className="w-5 h-5 text-blue-500" />,
                    },
                    {
                        label: 'Total Uses',
                        value: stats.totalUsed,
                        sub: 'redemptions across all coupons',
                        icon: <TrendingUp className="w-5 h-5 text-green-500" />,
                    },
                    {
                        label: 'Avg. % Discount',
                        value: `${stats.avgDiscount}%`,
                        sub: 'across percentage-type coupons',
                        icon: <Grid2x2 className="w-5 h-5 text-purple-500" />,
                    },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                            {stat.icon}
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
