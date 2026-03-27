import { Link } from 'react-router-dom';
import {
    Bookmark,
    ChevronRight,
    Heart,
    MapPin,
    MessageSquare,
    Shield,
    ShoppingBag,
    Store,
    User
} from 'lucide-react';

function SidebarNavLink({ to, label, active }) {
    return (
        <Link
            to={to}
            className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                    ? 'bg-blue-50 text-[#3665f3] shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
            <span>{label}</span>
            <ChevronRight size={16} className={active ? 'text-[#3665f3]' : 'text-gray-300'} />
        </Link>
    );
}

export default function MyEbaySidebar({ user, activeKey = 'overview' }) {
    const isSeller = (user?.role || '').toLowerCase() === 'seller';

    return (
        <aside className="space-y-5">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3665f3] text-lg font-black text-white">
                        {(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-lg font-black text-gray-900">
                            {user?.firstName || user?.username} {user?.lastName || ''}
                        </p>
                        <p className="truncate text-sm text-gray-500">{user?.email}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Overview</p>
                <div className="space-y-2">
                    <SidebarNavLink to="/profile?view=overview" label="Dashboard" active={activeKey === 'overview'} />
                    <SidebarNavLink to="/profile?view=auctions" label="My Auctions" active={activeKey === 'auctions'} />
                </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Buying</p>
                <div className="space-y-2">
                    <SidebarNavLink to="/orders" label="Purchase History" active={activeKey === 'orders'} />
                    <SidebarNavLink to="/watchlist" label="Watchlist" active={activeKey === 'watchlist'} />
                    <SidebarNavLink to="/saved" label="Saved Items" active={activeKey === 'saved'} />
                    <SidebarNavLink to="/profile?view=reviews" label="Reviews & Feedback" active={activeKey === 'reviews'} />
                    <SidebarNavLink to="/cases" label="Buyer Cases" active={activeKey === 'cases'} />
                </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Account</p>
                <div className="space-y-2">
                    <SidebarNavLink to="/profile?view=personal" label="Personal information" active={activeKey === 'personal'} />
                    <SidebarNavLink to="/profile?view=security" label="Sign in and security" active={activeKey === 'security'} />
                    <SidebarNavLink to="/profile?view=addresses" label="Addresses" active={activeKey === 'addresses'} />
                    <SidebarNavLink to="/profile?view=feedback" label="Feedback" active={activeKey === 'feedback'} />
                </div>
            </div>

            {isSeller && (
                <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Seller</p>
                    <SidebarNavLink to="/seller" label="Open Seller Hub" active={activeKey === 'seller'} />
                </div>
            )}
        </aside>
    );
}
