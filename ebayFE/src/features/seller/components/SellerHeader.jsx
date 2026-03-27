import { Link, useLocation } from 'react-router-dom';
import { Bell, MessageSquare, User, ChevronDown, Search, LogOut } from 'lucide-react';
import useStoreStore from '../../../store/useStoreStore';
import useAuthStore from '../../../store/useAuthStore';

const SELLER_NAV_ITEMS = [
    // ... (giữ nguyên nav items)
    { label: 'Overview', path: '/seller' },
    { label: 'Orders', path: '/seller/orders' },
    { label: 'Cases', path: '/seller/cases' },
    { label: 'Listings', path: '/seller/listings' },
    { label: 'Marketing', path: '/seller/marketing' },
    { label: 'Advertising', path: '/seller/advertising' },
    { label: 'Store', path: '/seller/store' },
    { label: 'Performance', path: '/seller/performance' },
    { label: 'Payments', path: '/seller/payments' },
    { label: 'Research', path: '/seller/research' },
    { label: 'Reports', path: '/seller/reports' },
];

export default function SellerHeader() {
    const location = useLocation();
    const { store } = useStoreStore();
    const { user, logout } = useAuthStore();

    return (
        <header className="bg-white border-b border-gray-200">
            <div className="max-w-[1400px] mx-auto px-4">
                {/* Main Header Bar */}
                <div className="py-3 flex items-center gap-8">
                    {/* Logo & Hub Title */}
                    <div className="flex items-center gap-4 shrink-0">
                        <Link to="/">
                            <svg xmlns="http://www.w3.org/2000/svg" width="90" height="36" viewBox="0 0 122 48.592"><g><path fill="#F02D2D" d="M24.355 22.759c-.269-5.738-4.412-7.838-8.826-7.813-4.756.026-8.544 2.459-9.183 7.915zM6.234 26.93c.364 5.553 4.208 8.814 9.476 8.785 3.648-.021 6.885-1.524 7.952-4.763l6.306-.035c-1.187 6.568-8.151 8.834-14.145 8.866C4.911 39.844.043 33.865-.002 25.759c-.05-8.927 4.917-14.822 15.765-14.884 8.628-.048 14.978 4.433 15.033 14.291l.01 1.625z"></path><path fill="#0968F6" d="M46.544 35.429c5.688-.032 9.543-4.148 9.508-10.32s-3.947-10.246-9.622-10.214-9.543 4.148-9.509 10.32 3.974 10.245 9.623 10.214zM30.652.029l6.116-.034.085 15.369c2.978-3.588 7.1-4.65 11.167-4.674 6.817-.037 14.412 4.518 14.468 14.454.045 8.29-5.941 14.407-14.422 14.454-4.463.026-8.624-1.545-11.218-4.681a33.237 33.237 0 01-.19 3.731l-5.994.034c.09-1.915.185-4.364.174-6.322z"></path><path fill="#FFBD14" d="M77.282 25.724c-5.548.216-8.985 1.229-8.965 4.883.013 2.365 1.94 4.919 6.7 4.891 6.415-.035 9.826-3.556 9.794-9.289v-.637c-2.252.02-5.039.054-7.529.152zm13.683 7.506c.01 1.778.071 3.538.232 5.1l-5.688.032a33.381 33.381 0 01-.225-3.825c-3.052 3.8-6.708 4.909-11.783 4.938-7.532.042-11.585-3.915-11.611-8.518-.037-6.665 5.434-9.049 14.954-9.318 2.6-.072 5.529-.1 7.945-.116v-.637c-.026-4.463-2.9-6.285-7.854-6.257-3.68.021-6.368 1.561-6.653 4.2l-6.434.035c.645-6.566 7.53-8.269 13.595-8.3 7.263-.04 13.406 2.508 13.448 10.192z"></path><path fill="#92C821" d="M91.939 19.852l-4.5-8.362 7.154-.04 10.589 20.922 10.328-21.02 6.486-.048-18.707 37.251-6.85.039 5.382-10.348-9.887-18.393"></path></g></svg>
                        </Link>
                        <span className="text-xl font-medium text-gray-700">Seller Hub</span>
                    </div>

                    {/* Search Bar - Matching Image 1 */}
                    <div className="flex-grow flex items-center">
                        <div className="flex-grow flex items-center border-2 border-gray-800 rounded-sm">
                            <div className="flex-grow relative border-r border-gray-300">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search for anything"
                                    className="w-full pl-10 pr-4 py-2 text-sm focus:outline-none"
                                />
                            </div>
                            <div className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300 flex items-center gap-4 cursor-pointer hover:bg-gray-50 bg-white">
                                <span>All Categories</span>
                                <ChevronDown size={14} />
                            </div>
                            <button className="bg-[#3665f3] text-white px-8 py-2 text-sm font-bold hover:bg-blue-700 transition-colors">
                                Search
                            </button>
                        </div>
                        <button className="px-4 text-[12px] text-gray-500 hover:text-blue-600">Advanced</button>
                    </div>

                    {/* Notification & User */}
                    <div className="flex items-center gap-6 shrink-0">
                        <button className="text-gray-600 hover:text-gray-900 relative">
                            <Bell size={22} strokeWidth={1.5} />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 border border-gray-300 rounded-full px-4 py-1.5 text-sm font-bold">
                            Messages (0)
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 cursor-pointer">
                                <span className="text-sm font-bold truncate max-w-[150px]">
                                    {user?.role?.toLowerCase() === 'seller'
                                        ? (store?.storeName || user?.username)
                                        : (user?.username || 'My eBay')}
                                </span>
                                <ChevronDown size={14} />
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors border border-gray-200 rounded-md shadow-sm bg-gray-50/50"
                                title="Sign out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub-Nav Layout Adjustments */}
                <nav className="flex items-center gap-8 text-[14px] font-medium overflow-x-auto no-scrollbar">
                    {SELLER_NAV_ITEMS.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${(item.path === '/seller' ? location.pathname === '/seller' : location.pathname.startsWith(item.path))
                                ? 'border-gray-800 text-gray-800 font-bold'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {item.label}
                            {['Orders', 'Listings', 'Marketing', 'Performance', 'Payments', 'Research', 'Reports'].includes(item.label) && (
                                <ChevronDown size={12} className="inline ml-1 opacity-50" />
                            )}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
}
