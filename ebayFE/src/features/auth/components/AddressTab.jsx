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
            await api.patch(`/api/Address/${id}/default`);
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
        <div className="max-w-[800px]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-medium text-[#333]">Addresses</h1>
                    <p className="text-[14px] text-gray-500 mt-1">Manage your delivery locations</p>
                </div>
                {!isAdding && !editingAddress && (
                    <button
                        onClick={() => {
                            setEditingAddress(null);
                            setFormData({ fullName: '', phone: '', street: '', city: '', country: '', isDefault: false });
                            setIsAdding(true);
                        }}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 transition-all"
                    >
                        <Plus size={18} />
                        Add Address
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {isAdding || editingAddress ? (
                    <form onSubmit={handleSubmit} className="p-6 border border-gray-200 rounded-xl bg-gray-50/50">
                        <h3 className="text-[16px] font-bold text-[#333] mb-6">{editingAddress ? 'Edit address' : 'Add a new address'}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="relative border border-gray-400 p-2 pt-5 rounded-md focus-within:border-blue-600 bg-white">
                                <label className="absolute top-1 left-2 text-[11px] text-gray-500 font-medium">Full name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full outline-none text-[15px] text-[#333]"
                                />
                            </div>
                            <div className="relative border border-gray-400 p-2 pt-5 rounded-md focus-within:border-blue-600 bg-white">
                                <label className="absolute top-1 left-2 text-[11px] text-gray-500 font-medium">Phone number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full outline-none text-[15px] text-[#333]"
                                />
                            </div>
                        </div>

                        <div className="relative border border-gray-400 p-2 pt-5 rounded-md focus-within:border-blue-600 bg-white mb-4">
                            <label className="absolute top-1 left-2 text-[11px] text-gray-500 font-medium">Street address</label>
                            <input
                                type="text"
                                name="street"
                                value={formData.street}
                                onChange={handleInputChange}
                                required
                                className="w-full outline-none text-[15px] text-[#333]"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="relative border border-gray-400 p-2 pt-5 rounded-md focus-within:border-blue-600 bg-white">
                                <label className="absolute top-1 left-2 text-[11px] text-gray-500 font-medium">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full outline-none text-[15px] text-[#333]"
                                />
                            </div>
                            <div className="relative border border-gray-400 p-2 pt-5 rounded-md focus-within:border-blue-600 bg-white">
                                <label className="absolute top-1 left-2 text-[11px] text-gray-500 font-medium">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full outline-none text-[15px] text-[#333]"
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer mb-8">
                            <input
                                type="checkbox"
                                name="isDefault"
                                checked={formData.isDefault}
                                onChange={handleInputChange}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-[14px] text-[#333]">Set as default shipping address</span>
                        </label>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdding(false);
                                    setEditingAddress(null);
                                }}
                                className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-full font-bold text-sm hover:bg-blue-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700"
                            >
                                {editingAddress ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {addresses.length === 0 ? (
                            <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-xl">
                                <MapPin size={40} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500">No addresses saved yet.</p>
                            </div>
                        ) : (
                            addresses.map((addr) => (
                                <div
                                    key={addr.id}
                                    className={`p-6 border rounded-xl transition-all ${
                                        addr.isDefault ? 'border-blue-600 bg-blue-50/10' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-[#333]">{addr.fullName}</h4>
                                                {addr.isDefault && (
                                                    <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase">Default</span>
                                                )}
                                            </div>
                                            <p className="text-[14px] text-gray-600">{addr.phone}</p>
                                        </div>
                                        <div className="flex gap-3">
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
                                                className="text-gray-400 hover:text-blue-600"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            {!addr.isDefault && (
                                                <button onClick={() => handleDelete(addr.id)} className="text-gray-400 hover:text-red-600">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-[14px] text-gray-700 leading-relaxed mb-4 uppercase">
                                        {addr.street}<br />
                                        {addr.city}, {addr.country}
                                    </div>
                                    {!addr.isDefault && (
                                        <button
                                            onClick={() => handleSetDefault(addr.id)}
                                            className="text-blue-600 hover:underline text-[13px] font-bold"
                                        >
                                            Set as Default
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
