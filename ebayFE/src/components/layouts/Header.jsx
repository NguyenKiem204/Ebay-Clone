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
    }, []);

    const queryParams = new URLSearchParams(location.search);
    const isAuctionsActive =
        location.pathname === '/products' &&
        queryParams.get('filter') === 'auctions';

    const isProductDetails = /^\/products\/[^/]+$/.test(location.pathname);

    return (
        <header className="bg-white">

            {/* TOP BAR */}
            <div className="border-b border-gray-100">
                <div className="max-w-[1280px] mx-auto px-4 py-2 flex justify-between text-[12px]">

                    {/* LEFT */}
                    <div className="flex gap-4 items-center">

                        {/* USER */}
                        <div className="relative">
                            {isAuthenticated ? (
                                <>
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center gap-1 hover:underline"
                                    >
                                        Hi <strong>{user?.firstName || user?.username}</strong>
                                        <ChevronDown size={12} />
                                    </button>

                                    {isUserMenuOpen && (
                                        <div className="absolute top-full mt-2 w-56 bg-white shadow-lg border rounded z-50">
                                            <div className="p-3 border-b">
                                                <p className="font-bold">
                                                    {user?.firstName} {user?.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {user?.email}
                                                </p>
                                            </div>

                                            <Link to="/profile" className="block px-4 py-2 hover:bg-gray-50">
                                                Profile
                                            </Link>

                                            <button
                                                onClick={logout}
                                                className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-50"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    Hi! <Link to="/login">Sign in</Link>
                                </>
                            )}
                        </div>

                        <Link to="#">Deals</Link>
                    </div>

                    {/* RIGHT */}
                    <div className="flex gap-4 items-center">
                        <button onClick={() => handleSecureAction(() => navigate('/watchlist'))}>
                            Watchlist
                        </button>

                        <Link to="/cart" className="relative">
                            <ShoppingCart size={20} />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* SEARCH */}
            <div className="p-4 border-b">
                <form
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
                    className="flex gap-2"
                >
                    <input name="q" placeholder="Search..." className="border px-3 py-2 flex-grow" />

                    <select name="category">
                        <option value="">All</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.slug}>{c.name}</option>
                        ))}
                    </select>

                    <button className="bg-blue-500 text-white px-4">Search</button>
                </form>
            </div>

            {/* CATEGORY NAV */}
            {!isProductDetails && (
                <div className="flex gap-4 p-3 border-t flex-wrap">

                    <button onClick={() => handleSecureAction(() => navigate('/saved'))}>
                        Saved
                    </button>

                    <Link to="/products?filter=auctions">Auctions</Link>

                    {navGroups?.map(group => (
                        <div key={group.slug} className="relative group">
                            <Link to={`/products?categorySlugs=${group.slug}`}>
                                {group.name}
                            </Link>

                            {group.categories && (
                                <div className="absolute hidden group-hover:block bg-white shadow p-3">
                                    {group.categories.map(cat => (
                                        <Link key={cat.slug} to={`/products?categorySlugs=${cat.slug}`}>
                                            {cat.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                </div>
            )}
        </header>
    );
}