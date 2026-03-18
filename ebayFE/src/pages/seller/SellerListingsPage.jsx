import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Eye, EyeOff, Pencil, Trash2, Loader2, Search, Package,
    Settings2, ChevronDown, Download, Upload, MoreHorizontal,
    AlertCircle, CheckCircle2, Clock, FileText, Ban, ShoppingBag
} from 'lucide-react';
import useProductStore from '../../store/useProductStore';
import { BASE_URL } from '../../lib/axios';
import toast from 'react-hot-toast';
import CustomizeTableModal from '../../components/seller/CustomizeTableModal';

export default function SellerListingsPage() {
    const navigate = useNavigate();
    const {
        sellerProducts, sellerTotalItems, sellerTotalPages,
        sellerLoading, fetchSellerProducts, toggleProductVisibility,
        deleteProduct, bulkDeleteProducts, bulkUpdateProductsStatus
    } = useProductStore();

    // UI States
    const [statusFilter, setStatusFilter] = useState('active');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState(['photo', 'title', 'price', 'availableQuantity', 'status', 'actions']);
    const [showBulkActions, setShowBulkActions] = useState(false);

    // Confirmation Modals
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const loadProducts = (page = 1, status = statusFilter, keyword = searchKeyword) => {
        fetchSellerProducts({
            Status: status === 'all' ? '' : status,
            Keyword: keyword || undefined,
            Page: page,
            PageSize: 10
        });
        setCurrentPage(page);
        setSelectedIds([]);
    };

    useEffect(() => {
        loadProducts(1, statusFilter, searchKeyword);
    }, [statusFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        loadProducts(1, statusFilter, searchKeyword);
    };

    const handleToggleVisibility = async (product) => {
        const result = await toggleProductVisibility(product.id);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (id) => {
        const result = await deleteProduct(id);
        if (result.success) {
            toast.success(result.message);
            setDeleteConfirm(null);
            if (sellerProducts.length === 1 && currentPage > 1) {
                loadProducts(currentPage - 1);
            } else {
                loadProducts(currentPage);
            }
        } else {
            toast.error(result.error);
        }
    };

    // Bulk Actions
    const handleBulkDelete = async () => {
        const result = await bulkDeleteProducts(selectedIds);
        if (result.success) {
            toast.success(result.message || `Deleted ${selectedIds.length} items`);
            setBulkDeleteConfirm(false);
            setSelectedIds([]);
            loadProducts(1);
        } else {
            toast.error(result.error);
        }
    };

    const handleBulkStatusUpdate = async (status) => {
        const result = await bulkUpdateProductsStatus(selectedIds, status);
        if (result.success) {
            toast.success(result.message || `Updated ${selectedIds.length} items to ${status}`);
            setSelectedIds([]);
            loadProducts(currentPage);
        } else {
            toast.error(result.error);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === sellerProducts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(sellerProducts.map(p => p.id));
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const getImageUrl = (url) => {
        if (!url) return 'https://via.placeholder.com/100x100?text=No+Image';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${BASE_URL}${cleanUrl}`;
    };

    const sidebarItems = [
        { key: 'active', label: 'Active', icon: <CheckCircle2 size={18} /> },
        { key: 'draft', label: 'Drafts', icon: <FileText size={18} /> },
        { key: 'out_of_stock', label: 'Out of stock', icon: <Ban size={18} /> },
        { key: 'ended', label: 'Ended', icon: <EyeOff size={18} /> },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-8 min-h-screen bg-[#f7f7f7] -m-4 p-4 md:p-8">
            {/* Sidebar */}
            <aside className="w-full md:w-64 flex flex-col gap-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            Listings
                        </h3>
                    </div>
                    <nav className="p-2">
                        {sidebarItems.map(item => (
                            <button
                                key={item.key}
                                onClick={() => setStatusFilter(item.key)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${statusFilter === item.key
                                    ? 'bg-secondary/10 text-secondary shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                                {statusFilter === item.key && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary"></div>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
                    <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider">Quick Links</h4>
                    <div className="space-y-2">
                        <Link to="#" className="block text-sm text-gray-600 hover:text-secondary hover:underline">Selling preferences</Link>
                        <Link to="#" className="block text-sm text-gray-600 hover:text-secondary hover:underline">Listing templates</Link>
                        <Link to="#" className="block text-sm text-gray-600 hover:text-secondary hover:underline">Business policies</Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 capitalize">Manage {statusFilter} listings</h1>
                    <Link
                        to="/seller/listings/create"
                        className="bg-secondary text-white px-8 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-secondary/20 flex items-center gap-2"
                    >
                        Create listing
                    </Link>
                </div>

                {/* Filters & Actions Bar */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <form onSubmit={handleSearch} className="relative flex-grow max-w-md">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                placeholder="Search by title, SKU, or item number"
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full outline-none focus:border-secondary text-sm transition-all"
                            />
                        </form>

                        <div className="flex items-center gap-4 ml-auto text-[13px]">
                            <button
                                onClick={() => setIsCustomizeModalOpen(true)}
                                className="text-secondary font-medium hover:underline flex items-center gap-1.5"
                            >
                                <Settings2 size={16} /> Customize table
                            </button>
                            <div className="h-4 w-px bg-gray-200"></div>
                            <button className="text-secondary font-medium hover:underline flex items-center gap-1">
                                Download <ChevronDown size={14} />
                            </button>
                            <div className="h-4 w-px bg-gray-200"></div>
                            <button className="text-secondary font-medium hover:underline">Upload</button>
                        </div>
                    </div>

                    {/* Bulk Actions Header - Matches eBay style */}
                    <div className="flex items-center gap-3 pt-2">
                        <div className="relative group">
                            <button
                                disabled={selectedIds.length === 0}
                                className="px-5 py-1.5 border border-gray-300 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 transition-all"
                            >
                                Edit <ChevronDown size={16} />
                            </button>
                            {selectedIds.length > 0 && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-30 hidden group-hover:block transition-all">
                                    <button
                                        onClick={() => handleBulkStatusUpdate('draft')}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
                                    >
                                        Move to Drafts
                                    </button>
                                    <button
                                        onClick={() => handleBulkStatusUpdate('active')}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
                                    >
                                        Set as Active
                                    </button>
                                    <button
                                        onClick={() => handleBulkStatusUpdate('ended')}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                                    >
                                        End listing (Hide)
                                    </button>
                                    <button
                                        onClick={() => setBulkDeleteConfirm(true)}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 text-red-600"
                                    >
                                        Delete selected
                                    </button>
                                </div>
                            )}
                        </div>
                        <button disabled={selectedIds.length === 0} className="px-5 py-1.5 border border-gray-300 rounded-full text-sm font-bold opacity-50 cursor-not-allowed">Sell similar</button>
                        <button disabled={selectedIds.length === 0} className="px-5 py-1.5 border border-gray-300 rounded-full text-sm font-bold flex items-center gap-2 opacity-50 cursor-not-allowed">Actions <ChevronDown size={16} /></button>

                        {selectedIds.length > 0 && (
                            <span className="text-sm text-red-600 font-bold flex items-center gap-2 animate-pulse">
                                <AlertCircle size={14} /> Please select an action for {selectedIds.length} items
                            </span>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
                    {sellerLoading ? (
                        <div className="flex flex-col justify-center items-center py-32 space-y-4">
                            <Loader2 size={40} className="animate-spin text-secondary" />
                            <p className="text-sm text-gray-500 font-medium">Loading your listings...</p>
                        </div>
                    ) : sellerProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                            <div className="bg-gray-100 p-6 rounded-full mb-6 text-gray-300">
                                <Package size={64} />
                            </div>
                            <p className="font-bold text-xl text-gray-900">We didn't find any results</p>
                            <p className="text-sm mt-2 max-w-xs text-center">
                                Try searching with different criteria or check your filters.
                            </p>
                            <button
                                onClick={() => { setSearchKeyword(''); setStatusFilter('active') }}
                                className="mt-6 text-secondary font-bold hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px] border-collapse">
                                <thead className="bg-gray-50 text-[11px] text-gray-500 font-bold uppercase tracking-wider text-left border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === sellerProducts.length && sellerProducts.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-secondary/20 cursor-pointer"
                                            />
                                        </th>
                                        {visibleColumns.includes('photo') && <th className="px-6 py-4 w-24">Photo</th>}
                                        {visibleColumns.includes('title') && <th className="px-6 py-4 min-w-[300px]">Title</th>}
                                        {visibleColumns.includes('price') && <th className="px-6 py-4">Price</th>}
                                        {visibleColumns.includes('availableQuantity') && <th className="px-6 py-4">Avail. Qty</th>}
                                        {visibleColumns.includes('views') && <th className="px-6 py-4">Views</th>}
                                        {visibleColumns.includes('status') && <th className="px-6 py-4">Status</th>}
                                        {visibleColumns.includes('actions') && <th className="px-6 py-4 text-center">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 italic-none">
                                    {sellerProducts.map((item) => (
                                        <tr key={item.id} className={`hover:bg-blue-50/30 transition-colors group ${selectedIds.includes(item.id) ? 'bg-blue-50/50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => toggleSelectOne(item.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-secondary/20 cursor-pointer"
                                                />
                                            </td>
                                            {visibleColumns.includes('photo') && (
                                                <td className="px-6 py-4">
                                                    <img
                                                        src={getImageUrl(item.thumbnail)}
                                                        className="w-16 h-16 object-cover rounded shadow-sm border border-gray-100"
                                                        alt=""
                                                    />
                                                </td>
                                            )}
                                            {visibleColumns.includes('title') && (
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-secondary hover:underline cursor-pointer line-clamp-2"
                                                        onClick={() => navigate(`/seller/listings/${item.id}/edit`)}>
                                                        {item.title}
                                                    </p>
                                                    <div className="flex gap-2 mt-1.5 text-[11px] text-gray-400 font-medium">
                                                        <span>ID: {item.id}</span>
                                                        <span>•</span>
                                                        <span>{item.categoryName || 'No Category'}</span>
                                                        <span>•</span>
                                                        <span className="text-gray-500 italic">{item.condition}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.includes('price') && (
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900">${item.price?.toFixed(2)}</p>
                                                    {item.shippingFee > 0 && <p className="text-[10px] text-gray-400">+$ {item.shippingFee.toFixed(2)} S&H</p>}
                                                </td>
                                            )}
                                            {visibleColumns.includes('availableQuantity') && (
                                                <td className="px-6 py-4 font-bold text-gray-700">{item.stock}</td>
                                            )}
                                            {visibleColumns.includes('views') && (
                                                <td className="px-6 py-4 text-gray-600 font-medium">{item.viewCount || 0}</td>
                                            )}
                                            {visibleColumns.includes('status') && (
                                                <td className="px-6 py-4">
                                                    {(() => {
                                                        let badgeClass = 'bg-gray-100 text-gray-500 border-gray-200';
                                                        let dotClass = 'bg-gray-400';
                                                        let label = item.status || 'Active';

                                                        if (item.status === 'active' && item.stock > 0) {
                                                            badgeClass = 'bg-green-50 text-green-700 border-green-200';
                                                            dotClass = 'bg-green-500';
                                                            label = 'Active';
                                                        } else if (item.status === 'active' && item.stock === 0) {
                                                            badgeClass = 'bg-red-50 text-red-700 border-red-200';
                                                            dotClass = 'bg-red-500';
                                                            label = 'Out of Stock';
                                                        } else if (item.status === 'draft') {
                                                            badgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                                                            dotClass = 'bg-yellow-500';
                                                            label = 'Draft';
                                                        } else if (item.status === 'ended') {
                                                            badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
                                                            dotClass = 'bg-slate-400';
                                                            label = 'Ended (Hidden)';
                                                        }

                                                        return (
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight shadow-sm border ${badgeClass}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
                                                                {label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            )}
                                            {visibleColumns.includes('actions') && (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => navigate(`/seller/listings/${item.id}/edit`)}
                                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-secondary"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleVisibility(item)}
                                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-yellow-600"
                                                            title={item.isActive ? 'Hide' : 'Show'}
                                                        >
                                                            {item.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(item.id)}
                                                            className="p-2 hover:bg-red-50 rounded-full transition-colors text-gray-400 hover:text-red-600"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer/Pagination */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                            Showing <span className="font-bold text-gray-900">{sellerProducts.length}</span> of <span className="font-bold text-gray-900">{sellerTotalItems}</span> listings
                        </p>
                        {sellerTotalPages > 1 && (
                            <div className="flex gap-1.5">
                                {[...Array(sellerTotalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => loadProducts(i + 1)}
                                        className={`min-w-[32px] h-8 px-2 rounded font-bold text-xs transition-all ${currentPage === i + 1
                                            ? 'bg-secondary text-white shadow-md shadow-secondary/20'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Customization Modal */}
            <CustomizeTableModal
                isOpen={isCustomizeModalOpen}
                onClose={() => setIsCustomizeModalOpen(false)}
                currentColumns={visibleColumns}
                onSave={(cols) => {
                    setVisibleColumns(cols);
                    setIsCustomizeModalOpen(false);
                    toast.success('Table layout updated');
                }}
            />

            {/* Single Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] backdrop-blur-[2px]">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-gray-100">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Delete this listing?</h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            This will permanently remove the item from eBay and all associated data. You cannot undo this action.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="w-full py-3 bg-red-600 text-white rounded-full font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                            >
                                Delete listing
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="w-full py-3 bg-white border border-gray-200 rounded-full font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                Not now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation */}
            {bulkDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] backdrop-blur-[2px]">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Delete {selectedIds.length} listings?</h3>
                        <p className="text-gray-500 text-sm mb-8">
                            Are you sure you want to permanently delete these selected items?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setBulkDeleteConfirm(false)}
                                className="flex-grow py-3 bg-white border border-gray-200 rounded-full font-bold text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="flex-grow py-3 bg-red-600 text-white rounded-full font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200"
                            >
                                Yes, delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
