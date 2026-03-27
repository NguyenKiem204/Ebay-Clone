import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bookmark, Heart, MapPin, MessageSquare, Shield, ShoppingBag, Store, User } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useOrderStore from '../store/useOrderStore';
import useWatchlistStore from '../features/watchlist/useWatchlistStore';
import useSavedStore from '../features/saved/useSavedStore';
import PersonalInfoView from '../features/auth/components/PersonalInfoView';
import AddressTab from '../features/auth/components/AddressTab';
import SecurityTab from '../features/auth/components/SecurityTab';
import MyAuctionsPanel from '../features/auction/components/MyAuctionsPanel';
import MyEbaySidebar from '../components/myebay/MyEbaySidebar';
import MyReviewsFeedbackPanel from '../features/reviews/components/MyReviewsFeedbackPanel';

function QuickLinkCard({ title, description, href, icon: Icon, badge, tone = 'blue' }) {
    const tones = {
        blue: 'from-blue-50 to-white border-blue-100 text-blue-700',
        red: 'from-red-50 to-white border-red-100 text-red-700',
        green: 'from-emerald-50 to-white border-emerald-100 text-emerald-700',
        amber: 'from-amber-50 to-white border-amber-100 text-amber-700',
        slate: 'from-slate-50 to-white border-slate-200 text-slate-700'
    };

    return (
        <Link
            to={href}
            className={`group rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tones[tone] || tones.blue}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Icon size={20} />
                </div>
                {badge !== undefined && (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700 shadow-sm">
                        {badge}
                    </span>
                )}
            </div>

            <div className="mt-6">
                <h3 className="text-base font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
            </div>
        </Link>
    );
}

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('view') || 'overview';

    const orders = useOrderStore((state) => state.orders);
    const fetchOrders = useOrderStore((state) => state.fetchOrders);
    const watchItems = useWatchlistStore((state) => state.watchItems);
    const fetchWatchlist = useWatchlistStore((state) => state.fetchWatchlist);
    const savedItems = useSavedStore((state) => state.savedItems);
    const fetchSaved = useSavedStore((state) => state.fetchSaved);

    useEffect(() => {
        fetchOrders();
        fetchWatchlist();
        fetchSaved();
    }, [fetchOrders, fetchSaved, fetchWatchlist]);

    const quickLinks = useMemo(() => {
        const items = [
            {
                title: 'Purchase History',
                description: 'Review orders, payment status, delivery progress, and post-purchase actions.',
                href: '/orders',
                icon: ShoppingBag,
                badge: orders.length,
                tone: 'blue'
            },
            {
                title: 'Watchlist',
                description: 'Track the items and auctions you want to revisit before they are gone.',
                href: '/watchlist',
                icon: Heart,
                badge: watchItems.length,
                tone: 'red'
            },
            {
                title: 'Saved Items',
                description: 'Keep a separate shortlist of products you may want to buy later.',
                href: '/saved',
                icon: Bookmark,
                badge: savedItems.length,
                tone: 'green'
            },
            {
                title: 'Buyer Cases',
                description: 'Follow return, refund, and item-not-received requests from one place.',
                href: '/cases',
                icon: Shield,
                tone: 'amber'
            },
            {
                title: 'Reviews & Feedback',
                description: 'Manage product reviews, seller feedback, and items waiting for your rating.',
                href: '/profile?view=reviews',
                icon: MessageSquare,
                tone: 'slate'
            }
        ];

        if ((user?.role || '').toLowerCase() === 'seller') {
            items.push({
                title: 'Seller Hub',
                description: 'Jump into listings, orders, and marketing without leaving My eBay.',
                href: '/seller',
                icon: Store,
                tone: 'slate'
            });
        }

        return items;
    }, [orders.length, savedItems.length, user?.role, watchItems.length]);

    const accountCards = [
        {
            title: 'Personal information',
            description: 'Update your name, contact details, and default account data.',
            href: '/profile?view=personal',
            icon: User
        },
        {
            title: 'Sign in and security',
            description: 'Manage password, security settings, and account protection.',
            href: '/profile?view=security',
            icon: Shield
        },
        {
            title: 'Addresses',
            description: 'Edit delivery addresses used during checkout.',
            href: '/profile?view=addresses',
            icon: MapPin
        },
        {
            title: 'Feedback',
            description: 'See your recent transaction reputation and seller feedback area.',
            href: '/profile?view=reviews',
            icon: MessageSquare
        }
    ];

    const renderMainContent = () => {
        if (activeTab === 'personal') {
            return <PersonalInfoView setActiveTab={(tab) => setSearchParams({ view: tab })} />;
        }

        if (activeTab === 'security') {
            return <SecurityTab />;
        }

        if (activeTab === 'addresses') {
            return <AddressTab />;
        }

        if (activeTab === 'reviews' || activeTab === 'feedback') {
            return <MyReviewsFeedbackPanel />;
        }

        if (activeTab === 'auctions') {
            return <MyAuctionsPanel />;
        }

        return (
            <div className="space-y-8">
                <section className="rounded-3xl bg-gradient-to-br from-[#f7faff] via-white to-[#fff7f8] p-8 shadow-sm ring-1 ring-gray-100">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#3665f3]">My eBay</p>
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900">
                                Everything you need after you sign in
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
                                Your buying shortcuts, auction activity, saved items, and account settings are back in one place.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Orders</p>
                                <p className="mt-1 text-2xl font-black text-gray-900">{orders.length}</p>
                            </div>
                            <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Watchlist</p>
                                <p className="mt-1 text-2xl font-black text-gray-900">{watchItems.length}</p>
                            </div>
                            <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Saved</p>
                                <p className="mt-1 text-2xl font-black text-gray-900">{savedItems.length}</p>
                            </div>
                            <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Member</p>
                                <p className="mt-1 truncate text-lg font-black text-gray-900">{user?.username || 'User'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="mb-4">
                        <h3 className="text-xl font-black text-gray-900">Buying shortcuts</h3>
                        <p className="text-sm text-gray-500">Restored links for the parts of My eBay that were lost after the merge.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {quickLinks.map((item) => (
                            <QuickLinkCard key={item.title} {...item} />
                        ))}
                    </div>
                </section>

                <section>
                    <div className="mb-4">
                        <h3 className="text-xl font-black text-gray-900">Account tools</h3>
                        <p className="text-sm text-gray-500">The old account tabs are still here, cleaned up to match the new My eBay layout.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {accountCards.map((card) => (
                            <Link
                                key={card.title}
                                to={card.href}
                                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
                                    <card.icon size={20} />
                                </div>
                                <h3 className="mt-5 text-base font-bold text-gray-900">{card.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-gray-600">{card.description}</p>
                            </Link>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Auction activity</h3>
                            <p className="text-sm text-gray-500">Your live bidding area now has a stable home inside My eBay again.</p>
                        </div>
                        <button
                            onClick={() => setSearchParams({ view: 'auctions' })}
                            className="text-sm font-bold text-[#3665f3] hover:underline"
                        >
                            Open full auctions view
                        </button>
                    </div>

                    <MyAuctionsPanel />
                </section>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#fafafa] pb-12">
            <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 xl:px-4">
                <div className="mb-8">
                    <h1 className="text-[36px] font-black tracking-tight text-gray-900">My eBay</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        A single place for buying activity, account settings, and the shortcuts that should always be visible.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <MyEbaySidebar user={user} activeKey={activeTab} />
                    <main className="min-w-0">{renderMainContent()}</main>
                </div>
            </div>
        </div>
    );
}
