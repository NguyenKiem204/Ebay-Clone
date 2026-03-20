import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart, ChevronDown } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useCategoryStore from '../../store/useCategoryStore';
import useCartStore from '../../features/cart/hooks/useCartStore';
import { useRequireAuth } from '../../hooks/useRequireAuth';

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();

    const { user, isAuthenticated, logout } = useAuthStore();
    const { categories, navGroups, fetchNavGroups } = useCategoryStore();
    const totalItems = useCartStore((state) => state.totalItems);
    const { handleSecureAction } = useRequireAuth();

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    useEffect(() => {
        fetchNavGroups();
    }, [fetchNavGroups]);

    const queryParams = new URLSearchParams(location.search);
    const isAuctionsActive =
        location.pathname === '/products' &&
        queryParams.get('filter') === 'auctions';

    const isProductDetails = /^\/products\/[^/]+$/.test(location.pathname);

    return (
        <header className="bg-white">
            {/* TOP BAR */}
            <div className="border-b border-gray-100">
                <div className="max-w-[1280px] mx-auto px-4 md:px-8 xl:px-4 py-2 flex justify-between items-center text-[12px] text-[#333]">

                    {/* LEFT */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center gap-1">
                            {isAuthenticated ? (
                                <>
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center gap-1 hover:underline"
                                    >
                                        Hi <strong>{user?.firstName || user?.username}</strong>
                                        <ChevronDown size={12} className={`transition ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isUserMenuOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            />
                                            <div className="absolute top-full left-0 mt-2 w-56 bg-white border rounded-lg shadow-xl z-50">
                                                <div className="p-3 border-b">
                                                    <p className="font-bold">
                                                        {user?.firstName} {user?.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {user?.email}
                                                    </p>
                                                </div>

                                                <Link
                                                    to="/profile"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className="block px-4 py-2 hover:bg-gray-50"
                                                >
                                                    Profile
                                                </Link>

                                                <button
                                                    onClick={() => {
                                                        logout();
                                                        setIsUserMenuOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50"
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    Hi!{' '}
                                    <Link to="/login" className="text-blue-600 hover:underline">
                                        Sign in
                                    </Link>
                                </>
                            )}
                        </div>

                        <Link to="#" className="hover:underline">Deals</Link>
                        <Link to="#" className="hover:underline">Brand Outlet</Link>
                        <Link to="#" className="hover:underline">Gift Cards</Link>
                        <Link to="#" className="hover:underline">Help & Contact</Link>
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-5">
                        <Link to="#" className="hover:underline">Ship to</Link>
                        <Link to="/seller" className="hover:underline">Sell</Link>

                        <button
                            onClick={() =>
                                handleSecureAction(() => navigate('/watchlist'), '/watchlist')
                            }
                            className="hover:underline flex items-center gap-1"
                        >
                            Watchlist <ChevronDown size={12} />
                        </button>

                        <Link to="/profile" className="hover:underline flex items-center gap-1">
                            My eBay <ChevronDown size={12} />
                        </Link>

                        <button className="hover:bg-gray-100 p-1 rounded-full">
                            <Bell size={20} />
                        </button>

                        <Link to="/cart" className="relative hover:bg-gray-100 p-1 rounded-full">
                            <ShoppingCart size={22} />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* SEARCH */}
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 xl:px-4 py-3 border-b border-gray-200">
                <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const q = formData.get('q');
                        const category = formData.get('category');

                        const params = new URLSearchParams();
                        if (q) params.append('q', q);
                        if (category) params.append('categorySlugs', category);

                        navigate(`/products?${params.toString()}`);
                    }}
                >
                    <input
                        type="text"
                        name="q"
                        placeholder="Search for anything"
                        className="flex-grow border px-4 py-2 rounded-full"
                    />

                    <select name="category" className="border px-2 py-2 rounded">
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.slug}>{c.name}</option>
                        ))}
                    </select>

                    <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold">
                        Search
                    </button>
                </form>
            </div>

            {/* CATEGORY NAV */}
            {!isProductDetails && (
                <div className="max-w-[1280px] mx-auto px-4 py-3 flex gap-6 flex-wrap border-t">

                    <button
                        onClick={() =>
                            handleSecureAction(() => navigate('/saved'), '/saved')
                        }
                        className="hover:text-blue-600"
                    >
                        Saved
                    </button>

                    <Link
                        to="/products?filter=auctions"
                        className={isAuctionsActive ? 'font-bold text-blue-600' : ''}
                    >
                        Auctions
                    </Link>

                    {navGroups?.map(group => (
                        <div key={group.slug} className="relative group">
                            <Link to={`/products?categorySlugs=${group.slug}`}>
                                {group.name}
                            </Link>

                            {group.categories?.length > 0 && (
                                <div className="absolute hidden group-hover:block bg-white border shadow-lg p-4 z-50 min-w-[300px]">
                                    {group.categories.map(cat => (
                                        <div key={cat.slug}>
                                            <Link
                                                to={`/products?categorySlugs=${cat.slug}`}
                                                className="font-bold block"
                                            >
                                                {cat.name}
                                            </Link>

                                            {cat.subCategories?.map(sub => (
                                                <Link
                                                    key={sub.slug}
                                                    to={`/products?categorySlugs=${sub.slug}`}
                                                    className="block text-sm text-gray-500"
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    <Link to="/products?filter=deals">Deals</Link>
                    <Link to="/seller">Sell</Link>
                </div>
            )}
        </header>
    );
}