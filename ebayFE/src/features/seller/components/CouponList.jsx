import { useState, useEffect } from 'react';
import { Search, MoreHorizontal, Calendar, Tag, Percent, Trash2, Edit2, Globe, Grid2x2, Package } from 'lucide-react';
import { format } from 'date-fns';
import couponService from '../services/couponService';
import toast from 'react-hot-toast';
import { Badge } from '../../../components/ui/Badge';

const APPLICABLE_OPTIONS = [
    { value: '', label: 'All types' },
    { value: 'all', label: 'All Items' },
    { value: 'category', label: 'By Category' },
    { value: 'product', label: 'Selected Items' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

function ApplicableBadge({ value }) {
    if (value === 'product') return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
            <Package className="w-3 h-3" /> Selected Items
        </span>
    );
    if (value === 'category') return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
            <Grid2x2 className="w-3 h-3" /> By Category
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
            <Globe className="w-3 h-3" /> All Items
        </span>
    );
}

export default function CouponList({ onEdit, onCreateClick, onCouponsLoaded }) {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        try {
            setLoading(true);
            const data = await couponService.getSellerCoupons();
            const arr = Array.isArray(data) ? data : [];
            setCoupons(arr);
            if (onCouponsLoaded) onCouponsLoaded(arr);
        } catch (error) {
            const message = error.response?.data?.message || 'Không thể tải danh sách mã giảm giá';
            toast.error(message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
        try {
            await couponService.deleteCoupon(id);
            toast.success('Đã xóa mã giảm giá');
            const updated = coupons.filter(c => c.id !== id);
            setCoupons(updated);
            if (onCouponsLoaded) onCouponsLoaded(updated);
        } catch (error) {
            toast.error('Lỗi khi xóa mã giảm giá');
        }
    };

    const filteredCoupons = coupons.filter(c => {
        const matchSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchStatus = statusFilter === ''
            ? true
            : statusFilter === 'active' ? !!c.isActive : !c.isActive;
        const matchType = typeFilter === '' ? true : (c.applicableTo || 'all') === typeFilter;
        return matchSearch && matchStatus && matchType;
    });

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by discount name or code"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md bg-gray-50/50 text-sm focus:bg-white focus:border-secondary transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white cursor-pointer hover:border-gray-300"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        {STATUS_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <select
                        className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-white cursor-pointer hover:border-gray-300"
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                    >
                        {APPLICABLE_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-900">Name / Code</th>
                            <th className="px-6 py-4 font-bold text-gray-900">Status</th>
                            <th className="px-6 py-4 font-bold text-gray-900">Applicable To</th>
                            <th className="px-6 py-4 font-bold text-gray-900">Discount</th>
                            <th className="px-6 py-4 font-bold text-gray-900">Dates</th>
                            <th className="px-6 py-4 font-bold text-gray-900">Usage</th>
                            <th className="px-6 py-4 font-bold text-gray-900 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredCoupons.length > 0 ? filteredCoupons.map((coupon) => (
                            <tr key={coupon.id} className="hover:bg-gray-50 group transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{coupon.code}</div>
                                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{coupon.description || 'No description'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant={coupon.isActive ? 'success' : 'neutral'}>
                                        {coupon.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4">
                                    <ApplicableBadge value={coupon.applicableTo || 'all'} />
                                    {coupon.applicableTo === 'category' && coupon.categoryName && (
                                        <div className="text-[11px] text-gray-400 mt-1">{coupon.categoryName}</div>
                                    )}
                                    {coupon.applicableTo === 'product' && coupon.selectedProductIds?.length > 0 && (
                                        <div className="text-[11px] text-gray-400 mt-1">{coupon.selectedProductIds.length} product(s)</div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-gray-700">
                                        {coupon.discountType === 'percentage' ? <Percent className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />}
                                        <span>{coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `${coupon.discountValue?.toLocaleString()}đ off`}</span>
                                    </div>
                                    <div className="text-[11px] text-gray-400 mt-1">
                                        Min order: {coupon.minOrderAmount ? `${coupon.minOrderAmount.toLocaleString()}đ` : 'None'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-700">
                                    <div className="text-[11px] text-gray-500">
                                        {new Date(coupon.startDate).toLocaleDateString('vi-VN')} →
                                    </div>
                                    <div className="text-[11px] text-gray-500 mb-1">
                                        {new Date(coupon.endDate).toLocaleDateString('vi-VN')}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900">{coupon.usedCount || 0}{coupon.maxUsage ? ` / ${coupon.maxUsage}` : ''}</div>
                                    <div className="text-[11px] text-gray-400">Claims made</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(coupon)}
                                            className="p-1.5 hover:bg-white rounded-md border border-transparent hover:border-gray-200 text-gray-600 hover:text-secondary transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(coupon.id)}
                                            className="p-1.5 hover:bg-white rounded-md border border-transparent hover:border-gray-200 text-gray-600 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="bg-gray-100 p-4 rounded-full">
                                            <Tag className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">No discounts found</h3>
                                            <p className="text-sm text-gray-500">Adjust your filter selection to view your discounts</p>
                                        </div>
                                        <button
                                            onClick={onCreateClick}
                                            className="mt-2 text-secondary font-bold hover:underline"
                                        >
                                            Create a promotion
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
