import { useState } from 'react';
import {
    ChevronRight, ShoppingBag, Eye, TrendingUp, CheckCircle2,
    Package, RotateCcw, XCircle, CreditCard, Truck, MessageCircle,
    Star, Target, Settings, Zap, ExternalLink, BarChart2,
    FileText, Users, Clock, Tag, Gift, Megaphone
} from 'lucide-react';
import useStoreStore from '../../store/useStoreStore';
import useAuthStore from '../../store/useAuthStore';
import { Link } from 'react-router-dom';
import { BASE_URL } from '../../lib/axios';

// ─── Reusable card shell ────────────────────────────────────────────────────
function Card({ title, to = '#', children, className = '' }) {
    return (
        <div className={`bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col ${className}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-[15px]">{title}</h3>
                <Link to={to} className="text-gray-400 hover:text-gray-700 transition-colors">
                    <ChevronRight size={18} />
                </Link>
            </div>
            <div className="flex-1 p-5">{children}</div>
        </div>
    );
}

// ─── Stat row item ───────────────────────────────────────────────────────────
function StatRow({ label, value, to = '#', highlight = false }) {
    return (
        <Link to={to} className="flex items-center justify-between py-2 hover:bg-gray-50 -mx-5 px-5 rounded group transition-colors">
            <span className={`text-sm ${highlight ? 'text-[#3665f3] font-medium' : 'text-gray-600'} group-hover:text-secondary`}>{label}</span>
            <span className="text-sm font-bold text-gray-900">{value}</span>
        </Link>
    );
}

// ─── Mini SVG sales chart ─────────────────────────────────────────────────────
function SalesChart({ data }) {
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => `${(i * 1000) / (data.length - 1)},${100 - (v / max) * 90}`).join(' ');
    const fill = `0,100 ${points} 1000,100`;
    return (
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="w-full h-full">
            <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3665f3" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#3665f3" stopOpacity="0" />
                </linearGradient>
            </defs>
            {[25, 50, 75].map(y => <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#f0f0f0" strokeWidth="1.5" />)}
            <polyline points={points} fill="none" stroke="#3665f3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <polygon points={fill} fill="url(#sg)" />
        </svg>
    );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function SellerOverviewPage() {
    const { store } = useStoreStore();
    const { user } = useAuthStore();
    const [salesPeriod, setSalesPeriod] = useState('last31');

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
    };

    const storeName = store?.storeName || user?.username || 'Your Store';

    // Mock chart data (31 days)
    const chartData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const salesRows = [
        { id: 'today', label: 'Today', value: '$0.00' },
        { id: 'last7', label: 'Last 7 days', value: '$0.00' },
        { id: 'last31', label: 'Last 31 days', value: '$0.00' },
        { id: 'last90', label: 'Last 90 days', value: '$0.00' },
    ];

    const listingLinks = [
        { label: 'Create listing', bold: true, to: '/seller/listings/create' },
        { label: 'Drafts', count: 0 },
        { label: 'Active listings', count: 0 },
        { label: 'With questions', count: 0 },
        { label: 'With open offers from buyers', count: 0 },
        { label: 'All auctions', count: 0 },
        { label: 'With reserve met', count: 0 },
        { label: 'Auctions ending today', count: 0 },
        { label: 'Buy It Now renewing today', count: 0 },
        { label: 'Scheduled listings', count: 0 },
        { label: 'Unsold and not relisted', count: 0 },
    ];

    const orderLinks = [
        { label: 'See all orders', bold: true },
        { label: 'Awaiting shipment – print shipping label', count: 0 },
        { label: 'All open returns/replacements', count: 0 },
        { label: 'Open cancellations', count: 0 },
        { label: 'Awaiting payment', count: 0 },
        { label: 'Shipped and awaiting your feedback', count: 0 },
        { label: 'Orders eligible for combined purchases', count: 0 },
    ];

    const trafficRows = [
        { label: 'Listing impressions', value: '0', pct: '0.0%' },
        { label: 'Click-through rate', value: '0.0%', pct: '' },
        { label: 'Listing page views', value: '0', pct: '0.0%' },
        { label: 'Sales conversion rate', value: '0.0%', pct: '' },
    ];

    const shortcuts = [
        'Cancel bids', 'Block bidders', 'Site preferences',
        'Selling discussion board', 'Seller Center', 'Report a buyer',
        'eBay Shipping Supplies', 'Purchase history', 'Watch list',
    ];

    const sellingTools = [
        'Subscriptions', 'Merchant Integration Platform', 'Intuit QuickBooks Online',
        'eBay Seller Capital', 'View My eBay Selling', 'Seller Hub Reports',
        'Automate feedback', 'Reporting', 'Seller Dashboard',
        'Sellers you follow', '3rd party applications', 'Time Away',
    ];

    return (
        <div className="space-y-4 pb-20">
            {/* Opt out link */}
            <div className="flex justify-end">
                <span className="text-[12px] text-[#3665f3] hover:underline cursor-pointer">Opt out of Seller Hub</span>
            </div>

            {/* ── Top store summary bar ─────────────────────────────────── */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                        {store?.logoUrl
                            ? <img src={getImageUrl(store.logoUrl)} alt="Store" className="w-full h-full object-cover" />
                            : <ShoppingBag className="text-gray-300" size={28} />
                        }
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{storeName}</h2>
                </div>

                <div className="flex items-center gap-10">
                    {[
                        { icon: Eye, label: 'Listing views (90d)', value: '0' },
                        { icon: null, label: 'Sales (90d)', value: '$0.00' },
                        { icon: ShoppingBag, label: 'Orders (90d)', value: '0' },
                    ].map(stat => (
                        <button key={stat.label} className="text-center group hover:opacity-80 transition-opacity">
                            <div className="flex items-center gap-1.5 justify-center font-bold text-gray-900 text-lg">
                                {stat.icon && <stat.icon size={16} className="text-gray-600" />}
                                <span>{stat.value}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                                {stat.label} <ChevronRight size={11} />
                            </p>
                        </button>
                    ))}

                    <Link
                        to="/seller/listings/create"
                        className="bg-[#3665f3] text-white px-7 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                        Create listing
                    </Link>
                </div>
            </div>

            {/* ── All caught up banner ─────────────────────────────────── */}
            <div className="bg-[#f7f7f7] rounded-lg border border-gray-200 px-5 py-4 flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold text-sm text-gray-900">You're all caught up!</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                        New tasks, like orders to ship or offers to review, will show up here.
                    </p>
                </div>
            </div>

            {/* ── Row 1: Listings | Orders | Sales ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Listings */}
                <Card title="Listings" to="/seller/listings">
                    <div className="divide-y divide-gray-50">
                        {listingLinks.map((item, i) => (
                            <Link
                                key={i}
                                to={item.to || '#'}
                                className="flex items-center justify-between py-1.5 hover:bg-gray-50 -mx-5 px-5 group transition-colors"
                            >
                                <span className={`text-sm ${item.bold ? 'text-[#3665f3] font-semibold' : 'text-[#3665f3]'} group-hover:underline`}>
                                    {item.label}
                                </span>
                                {item.count !== undefined && (
                                    <span className="text-sm font-medium text-gray-700">{item.count}</span>
                                )}
                            </Link>
                        ))}
                    </div>
                </Card>

                {/* Orders */}
                <Card title="Orders" to="/seller/orders">
                    <div className="divide-y divide-gray-50">
                        {orderLinks.map((item, i) => (
                            <Link
                                key={i}
                                to="#"
                                className="flex items-center justify-between py-1.5 hover:bg-gray-50 -mx-5 px-5 group transition-colors"
                            >
                                <span className="text-sm text-[#3665f3] group-hover:underline">{item.label}</span>
                                {item.count !== undefined && (
                                    <span className="text-sm font-medium text-gray-700">{item.count}</span>
                                )}
                            </Link>
                        ))}
                        <button className="flex items-center gap-1 text-sm text-gray-600 pt-2 hover:text-gray-900 transition-colors">
                            Show more <ChevronRight size={14} />
                        </button>
                    </div>
                </Card>

                {/* Sales  */}
                <Card title="Sales" to="#">
                    <p className="text-xs text-gray-400 mb-3 -mt-1 italic text-center">Chart for sales data across 31 days</p>
                    <div className="h-32 w-full relative">
                        <div className="absolute left-0 h-full flex flex-col justify-between text-[10px] text-gray-300 pr-1">
                            <span>$0</span>
                            <span>$0</span>
                        </div>
                        <div className="ml-6 h-full">
                            <SalesChart data={chartData} />
                        </div>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1 mb-3">
                        {['Feb 13', 'Feb 20', 'Feb 27', 'Mar 6', 'Mar 13'].map(d => (
                            <span key={d}>{d}</span>
                        ))}
                    </div>
                    <div className="divide-y divide-gray-100">
                        {salesRows.map(row => (
                            <button
                                key={row.id}
                                onClick={() => setSalesPeriod(row.id)}
                                className={`w-full flex justify-between items-center py-2 text-sm transition-colors ${salesPeriod === row.id ? 'font-bold text-gray-900' : 'text-[#3665f3] hover:underline'}`}
                            >
                                <span>{row.label}</span>
                                <span className={salesPeriod === row.id ? 'text-gray-900 font-bold' : 'text-[#3665f3] font-semibold'}>{row.value}</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-3 leading-relaxed border-t border-gray-100 pt-3">
                        Data for Feb 13 – Mar 16 at 10:31pm PDT. Percentage change relative to prior period. Performance statistics are rounded to the nearest tenth. Data includes shipping and sales tax.
                    </p>
                </Card>
            </div>

            {/* ── Row 2: Advertising | Traffic | Seller Level ──────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Advertising */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-[15px]">Advertising</h3>
                            <span className="bg-[#3665f3] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">NEW</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </div>
                    <div className="p-5 flex flex-col items-center text-center">
                        {/* Illustration */}
                        <div className="relative w-36 h-28 mb-4">
                            <div className="absolute bottom-0 left-2 w-28 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                                <Megaphone size={40} className="text-[#3665f3] opacity-30" />
                            </div>
                            <div className="absolute top-0 right-0 w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                                <Star size={24} className="text-white fill-white" />
                            </div>
                            <div className="absolute bottom-3 right-2 text-green-600 font-bold text-sm bg-white rounded-full px-2 py-0.5 shadow-sm border border-gray-100">
                                +14%
                            </div>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Reach more buyers</h4>
                        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                            Advertising connects you with more buyers around the world with simple‑to‑use, high‑performing solutions that match your sales goals and campaign budget.
                        </p>
                        <button className="border border-[#3665f3] text-[#3665f3] font-bold text-sm px-6 py-2 rounded-full hover:bg-blue-50 transition-colors">
                            Get started
                        </button>
                    </div>
                </div>

                {/* Traffic */}
                <Card title="Traffic" to="#">
                    <div className="space-y-1">
                        {trafficRows.map((row, i) => (
                            <div key={i} className="py-2 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-1 text-sm text-[#3665f3] hover:underline cursor-pointer mb-1">
                                    <span>{row.label}</span>
                                    {row.pct && <ChevronRight size={13} />}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">{row.value}</span>
                                    {row.pct && <span className="text-xs text-gray-400">{row.pct}</span>}
                                </div>
                            </div>
                        ))}
                        <p className="text-[10px] text-[#3665f3] pt-2 cursor-pointer hover:underline leading-relaxed">
                            Data for Feb 13 – Mar 16 at 10:31pm PDT. Percentage change relative to prior period. Performance statistics are rounded to the nearest tenth.
                        </p>
                    </div>
                </Card>

                {/* Seller Level */}
                <Card title="Seller level (Region: US)" to="#">
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                            <Target size={28} className="text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500">No seller level information available.</p>
                        <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
                            Seller levels are evaluated on the 20th of every month.
                        </p>
                    </div>
                </Card>
            </div>

            {/* ── Row 3: Feedback | Shortcuts | Selling Tools ──────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Feedback */}
                <Card title="Feedback" to="#">
                    <p className="text-xs text-gray-400 mb-4">Last 30 days</p>
                    <div className="flex gap-4 mb-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-white text-[9px] font-bold">+</span>
                            </div>
                            0 Positive
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center">
                                <span className="text-white text-[9px] font-bold">○</span>
                            </div>
                            0 Neutral
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                <span className="text-white text-[9px] font-bold">–</span>
                            </div>
                            0 Negative
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-4 space-y-2">
                        <p className="text-xs text-gray-500 font-semibold">Feedback for buyers</p>
                        {['Leave feedback', 'Manage automated feedback'].map(label => (
                            <Link key={label} to="#" className="block text-sm text-[#3665f3] hover:underline">{label}</Link>
                        ))}
                    </div>
                </Card>

                {/* Shortcuts */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 text-[15px]">Shortcuts</h3>
                        <Settings size={16} className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors" />
                    </div>
                    <div className="flex-1 p-5">
                        <div className="space-y-1.5">
                            {shortcuts.map(label => (
                                <Link key={label} to="#" className="block text-sm text-[#3665f3] hover:underline py-0.5">{label}</Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selling tools */}
                <Card title="Selling tools" to="#">
                    <div className="space-y-1.5">
                        {sellingTools.map(label => (
                            <Link key={label} to="#" className="block text-sm text-[#3665f3] hover:underline py-0.5">{label}</Link>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
