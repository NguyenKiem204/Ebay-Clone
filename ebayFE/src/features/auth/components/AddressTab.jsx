import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Home, Check } from 'lucide-react';
import api from '../../../lib/axios';
import { toast } from 'react-hot-toast';

export default function AddressTab() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        country: '',
        isDefault: false
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await api.get('/api/Address');
            setAddresses(res.data.data || []);
        } catch (err) {
            toast.error('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAddress) {
                await api.put(`/api/Address/${editingAddress.id}`, formData);
                toast.success('Address updated');
            } else {
                await api.post('/api/Address', formData);
                toast.success('Address added');
            }
            setIsAdding(false);
            setEditingAddress(null);
            setFormData({ fullName: '', phone: '', street: '', city: '', country: '', isDefault: false });
            fetchAddresses();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        try {
            await api.delete(`/api/Address/${id}`);
            toast.success('Address deleted');
            fetchAddresses();
        } catch (err) {
            toast.error('Failed to delete address');
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await api.patch(`/api/Address/${id}/set-default`);
            toast.success('Default address updated');
            fetchAddresses();
        } catch (err) {
            toast.error('Failed to set default address');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#3665F3] border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Shipping Addresses</h2>
                    <p className="text-sm text-gray-500 mt-1">Where should we deliver your orders?</p>
                </div>
                <button
                    onClick={() => {
                        setEditingAddress(null);
                        setFormData({ fullName: '', phone: '', street: '', city: '', country: '', isDefault: false });
                        setIsAdding(true);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#3665F3] text-white text-sm font-bold rounded-full hover:bg-[#382aef] transition-all shadow-sm"
                >
                    <Plus size={18} />
                    Add Address
                </button>
            </div>

            <div className="p-8">
                {isAdding || editingAddress ? (
                    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-900">{editingAddress ? 'Edit Address' : 'New Address'}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3665F3]/20 focus:border-[#3665F3] outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3665F3]/20 focus:border-[#3665F3] outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Street Address</label>
                            <input
                                type="text"
                                name="street"
                                value={formData.street}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3665F3]/20 focus:border-[#3665F3] outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3665F3]/20 focus:border-[#3665F3] outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3665F3]/20 focus:border-[#3665F3] outline-none transition-all"
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer group py-1">
                            <input
                                type="checkbox"
                                name="isDefault"
                                checked={formData.isDefault}
                                onChange={handleInputChange}
                                className="w-5 h-5 rounded border-gray-300 text-[#3665F3] focus:ring-[#3665F3]/20 transition-all cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Set as default shipping address</span>
                        </label>

                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="submit"
                                className="px-8 py-2.5 bg-[#3665F3] text-white font-bold rounded-full hover:bg-[#382aef] transition-all text-sm"
                            >
                                {editingAddress ? 'Update Address' : 'Save Address'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdding(false);
                                    setEditingAddress(null);
                                }}
                                className="px-8 py-2.5 bg-white text-gray-700 font-bold rounded-full border border-gray-300 hover:bg-gray-100 transition-all text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {addresses.length === 0 ? (
                            <div className="col-span-full py-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-gray-900 font-bold text-lg">No addresses yet</h3>
                                <p className="text-gray-500 max-w-xs mx-auto mt-1">Add your first shipping address to start shopping.</p>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="mt-6 text-[#3665F3] font-bold hover:underline"
                                >
                                    + Add your first address
                                </button>
                            </div>
                        ) : (
                            addresses.map((addr) => (
                                <div
                                    key={addr.id}
                                    className={`relative p-6 rounded-xl border-2 transition-all ${
                                        addr.isDefault
                                            ? 'border-[#3665F3] bg-[#3665F3]/[0.02]'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    {addr.isDefault && (
                                        <div className="absolute top-4 right-4 bg-[#3665F3] text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1">
                                            <Check size={10} strokeWidth={4} />
                                            Default
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3 mb-4">
                                        <div className={`p-2 rounded-lg ${addr.isDefault ? 'bg-[#3665F3]/10 text-[#3665F3]' : 'bg-gray-100 text-gray-500'}`}>
                                            <Home size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{addr.fullName}</h4>
                                            <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1 text-sm text-gray-600 mb-6 min-h-[4rem]">
                                        <p className="line-clamp-1">{addr.street}</p>
                                        <p>{addr.city}, {addr.country}</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => {
                                                    setEditingAddress(addr);
                                                    setFormData({
                                                        fullName: addr.fullName,
                                                        phone: addr.phone,
                                                        street: addr.street,
                                                        city: addr.city,
                                                        country: addr.country,
                                                        isDefault: addr.isDefault
                                                    });
                                                }}
                                                className="text-gray-600 hover:text-[#3665F3] transition-colors flex items-center gap-1.5 text-xs font-bold"
                                            >
                                                <Edit2 size={14} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(addr.id)}
                                                className="text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1.5 text-xs font-bold"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </div>

                                        {!addr.isDefault && (
                                            <button
                                                onClick={() => handleSetDefault(addr.id)}
                                                className="text-[#3665F3] hover:underline text-xs font-bold"
                                            >
                                                Set as Default
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
