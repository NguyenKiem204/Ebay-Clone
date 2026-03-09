import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart, ChevronDown } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useCategoryStore from '../../store/useCategoryStore';
import useCartStore from '../../features/cart/hooks/useCartStore';

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { categories } = useCategoryStore();
    const totalItems = useCartStore((state) => state.totalItems);
    const queryParams = new URLSearchParams(location.search);
    const isAuctionsActive = location.pathname === '/products' && queryParams.get('filter') === 'auctions';
    const isProductDetails = /^\/products\/[^/]+$/.test(location.pathname);

    return (
        <header className="bg-white">
            {/* Top Bar (Secondary Nav) */}
            <div className="border-b border-gray-100">
                <div className="max-w-[1280px] mx-auto px-4 md:px-8 xl:px-4 py-2 flex justify-between items-center text-[12px] text-[#333]">
                    {/* Left Side */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            {isAuthenticated ? (
                                <>
                                    Hi <strong>{user?.username}</strong>!
                                    <button onClick={logout} className="ml-2 text-secondary hover:underline text-blue-600">Logout</button>
                                </>
                            ) : (
                                <>
                                    Hi! <Link to="/login" className="text-secondary hover:underline text-blue-600">Sign in</Link> or <Link to="/register" className="text-secondary hover:underline text-blue-600">register</Link>
                                </>
                            )}
                        </div>
                        <Link to="#" className="hover:underline">Deals</Link>
                        <Link to="#" className="hover:underline">Brand Outlet</Link>
                        <Link to="#" className="hover:underline">Gift Cards</Link>
                        <Link to="#" className="hover:underline">Help & Contact</Link>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-5">
                        <Link to="#" className="hover:underline">Ship to</Link>
                        <Link to="/seller" className="hover:underline">Sell</Link>
                        <Link to="#" className="hover:underline flex items-center gap-1">Watchlist <ChevronDown size={12} /></Link>
                        <Link to="/profile" className="hover:underline flex items-center gap-1">My eBay <ChevronDown size={12} /></Link>
                        <button className="hover:bg-gray-100 p-1 rounded-full transition-colors relative">
                            <Bell size={20} strokeWidth={1.5} />
                        </button>
                        <Link to="/cart" className="relative hover:bg-gray-100 p-1 rounded-full transition-colors">
                            <ShoppingCart size={22} strokeWidth={1.5} />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Middle Bar (Search & Logo) */}
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 xl:px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    {/* Logo & Category Dropdown */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to="/" className="flex items-center" aria-label="eBay Home">
                            <svg className="w-[110px] h-[44px]" viewBox="0 0 122 48.592"><g><path fill="#E53238" d="M24.355 22.759c-.269-5.738-4.412-7.838-8.826-7.813-4.756.026-8.544 2.459-9.183 7.915zM6.234 26.93c.364 5.553 4.208 8.814 9.476 8.785 3.648-.021 6.885-1.524 7.952-4.763l6.306-.035c-1.187 6.568-8.151 8.834-14.145 8.866C4.911 39.844.043 33.865-.002 25.759c-.05-8.927 4.917-14.822 15.765-14.884 8.628-.048 14.978 4.433 15.033 14.291l.01 1.625z"></path><path fill="#0064D2" d="M46.544 35.429c5.688-.032 9.543-4.148 9.508-10.32s-3.947-10.246-9.622-10.214-9.543 4.148-9.509 10.32 3.974 10.245 9.623 10.214zM30.652.029l6.116-.034.085 15.369c2.978-3.588 7.1-4.65 11.167-4.674 6.817-.037 14.412 4.518 14.468 14.454.045 8.29-5.941 14.407-14.422 14.454-4.463.026-8.624-1.545-11.218-4.681a33.237 33.237 0 01-.19 3.731l-5.994.034c.09-1.915.185-4.364.174-6.322z"></path><path fill="#F5AF02" d="M77.282 25.724c-5.548.216-8.985 1.229-8.965 4.883.013 2.365 1.94 4.919 6.7 4.891 6.415-.035 9.826-3.556 9.794-9.289v-.637c-2.252.02-5.039.054-7.529.152zm13.683 7.506c.01 1.778.071 3.538.232 5.1l-5.688.032a33.381 33.381 0 01-.225-3.825c-3.052 3.8-6.708 4.909-11.783 4.938-7.532.042-11.585-3.915-11.611-8.518-.037-6.665 5.434-9.049 14.954-9.318 2.6-.072 5.529-.1 7.945-.116v-.637c-.026-4.463-2.9-6.285-7.854-6.257-3.68.021-6.368 1.561-6.653 4.2l-6.434.035c.645-6.566 7.53-8.269 13.595-8.3 7.263-.04 13.406 2.508 13.448 10.192z"></path><path fill="#84B817" d="M91.939 19.852l-4.5-8.362 7.154-.04 10.589 20.922 10.328-21.02 6.486-.048-18.707 37.251-6.85.039 5.382-10.348-9.887-18.393"></path></g></svg>
                        </Link>
                        <button className="flex items-center gap-1 text-[13px] text-[#707070] hover:text-blue-600 transition-colors whitespace-nowrap leading-tight text-left">
                            <span>Shop by<br />category</span>
                            <ChevronDown size={14} className="mt-1" />
                        </button>
                    </div>

                    {/* Search Component */}
                    <div className="flex-grow flex items-center gap-2">
                        <form
                            className="flex-grow flex items-center gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const q = formData.get('q');
                                if (q) navigate(`/products?q=${encodeURIComponent(q)}`);
                            }}
                        >
                            <div className="flex-grow flex items-center border-[1.5px] border-black h-11 px-4 gap-3 bg-white rounded-full">
                                <svg className="w-5 h-5 text-[#707070]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    name="q"
                                    className="flex-grow bg-transparent outline-none text-[16px] placeholder-[#707070]"
                                    placeholder="Search for anything"
                                />
                                <div className="h-2/3 border-l border-[#ddd] mx-2 hidden md:block"></div>
                                <select
                                    name="category"
                                    className="hidden md:block bg-transparent outline-none text-[14px] text-[#333] cursor-pointer pr-4 hover:underline border-none"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.slug}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="bg-[#3665f3] hover:bg-[#3055CB] text-white h-11 px-10 rounded-full font-bold text-[15px] transition-colors border-none cursor-pointer flex-shrink-0">
                                Search
                            </button>
                        </form>
                        <Link to="/advanced" className="text-[12px] text-[#707070] hover:text-blue-600 transition-colors whitespace-nowrap ml-1">
                            Advanced
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Bar (Categories) */}
            {!isProductDetails && (
                <div className="max-w-[1280px] mx-auto px-4 md:px-8 xl:px-4 py-3 flex items-center justify-center gap-6 text-[13px] text-[#333] overflow-x-auto hide-scrollbar border-t border-gray-100">
                    <Link to="#" className="hover:text-blue-600 border-b border-transparent hover:border-blue-600 pb-1">Saved</Link>
                    <Link
                        to="/products?filter=auctions"
                        className={`hover:text-blue-600 border-b border-transparent hover:border-blue-600 pb-1 ${isAuctionsActive ? 'font-bold text-secondary' : ''}`}
                    >
                        Auctions
                    </Link>
                    <Link to="/products?category=electronics" className="hover:text-blue-600 border-b border-transparent hover:border-blue-600 pb-1">Electronics</Link>
                    <Link to="/products?category=motors" className="hover:text-blue-600 border-b border-transparent hover:border-blue-600 pb-1">Motors</Link>
                    <Link to="/products?category=fashion" className="hover:text-blue-600 border-b border-transparent hover:border-blue-600 pb-1">Fashion</Link>
                    <Link to="/products?category=collectibles" className="hover:text-blue-600 border-b border-transparent hover:border-blue-600 pb-1">Collectibles and Art</Link>
                    <Link to="/products?category=sports" className="hover:text-blue-600 border-b border-transparent hover:border-blue-600 pb-1">Sports</Link>
                    <Link to="/products?category=health" className="hover:text-blue-600 border-b border-transparent hover:border-blue-600 pb-1">Health & Beauty</Link>
                    <Link to="/products?category=industrial" className="hover:text-blue-600 border-b border-transparent hover:border-blue-600 pb-1">Industrial equipment</Link>
                    <Link to="/products?category=home" className="hover:text-blue-600 border-b border-transparent hover:border-blue-600 pb-1">Home & Garden</Link>
                    <Link to="/products?filter=deals" className="hover:text-blue-600 border-b border-transparent hover:border-blue-600 pb-1">Deals</Link>
                    <Link to="/seller" className="hover:text-blue-600 border-b border-transparent hover:border-blue-600 pb-1">Sell</Link>
                </div>
            )}
        </header>
    );
}
