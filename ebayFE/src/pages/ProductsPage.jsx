import { useState } from 'react';
import { ProductCard } from '../components/ui/ProductCard';
import { mockProducts, mockCategories, mockAuctions } from '../lib/mockData';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function ProductsPage() {
    const [viewMode, setViewMode] = useState('grid');
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const filter = queryParams.get('filter');
    const category = queryParams.get('category');

    // Merge products and auctions for filtering
    const allItems = [
        ...mockProducts.map(p => ({ ...p, listingType: 'buy_it_now' })),
        ...mockAuctions.map(a => ({ ...a, listingType: 'auction', price: a.currentBid }))
    ];

    let filteredProducts = allItems;

    if (filter === 'auctions') {
        filteredProducts = allItems.filter(p => p.listingType === 'auction');
    } else if (category) {
        filteredProducts = allItems.filter(p => p.category === category);
    }

    return (
        <div className="container mx-auto px-4 py-4">
            <nav className="flex text-xs text-gray-500 mb-4 gap-2">
                <Link to="/" className="hover:underline">Home</Link>
                <span>&gt;</span>
                <span className="font-bold text-black">
                    {filter === 'auctions' ? 'Auctions' : (category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Search Results')}
                </span>
            </nav>

            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                <h1 className="text-xl md:text-2xl font-normal">
                    <span className="font-bold">{filteredProducts.length}</span> results
                </h1>
                <div className="flex items-center gap-4">
                    <button className="hidden sm:flex items-center gap-1 px-4 py-1.5 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50">
                        Save this search
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                    </button>

                    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1 border-r border-gray-300 transition-colors ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1 transition-colors ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 hidden sm:block">Sort:</label>
                        <select className="border-gray-300 border rounded text-sm focus:ring-secondary focus:border-secondary py-1.5 pl-3 pr-8">
                            <option>Best Match</option>
                            <option>Price: lowest first</option>
                            <option>Price: highest first</option>
                            <option>Newly Listed</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-[240px] flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-sm mb-3">Category</h3>
                        <ul className="space-y-1">
                            <li><Link className="text-sm font-bold text-black py-1 block" to="#">All Categories</Link></li>
                            {mockCategories.map(cat => (
                                <li key={cat.id}>
                                    <Link className="text-sm text-gray-600 hover:underline block py-1 pl-3" to={`?category=${cat.slug}`}>
                                        {cat.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Price Range */}
                    <div className="border-t border-gray-200 mt-4 pt-4">
                        <h3 className="font-bold text-sm mb-3 flex justify-between items-center cursor-pointer">
                            Price Range
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                        </h3>
                        <div className="flex justify-between items-center gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-2 top-1.5 text-xs text-gray-400">$</span>
                                <input className="w-full text-xs border border-gray-300 rounded pl-5 pr-2 py-1.5" type="text" placeholder="Min" />
                            </div>
                            <span className="text-gray-400">-</span>
                            <div className="relative flex-1">
                                <span className="absolute left-2 top-1.5 text-xs text-gray-400">$</span>
                                <input className="w-full text-xs border border-gray-300 rounded pl-5 pr-2 py-1.5" type="text" placeholder="Max" />
                            </div>
                        </div>
                        <button className="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-sm py-1.5 rounded font-medium">Apply</button>
                    </div>

                    {/* Listing Type */}
                    <div className="border-t border-gray-200 mt-4 pt-4">
                        <h3 className="font-bold text-sm mb-3 flex justify-between items-center cursor-pointer">
                            Listing Type
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                        </h3>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" className="rounded border-gray-300 text-secondary focus:ring-secondary" checked={!filter || filter === 'buy_now'} readOnly />
                                Buy It Now
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" className="rounded border-gray-300 text-secondary focus:ring-secondary" checked={filter === 'auctions'} readOnly onClick={() => navigate(filter === 'auctions' ? '/products' : '/products?filter=auctions')} />
                                Auction
                            </label>
                        </div>
                    </div>
                </aside>

                <div className="flex-1">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {filteredProducts.map((product) => (
                                <div key={product.id} className="flex flex-col sm:flex-row bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="relative w-full sm:w-[200px] sm:flex-shrink-0 bg-gray-50 p-2">
                                        {product.discount > 0 && (
                                            <div className="absolute top-2 left-2 z-10 bg-primary leading-none text-white text-xs font-bold px-2 py-1 rounded">
                                                -{product.discount}%
                                            </div>
                                        )}
                                        <Link to={`/products/${product.id}`} className="block h-48 sm:h-full relative overflow-hidden">
                                            <img
                                                src={product.image}
                                                alt={product.title}
                                                className="absolute inset-0 w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-300"
                                            />
                                        </Link>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <Link to={`/products/${product.id}`} className="text-lg font-medium text-gray-800 hover:underline mb-1">
                                            {product.title}
                                        </Link>
                                        <div className="flex items-center gap-1 mb-2">
                                            <div className="flex text-yellow-400 text-xs shadow-sm">
                                                {'★'.repeat(Math.round(product.rating || 4))}
                                                {'☆'.repeat(5 - Math.round(product.rating || 4))}
                                            </div>
                                            <span className="text-xs text-gray-500">({product.reviews || 0} reviews)</span>
                                        </div>

                                        <div className="text-xs text-gray-600 mb-4">
                                            <span className="font-semibold text-gray-800">Condition:</span> <span className="text-gray-600">{product.condition || 'New'}</span>
                                        </div>

                                        <div className="mt-auto flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                                            <div>
                                                <div className="text-2xl font-bold text-gray-900">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price * 25000)}
                                                </div>
                                                {product.originalPrice && product.originalPrice > product.price && (
                                                    <div className="text-sm text-gray-500 line-through">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice * 25000)}
                                                    </div>
                                                )}
                                                <div className="text-xs font-semibold text-blue-700 mt-1">
                                                    {product.isFreeShipping ? 'Free shipping' : '+$15.50 shipping'}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">Seller: {product.seller || 'ebay_seller'}</div>
                                            </div>

                                            <div className="flex sm:flex-col gap-2">
                                                <button className="flex-1 bg-secondary text-white font-medium px-6 py-2 rounded-full hover:bg-blue-700 transition">
                                                    {product.listingType === 'auction' ? 'Bid now' : 'Add to cart'}
                                                </button>
                                                <button className="flex-1 bg-white border border-secondary text-secondary font-medium px-6 py-2 rounded-full hover:bg-blue-50 transition">
                                                    Watch
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-center items-center gap-2 mt-12 mb-8">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-white font-bold">1</button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 font-medium">2</button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 font-medium">3</button>
                        <span className="mx-1">...</span>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 font-medium">10</button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
