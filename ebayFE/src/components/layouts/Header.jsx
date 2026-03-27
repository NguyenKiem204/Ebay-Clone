import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart, ChevronDown } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useCategoryStore from '../../store/useCategoryStore';
import useCartStore from '../../features/cart/hooks/useCartStore';
import useNotificationStore from '../../store/useNotificationStore';
import { useRequireAuth } from '../../hooks/useRequireAuth';

function formatTimeAgo(value) {
    if (!value) {
        return '';
    }

    const createdAt = new Date(value).getTime();
    const diffMinutes = Math.max(1, Math.floor((Date.now() - createdAt) / 60000));

    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

function getNotificationCopy(item) {
    const type = (item?.type || '').toLowerCase();

    switch (type) {
        case 'auction_outbid':
            return {
                title: "You've been outbid",
                body: 'Another bidder has moved ahead on this auction.'
            };
        case 'auction_won':
            return {
                title: 'You won the auction',
                body: 'Your winning auction is ready for checkout.'
            };
        case 'auction_lost':
            return {
                title: 'Auction ended',
                body: 'You did not win this auction.'
            };
        case 'auction_ending_soon':
            return {
                title: 'Auction ending soon',
                body: 'One of your watched auctions is about to end.'
            };
        case 'order':
            return {
                title: 'Order received',
                body: 'Your order has been created successfully.'
            };
        case 'order_cancellation_request':
            return {
                title: 'Cancellation request received',
                body: 'A buyer asked to cancel an order.'
            };
        case 'order_cancellation_resolution':
            return {
                title: 'Cancellation update',
                body: 'Your cancellation request has been updated.'
            };
        case 'order_shipped':
            return {
                title: 'Order shipped',
                body: 'Your order is on the way.'
            };
        case 'order_delivered':
            return {
                title: 'Order delivered',
                body: 'Your order has been marked as delivered.'
            };
        default:
            return {
                title: item?.title || 'Notification',
                body: item?.body || ''
            };
    }
}

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { categories, navGroups, fetchNavGroups } = useCategoryStore();
    const totalItems = useCartStore((state) => state.totalItems);
    const { handleSecureAction } = useRequireAuth();

    const notifications = useNotificationStore((state) => state.items);
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
    const markAsRead = useNotificationStore((state) => state.markAsRead);
    const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);

    useEffect(() => {
        fetchNavGroups();
    }, [fetchNavGroups]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        }
    }, [fetchNotifications, isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => window.clearInterval(timer);
    }, [fetchNotifications, isAuthenticated]);

    const queryParams = new URLSearchParams(location.search);
    const isAuctionsActive = location.pathname === '/products' && queryParams.get('filter') === 'auctions';
    const isProductDetails = /^\/products\/[^/]+$/.test(location.pathname);

    return (
        <header className="relative z-50 bg-white">
            <div className="border-b border-gray-100">
                <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-2 text-[12px] text-[#333] md:px-8 xl:px-4">
                    <div className="flex items-center gap-4">
                        <div className="group relative flex items-center gap-1">
                            {isAuthenticated ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsNotificationMenuOpen(false);
                                            setIsUserMenuOpen((current) => !current);
                                        }}
                                        className="flex items-center gap-1 hover:underline focus:outline-none"
                                    >
                                        Hi <strong>{user?.firstName || user?.username}</strong>!
                                        <ChevronDown size={12} className={`transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isUserMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                                            <div className="absolute left-0 top-full z-50 mt-2 w-56 animate-in rounded-lg border border-gray-200 bg-white py-3 shadow-xl fade-in slide-in-from-top-1 duration-200">
                                                <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                                                        {(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="truncate font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
                                                        <p className="truncate text-[11px] text-gray-500">{user?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="py-2">
                                                    <Link
                                                        to="/profile"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                        className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-600"
                                                    >
                                                        My eBay
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            logout();
                                                            setIsUserMenuOpen(false);
                                                        }}
                                                        className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                                                    >
                                                        Sign out
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    Hi! <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link> or <Link to="/register" className="text-blue-600 hover:underline">register</Link>
                                </>
                            )}
                        </div>
                        <Link to="#" className="hover:underline">Deals</Link>
                        <Link to="#" className="hover:underline">Brand Outlet</Link>
                        <Link to="#" className="hover:underline">Gift Cards</Link>
                        <Link to="#" className="hover:underline">Help & Contact</Link>
                    </div>

                    <div className="flex items-center gap-5">
                        <Link to="#" className="hover:underline">Ship to</Link>
                        <Link to="/seller" className="hover:underline">Sell</Link>
                        <button
                            onClick={() => handleSecureAction(() => navigate('/watchlist'), '/watchlist')}
                            className="flex items-center gap-1 hover:underline"
                        >
                            Watchlist <ChevronDown size={12} />
                        </button>
                        <Link to="/profile" className="flex items-center gap-1 hover:underline">My eBay <ChevronDown size={12} /></Link>
                        <div className="relative">
                            <button
                                onClick={() => handleSecureAction(() => {
                                    setIsUserMenuOpen(false);
                                    setIsNotificationMenuOpen((current) => !current);
                                })}
                                className="relative rounded-full p-1 transition-colors hover:bg-gray-100"
                            >
                                <Bell size={20} strokeWidth={1.5} />
                                {isAuthenticated && unreadCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {isNotificationMenuOpen && isAuthenticated && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationMenuOpen(false)} />
                                    <div className="absolute right-0 top-full z-50 mt-2 w-[360px] rounded-2xl border border-gray-200 bg-white shadow-xl">
                                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Notifications</p>
                                                <p className="text-xs text-gray-500">{unreadCount} unread</p>
                                            </div>
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs font-semibold text-[#3665f3] hover:underline"
                                            >
                                                Mark all as read
                                            </button>
                                        </div>

                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-sm text-gray-500">
                                                No notifications yet.
                                            </div>
                                        ) : (
                                            <div className="max-h-[420px] overflow-y-auto">
                                                {notifications.map((item) => (
                                                    (() => {
                                                        const copy = getNotificationCopy(item);

                                                        return (
                                                            <button
                                                                key={item.id}
                                                                onClick={async () => {
                                                                    if (!item.isRead) {
                                                                        await markAsRead(item.id);
                                                                    }

                                                                    setIsNotificationMenuOpen(false);
                                                                    if (item.link) {
                                                                        navigate(item.link);
                                                                    }
                                                                }}
                                                                className={`flex w-full gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                                                                    item.isRead ? 'bg-white' : 'bg-blue-50/50'
                                                                }`}
                                                            >
                                                                <div className={`mt-1 h-2.5 w-2.5 rounded-full ${item.isRead ? 'bg-transparent' : 'bg-[#3665f3]'}`} />
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <p className="truncate text-sm font-semibold text-gray-900">{copy.title}</p>
                                                                        <span className="shrink-0 text-[11px] text-gray-400">{formatTimeAgo(item.createdAt)}</span>
                                                                    </div>
                                                                    <p className="mt-1 text-sm text-gray-600">{copy.body}</p>
                                                                </div>
                                                            </button>
                                                        );
                                                    })()
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <Link to="/cart" className="relative rounded-full p-1 transition-colors hover:bg-gray-100">
                            <ShoppingCart size={22} strokeWidth={1.5} />
                            {totalItems > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-[1280px] border-b border-gray-200 px-4 py-3 md:px-8 xl:px-4">
                <div className="flex items-center gap-4">
                    <div className="flex shrink-0 items-center gap-2">
                        <Link to="/" className="flex items-center" aria-label="eBay Home">
                            <svg className="h-[44px] w-[110px]" viewBox="0 0 122 48.592"><g><path fill="#E53238" d="M24.355 22.759c-.269-5.738-4.412-7.838-8.826-7.813-4.756.026-8.544 2.459-9.183 7.915zM6.234 26.93c.364 5.553 4.208 8.814 9.476 8.785 3.648-.021 6.885-1.524 7.952-4.763l6.306-.035c-1.187 6.568-8.151 8.834-14.145 8.866C4.911 39.844.043 33.865-.002 25.759c-.05-8.927 4.917-14.822 15.765-14.884 8.628-.048 14.978 4.433 15.033 14.291l.01 1.625z"></path><path fill="#0064D2" d="M46.544 35.429c5.688-.032 9.543-4.148 9.508-10.32s-3.947-10.246-9.622-10.214-9.543 4.148-9.509 10.32 3.974 10.245 9.623 10.214zM30.652.029l6.116-.034.085 15.369c2.978-3.588 7.1-4.65 11.167-4.674 6.817-.037 14.412 4.518 14.468 14.454.045 8.29-5.941 14.407-14.422 14.454-4.463.026-8.624-1.545-11.218-4.681a33.237 33.237 0 01-.19 3.731l-5.994.034c.09-1.915.185-4.364.174-6.322z"></path><path fill="#F5AF02" d="M77.282 25.724c-5.548.216-8.985 1.229-8.965 4.883.013 2.365 1.94 4.919 6.7 4.891 6.415-.035 9.826-3.556 9.794-9.289v-.637c-2.252.02-5.039.054-7.529.152zm13.683 7.506c.01 1.778.071 3.538.232 5.1l-5.688.032a33.381 33.381 0 01-.225-3.825c-3.052 3.8-6.708 4.909-11.783 4.938-7.532.042-11.585-3.915-11.611-8.518-.037-6.665 5.434-9.049 14.954-9.318 2.6-.072 5.529-.1 7.945-.116v-.637c-.026-4.463-2.9-6.285-7.854-6.257-3.68.021-6.368 1.561-6.653 4.2l-6.434.035c.645-6.566 7.53-8.269 13.595-8.3 7.263-.04 13.406 2.508 13.448 10.192z"></path><path fill="#84B817" d="M91.939 19.852l-4.5-8.362 7.154-.04 10.589 20.922 10.328-21.02 6.486-.048-18.707 37.251-6.85.039 5.382-10.348-9.887-18.393"></path></g></svg>
                        </Link>
                        <button className="flex whitespace-nowrap text-left text-[13px] leading-tight text-[#707070] transition-colors hover:text-blue-600">
                            <span>Shop by<br />category</span>
                            <ChevronDown size={14} className="mt-1" />
                        </button>
                    </div>

                    <div className="flex flex-grow items-center gap-2">
                        <form
                            className="flex flex-grow items-center gap-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const formData = new FormData(event.currentTarget);
                                const q = formData.get('q');
                                const category = formData.get('category');

                                const params = new URLSearchParams();
                                if (q) params.append('q', q);
                                if (category) params.append('categorySlugs', category);

                                navigate(params.toString() ? `/products?${params.toString()}` : '/products');
                            }}
                        >
                            <div className="flex h-11 flex-grow items-center gap-3 rounded-full border-[1.5px] border-black bg-white px-4">
                                <svg className="h-5 w-5 text-[#707070]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    name="q"
                                    className="flex-grow bg-transparent text-[16px] outline-none placeholder-[#707070]"
                                    placeholder="Search for anything"
                                />
                                <div className="mx-2 hidden h-2/3 border-l border-[#ddd] md:block"></div>
                                <select
                                    name="category"
                                    className="hidden cursor-pointer border-none bg-transparent pr-4 text-[14px] text-[#333] outline-none hover:underline md:block"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.slug}>{category.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="h-11 shrink-0 rounded-full border-none bg-[#3665f3] px-10 text-[15px] font-bold text-white transition-colors hover:bg-[#3055CB]">
                                Search
                            </button>
                        </form>
                        <Link to="/advanced" className="ml-1 whitespace-nowrap text-[12px] text-[#707070] transition-colors hover:text-blue-600">
                            Advanced
                        </Link>
                    </div>
                </div>
            </div>

            {!isProductDetails && (
                <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-6 border-t border-gray-100 px-4 py-3 text-[13px] text-[#333] md:px-8 xl:px-4">
                    <button
                        onClick={() => handleSecureAction(() => navigate('/saved'), '/saved')}
                        className="border-b border-transparent pb-1 hover:border-blue-600 hover:text-blue-600"
                    >
                        Saved
                    </button>
                    <Link
                        to="/products?filter=auctions"
                        className={`border-b border-transparent pb-1 hover:border-blue-600 hover:text-blue-600 ${isAuctionsActive ? 'font-bold text-secondary' : ''}`}
                    >
                        Auctions
                    </Link>
                    {navGroups && navGroups.map((group) => (
                        <div key={group.slug} className="group relative">
                            <Link
                                to={`/products?categorySlugs=${group.slug}`}
                                className="block whitespace-nowrap border-b border-transparent pb-1 hover:border-blue-600 hover:text-blue-600"
                            >
                                {group.name}
                            </Link>
                            {group.categories && group.categories.length > 0 && (
                                <div className="absolute left-0 top-full z-50 hidden pt-2 group-hover:block">
                                    <div className="min-w-[300px] columns-2 gap-4 rounded-md border border-gray-200 bg-white p-4 text-black shadow-lg">
                                        {group.categories.map((category) => (
                                            <div key={category.slug} className="mb-3 break-inside-avoid">
                                                <Link to={`/products?categorySlugs=${category.slug}`} className="mb-1 block font-bold text-[#333] hover:underline">
                                                    {category.name}
                                                </Link>
                                                {category.subCategories && category.subCategories.map((subCategory) => (
                                                    <Link key={subCategory.slug} to={`/products?categorySlugs=${subCategory.slug}`} className="mb-1 block text-[12px] text-[#707070] hover:underline">
                                                        {subCategory.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <Link to="/products?filter=deals" className="border-b border-transparent pb-1 hover:border-blue-600 hover:text-blue-600">Deals</Link>
                    <Link to="/seller" className="border-b border-transparent pb-1 hover:border-blue-600 hover:text-blue-600">Sell</Link>
                </div>
            )}
        </header>
    );
}
