import { useState, useEffect } from 'react';
import { ProductCard } from '../components/ui/ProductCard';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useProductStore from '../store/useProductStore';
import useCategoryStore from '../store/useCategoryStore';
import { useRequireAuth } from '../hooks/useRequireAuth';
import useCurrencyStore from '../store/useCurrencyStore';

export default function ProductsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        isVietnamese,
        exchangeRate,
        formatPrice
    } = useCurrencyStore();
    const [viewMode, setViewMode] = useState('grid');
    const {
        searchResults: filteredProducts,
        totalItems,
        loading,
        searchProducts
    } = useProductStore();
    const { categories, fetchCategories, navGroups } = useCategoryStore();
    const { handleSecureAction } = useRequireAuth();

    const queryParams = new URLSearchParams(location.search);
    const filter = queryParams.get('filter');
    const categoryQuery = queryParams.get('category');
    const navCategorySlugs = queryParams.getAll('categorySlugs');
    const keyword = queryParams.get('q');
    const page = parseInt(queryParams.get('page') || '1');
    const sortBy = queryParams.get('sortBy') || 'relevance';
    const minPrice = queryParams.get('minPrice');
    const maxPrice = queryParams.get('maxPrice');
    const isAuctionFilter = filter === 'auctions';
    const isAuctionSort = sortBy === 'ending_soonest' || sortBy === 'most_bids';

    const activeCategory = categoryQuery || (navCategorySlugs.length === 1 ? navCategorySlugs[0] : '');

    const getCategoryName = (slug) => {
        if (!slug) return '';
        const group = navGroups?.find(g => g.slug === slug);
        if (group) return group.name;
        
        const findInTree = (cats) => {
            if (!cats) return null;
            for (let c of cats) {
                if (c.slug === slug) return c.name;
                if (c.subCategories) {
                    const found = findInTree(c.subCategories);
                    if (found) return found;
                }
            }
            return null;
        };
        
        const catName = findInTree(categories);
        if (catName) return catName;
        
        return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const displayCategoryName = filter === 'auctions' ? 'Auctions' : getCategoryName(activeCategory) || 'Search Results';

    useEffect(() => {
        const params = new URLSearchParams();
        if (keyword) params.append('Keyword', keyword);
        params.append('Page', page.toString());
        params.append('PageSize', '20');

        if (filter === 'auctions') params.append('IsAuction', 'true');
        if (filter === 'deals') params.append('MaxPrice', '1000000');
        if (filter === 'auctions' && sortBy === 'ending_soonest') params.append('EndingSoon', 'true');
        
        if (sortBy) params.append('SortBy', sortBy);
        if (minPrice) params.append('MinPrice', minPrice);
        if (maxPrice && filter !== 'deals') params.append('MaxPrice', maxPrice);

        const allSlugs = [...navCategorySlugs];
        if (categoryQuery && !allSlugs.includes(categoryQuery)) {
            allSlugs.push(categoryQuery);
        }

        allSlugs.forEach(slug => {
            params.append('CategorySlugs', slug);
        });

        searchProducts(params);
        if (categories.length === 0) fetchCategories();
    }, [location.search, searchProducts, fetchCategories, categories.length, keyword, page, filter, sortBy, minPrice, maxPrice, categoryQuery, navCategorySlugs]);

    if (loading && filteredProducts.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-4">
            <nav className="flex text-xs text-gray-500 mb-4 gap-2">
                <Link to="/" className="hover:underline">Home</Link>
                <span>&gt;</span>
                <span className="font-bold text-black">
                    {displayCategoryName}
                </span>
            </nav>

            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                <h1 className="text-xl md:text-2xl font-normal">
                    <span className="font-bold">{totalItems}</span> results
                </h1>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => handleSecureAction(() => {})} 
                        className="hidden sm:flex items-center gap-1 px-4 py-1.5 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50"
                    >
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
                        <select
                            value={isAuctionFilter ? sortBy : (isAuctionSort ? 'relevance' : sortBy)}
                            className="border-gray-300 border rounded text-sm focus:ring-secondary focus:border-secondary py-1.5 pl-3 pr-8"
                            onChange={(e) => {
                                queryParams.set('sortBy', e.target.value);
                                navigate(`?${queryParams.toString()}`);
                            }}
                        >
                            <option value="relevance">Relevance</option>
                            <option value="price_asc">Price: lowest first</option>
                            <option value="price_desc">Price: highest first</option>
                            <option value="newest">Newly listed</option>
                            <option value="ending_soonest" disabled={!isAuctionFilter}>Ending soonest</option>
                            <option value="most_bids" disabled={!isAuctionFilter}>Most bids</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-[240px] flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-sm mb-3">Category</h3>
                        <ul className="space-y-1">
                            <li><Link className="text-sm font-bold text-black py-1 block" to="/products">All Categories</Link></li>
                            {categories.map(cat => (
                                <li key={cat.id}>
                                    <Link className={`text-sm hover:underline block py-1 pl-3 ${activeCategory === cat.slug ? 'font-bold text-blue-600' : 'text-gray-600'}`} to={`?category=${cat.slug}`}>
                                        {cat.name}
                                    </Link>
                                    {cat.subCategories && cat.subCategories.length > 0 && activeCategory === cat.slug && (
                                        <ul className="pl-4 space-y-1 mt-1">
                                            {cat.subCategories.map(sub => (
                                                <li key={sub.id}>
                                                    <Link className="text-[13px] text-gray-500 hover:underline block py-1" to={`?category=${sub.slug}`}>
                                                        {sub.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="border-t border-gray-200 mt-4 pt-4">
                        <h3 className="font-bold text-sm mb-3 flex justify-between items-center cursor-pointer">
                            Price Range
                        </h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            let min = formData.get('min')?.toString().replace(/[^0-9.]/g, '') || '';
                            let max = formData.get('max')?.toString().replace(/[^0-9.]/g, '') || '';
                            
                            if (isVietnamese && exchangeRate > 0) {
                                if (min) min = (parseFloat(min) / exchangeRate).toFixed(2);
                                if (max) max = (parseFloat(max) / exchangeRate).toFixed(2);
                            }

                            if (min) queryParams.set('minPrice', min); else queryParams.delete('minPrice');
                            if (max) queryParams.set('maxPrice', max); else queryParams.delete('maxPrice');
                            queryParams.set('page', '1'); // Reset to page 1 on filter change
                            navigate(`?${queryParams.toString()}`);
                        }} className="space-y-3">
                            <div className="flex justify-between items-center gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-2 top-1.5 text-xs text-gray-400">
                                        {isVietnamese ? '₫' : '$'}
                                    </span>
                                    <input 
                                        name="min" 
                                        className="w-full text-xs border border-gray-300 rounded pl-5 pr-2 py-1.5" 
                                        type="text" 
                                        placeholder="Min" 
                                        defaultValue={minPrice ? (isVietnamese ? Math.round(parseFloat(minPrice) * exchangeRate) : minPrice) : ''}
                                    />
                                </div>
                                <span className="text-gray-400">-</span>
                                <div className="relative flex-1">
                                    <span className="absolute left-2 top-1.5 text-xs text-gray-400">
                                        {isVietnamese ? '₫' : '$'}
                                    </span>
                                    <input 
                                        name="max" 
                                        className="w-full text-xs border border-gray-300 rounded pl-5 pr-2 py-1.5" 
                                        type="text" 
                                        placeholder="Max" 
                                        defaultValue={maxPrice ? (isVietnamese ? Math.round(parseFloat(maxPrice) * exchangeRate) : maxPrice) : ''}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-gray-100 hover:bg-gray-200 text-sm py-1.5 rounded font-medium">Apply</button>
                        </form>
                    </div>

                    <div className="border-t border-gray-200 mt-4 pt-4">
                        <h3 className="font-bold text-sm mb-3">Listing Type</h3>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-secondary focus:ring-secondary"
                                    checked={!filter}
                                    onChange={() => {
                                        queryParams.delete('filter');
                                        navigate(`?${queryParams.toString()}`);
                                    }}
                                />
                                All Results
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-secondary focus:ring-secondary"
                                    checked={filter === 'auctions'}
                                    onChange={() => {
                                        if (filter === 'auctions') {
                                            queryParams.delete('filter');
                                            if (isAuctionSort) queryParams.set('sortBy', 'relevance');
                                        } else {
                                            queryParams.set('filter', 'auctions');
                                        }
                                        navigate(`?${queryParams.toString()}`);
                                    }}
                                />
                                Auction
                            </label>
                        </div>
                    </div>
                </aside>

                <div className="flex-1">
                    {filteredProducts.length > 0 ? (
                        <>
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
                                                <Link to={`/products/${product.id}`} className="block h-48 sm:h-full relative overflow-hidden">
                                                    <img
                                                        src={product.thumbnail}
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
                                                        {'★'.repeat(Math.round(product.rating || 5))}
                                                        {'☆'.repeat(5 - Math.round(product.rating || 5))}
                                                    </div>
                                                    <span className="text-xs text-gray-500">({product.reviewCount || 0} reviews)</span>
                                                </div>

                                                <div className="text-xs text-gray-600 mb-4">
                                                    <span className="font-semibold text-gray-800">Condition:</span> <span className="text-gray-600">{product.condition || 'New'}</span>
                                                </div>

                                                <div className="mt-auto flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                                                    <div>
                                                        <div className="text-2xl font-bold text-gray-900">
                                                            {formatPrice(product.price)}
                                                        </div>
                                                        <div className="text-xs font-semibold text-blue-700 mt-1">
                                                            {product.shippingFee === 0
                                                                ? 'Free shipping'
                                                                : `+${formatPrice(product.shippingFee)} shipping`}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">Seller: {product.sellerName || 'ebay_seller'}</div>
                                                    </div>

                                                    <div className="flex sm:flex-col gap-2">
                                                        <button className="flex-1 bg-secondary text-white font-medium px-6 py-2 rounded-full hover:bg-blue-700 transition">
                                                            {product.isAuction ? 'Bid now' : 'Add to cart'}
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

                            {/* Pagination */}
                            <div className="flex justify-center items-center gap-2 mt-12 mb-8">
                                <button
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30"
                                    disabled={page === 1}
                                    onClick={() => {
                                        queryParams.set('page', (page - 1).toString());
                                        navigate(`?${queryParams.toString()}`);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>
                                <span className="font-medium text-sm">Page {page} of {Math.ceil(totalItems / 20) || 1}</span>
                                <button
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30"
                                    disabled={page >= Math.ceil(totalItems / 20)}
                                    onClick={() => {
                                        queryParams.set('page', (page + 1).toString());
                                        navigate(`?${queryParams.toString()}`);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20">
                            <h2 className="text-xl text-gray-600">No results found matching your criteria.</h2>
                            <Link to="/products" className="text-blue-600 hover:underline mt-4 block">Clear all filters</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
