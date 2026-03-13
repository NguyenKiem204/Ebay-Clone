import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Trash2, Loader2, Search, Package } from 'lucide-react';
import useProductStore from '../../store/useProductStore';
import { BASE_URL } from '../../lib/axios';
import toast from 'react-hot-toast';

export default function SellerListingsPage() {
    const navigate = useNavigate();
    const {
        sellerProducts, sellerTotalItems, sellerTotalPages,
        sellerLoading, fetchSellerProducts, toggleProductVisibility, deleteProduct
    } = useProductStore();

    const [activeTab, setActiveTab] = useState('active');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const loadProducts = (page = 1, status = activeTab, keyword = searchKeyword) => {
        fetchSellerProducts({
            Status: status === 'all' ? '' : status,
            Keyword: keyword || undefined,
            Page: page,
            PageSize: 10
        });
        setCurrentPage(page);
    };

    useEffect(() => {
        loadProducts(1, activeTab, searchKeyword);
    }, [activeTab]);

    const handleSearch = (e) => {
        e.preventDefault();
        loadProducts(1, activeTab, searchKeyword);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const handleToggleVisibility = async (product) => {
        const result = await toggleProductVisibility(product.id);
        if (result.success) {
            toast.success(result.message);
            loadProducts(currentPage);
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (id) => {
        const result = await deleteProduct(id);
        if (result.success) {
            toast.success(result.message);
            setDeleteConfirm(null);
            loadProducts(currentPage);
        } else {
            toast.error(result.error);
        }
    };

    const getImageUrl = (url) => {
        if (!url) return 'https://via.placeholder.com/100x100?text=No+Image';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${BASE_URL}${cleanUrl}`;
    };

    const tabs = [
        { key: 'active', label: 'Active' },
        { key: 'hidden', label: 'Hidden' },
        { key: 'all', label: 'All' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-4 border-b border-gray-200">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                ? 'border-secondary text-secondary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <Link
                    to="/seller/listings/create"
                    className="bg-primary text-white px-8 py-2 rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    Create Listing
                </Link>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-grow">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="Search your listings..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-secondary text-sm"
                    />
                </div>
                <button
                    type="submit"
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors"
                >
                    Search
                </button>
            </form>

            {/* Products Table */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        Total: <span className="font-bold">{sellerTotalItems} listings</span>
                    </p>
                </div>

                {sellerLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 size={28} className="animate-spin text-secondary" />
                    </div>
                ) : sellerProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Package size={48} className="mb-4" />
                        <p className="font-bold text-lg">No listings found</p>
                        <p className="text-sm mt-1">
                            {activeTab === 'active' ? 'Create your first listing to start selling!' : 'No items match your current filter.'}
                        </p>
                        {activeTab === 'active' && (
                            <Link
                                to="/seller/listings/create"
                                className="mt-4 bg-secondary text-white px-8 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors"
                            >
                                Create Listing
                            </Link>
                        )}
                    </div>
                ) : (
                    <table className="w-full text-[13px]">
                        <thead className="bg-gray-50/50 text-[10px] text-gray-500 font-bold uppercase tracking-wider text-left">
                            <tr>
                                <th className="px-6 py-3 w-28">IMAGE</th>
                                <th className="px-6 py-3">TITLE</th>
                                <th className="px-6 py-3">PRICE</th>
                                <th className="px-6 py-3">QTY</th>
                                <th className="px-6 py-3">STATUS</th>
                                <th className="px-6 py-3">VIEWS</th>
                                <th className="px-6 py-3">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sellerProducts.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <img
                                            src={getImageUrl(item.thumbnail)}
                                            className="w-16 h-16 object-cover rounded border border-gray-100"
                                            alt=""
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-secondary hover:underline cursor-pointer line-clamp-2"
                                            onClick={() => navigate(`/seller/listings/${item.id}/edit`)}>
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {item.categoryName} • {item.condition}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900">${item.price?.toFixed(2)}</p>
                                        <p className="text-[11px] text-gray-500">
                                            {item.shippingFee === 0
                                                ? <span className="text-green-600 font-bold">Free shipping</span>
                                                : `+ $${item.shippingFee?.toFixed(2)} Shipping`
                                            }
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-700">{item.stock}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${item.isActive
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                            {item.isActive ? 'Active' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-700">{item.viewCount}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/seller/listings/${item.id}/edit`)}
                                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-500 hover:text-secondary"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleVisibility(item)}
                                                className="p-2 hover:bg-yellow-50 rounded-lg transition-colors text-gray-500 hover:text-yellow-600"
                                                title={item.isActive ? 'Hide' : 'Show'}
                                            >
                                                {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(item.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-500"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {sellerTotalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex justify-center gap-2">
                        {[...Array(sellerTotalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => loadProducts(i + 1)}
                                className={`w-9 h-9 rounded-lg font-bold text-sm transition-colors ${currentPage === i + 1
                                    ? 'bg-secondary text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Delete listing?</h3>
                        <p className="text-gray-500 text-sm mb-8">
                            This action cannot be undone. The product and all its images will be permanently deleted.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-6 py-2 border border-gray-300 rounded-full font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="px-6 py-2 bg-red-600 text-white rounded-full font-bold text-sm hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
